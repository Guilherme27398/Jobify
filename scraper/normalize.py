"""Normalização das vagas em bruto (ScrapedJob) com Pandas.

Transforma o que o scraper extraiu em linhas limpas e prontas para a BD:
- deduplica por (source, external_id)
- descarta linhas sem os campos obrigatórios (external_id, title, url)
- normaliza os rótulos do LinkedIn (PT/EN) para os valores dos enums da BD
- extrai o distrito da localização em bruto
- faz parsing best-effort de salários em EUR (a maioria das vagas não os publica)
- extrai skills cruzando o texto da vaga com a taxonomia do setor (queries.yml)

Uso como script (a partir da raiz do repo):
    scraper/.venv/Scripts/python scraper/normalize.py --demo
    scraper/.venv/Scripts/python scraper/normalize.py --query "java spring boot" --sector tecnologia --limit 5
"""

from __future__ import annotations

import argparse
import re

import pandas as pd

from queries import ExpectedSkill, load_config

# ── Mapeamentos de rótulos → valores dos enums da BD ──────────────────────────
# O LinkedIn devolve os níveis em PT (locale pt-PT) ou EN; cobrimos os dois.

SENIORITY_MAP = {
    "estágio": "intern", "internship": "intern",
    "nível inicial": "junior", "iniciante": "junior", "entry level": "junior",
    "júnior": "junior", "junior": "junior",
    "assistente": "mid", "associate": "mid",
    "pleno-sénior": "senior", "pleno sénior": "senior", "mid-senior level": "senior", "sénior": "senior", "senior": "senior",
    "diretor": "lead", "director": "lead",
    "executivo": "head", "executive": "head",
}

CONTRACT_MAP = {
    "tempo integral": "full_time", "full-time": "full_time", "full time": "full_time",
    "meio período": "part_time", "part-time": "part_time", "part time": "part_time",
    "estágio": "internship", "internship": "internship",
    "contrato": "freelance", "contract": "freelance", "freelance": "freelance", "prestação de serviços": "freelance",
    "temporário": "temporary", "temporary": "temporary",
}

# Distritos de Portugal continental + regiões autónomas, para o mapa geográfico.
DISTRICTS = {
    "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora",
    "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém",
    "Setúbal", "Viana do Castelo", "Vila Real", "Viseu", "Açores", "Madeira",
}

REMOTE_KEYWORDS = [
    ("hybrid", ["híbrido", "hybrid", "regime híbrido"]),
    ("remote", ["remoto", "remote", "teletrabalho", "100% remoto", "fully remote"]),
    ("on_site", ["presencial", "on-site", "on site", "no local"]),
]

# Um número com separadores de milhar (. ou espaço) opcionalmente seguido de 'k'/'mil'
# e adjacente a um indicador de euros — antes (€ 30.000) ou depois (30000 EUR).
_NUM = r"\d[\d.\s]*\d|\d"
_EURO_AMOUNT = re.compile(
    rf"(?:€\s*({_NUM})\s*(k|mil)?)|(?:({_NUM})\s*(k|mil)?\s*(?:€|eur\b|euros?))",
    re.IGNORECASE,
)


def normalize_seniority(raw: str | None) -> str | None:
    if not raw:
        return None
    key = raw.strip().lower()
    return SENIORITY_MAP.get(key)


def normalize_contract(raw: str | None) -> str | None:
    if not raw:
        return None
    key = raw.strip().lower()
    return CONTRACT_MAP.get(key)


def normalize_district(location_raw: str | None) -> str | None:
    if not location_raw:
        return None
    parts = [p.strip() for p in location_raw.split(",")]
    for part in parts:                       # 1º: parte que É exatamente um distrito
        if part in DISTRICTS:
            return part
    for part in parts:                       # 2º: distrito contido numa parte ("Lisboa e Região")
        for district in DISTRICTS:
            if district.lower() in part.lower():
                return district
    return None


def detect_remote_type(*texts: str | None) -> str | None:
    hay = " ".join(t for t in texts if t).lower()
    for value, keywords in REMOTE_KEYWORDS:   # híbrido tem prioridade sobre remoto/presencial
        if any(kw in hay for kw in keywords):
            return value
    return None


def _to_eur(num_str: str, suffix: str | None) -> float | None:
    cleaned = num_str.replace(" ", "").replace(".", "").replace(",", ".")
    try:
        value = float(cleaned)
    except ValueError:
        return None
    if suffix and suffix.lower() in ("k", "mil"):
        value *= 1000
    return value


def parse_salary(text: str | None) -> tuple[float | None, float | None, str | None]:
    """Best-effort: só devolve valores quando há um indicador de euros junto ao número."""
    if not text:
        return (None, None, None)
    amounts: list[float] = []
    for m in _EURO_AMOUNT.finditer(text):
        num = m.group(1) or m.group(3)
        suffix = m.group(2) or m.group(4)
        value = _to_eur(num, suffix)
        if value and value >= 100:            # ignora ruído (ex.: "€5" de um café na descrição)
            amounts.append(value)
    if not amounts:
        return (None, None, None)
    amounts = sorted(set(amounts))
    if len(amounts) == 1:
        return (amounts[0], None, "EUR")
    return (amounts[0], amounts[-1], "EUR")


def extract_skills(title: str, description: str | None, skills: list[ExpectedSkill]) -> list[str]:
    hay = f"{title} {description or ''}".lower()
    found: list[str] = []
    for skill in skills:
        for pattern in skill.patterns():      # \b evita 'java' casar dentro de 'javascript'
            if re.search(rf"\b{re.escape(pattern)}\b", hay):
                found.append(skill.name)
                break
    return found


def normalize_jobs(jobs, sector_slug: str, config=None) -> pd.DataFrame:
    """Recebe uma lista de ScrapedJob e devolve um DataFrame limpo e normalizado."""
    config = config or load_config()
    if sector_slug not in config.sectors:
        raise ValueError(f"setor '{sector_slug}' não existe no queries.yml")
    sector_skills = config.sectors[sector_slug].skills

    df = pd.DataFrame([vars(j) for j in jobs])
    if df.empty:
        return df

    # Campos obrigatórios e deduplicação por (source, external_id).
    df = df.dropna(subset=["external_id", "title", "url"])
    df = df[(df["title"].str.strip() != "") & (df["url"].str.strip() != "")]
    df = df.drop_duplicates(subset=["source", "external_id"], keep="first").reset_index(drop=True)
    if df.empty:
        return df

    df["sector_slug"] = sector_slug
    df["district"] = df["location_raw"].apply(normalize_district)
    df["seniority"] = df["seniority_raw"].apply(normalize_seniority)
    df["contract_type"] = df["contract_type_raw"].apply(normalize_contract)
    df["remote_type"] = df.apply(lambda r: detect_remote_type(r["description"], r["location_raw"]), axis=1)

    salaries = df["description"].apply(parse_salary)
    df["salary_min"] = salaries.apply(lambda t: t[0])
    df["salary_max"] = salaries.apply(lambda t: t[1])
    df["salary_currency"] = salaries.apply(lambda t: t[2])

    df["skills"] = df.apply(lambda r: extract_skills(r["title"], r["description"], sector_skills), axis=1)

    # Campos de texto vazios → None, para irem a NULL na BD.
    for col in ("company_name", "location_raw", "description"):
        df[col] = df[col].apply(lambda v: v if isinstance(v, str) and v.strip() else None)
    return df


def _demo_jobs():
    """Dados sintéticos que exercitam dedup, campos em falta, salário e skills."""
    from linkedin import ScrapedJob

    return [
        ScrapedJob(external_id="1", title="Backend Developer - Java", company_name="Growin",
                   location_raw="Porto Salvo, Lisboa, Portugal", url="https://x/1",
                   description="Procuramos alguém com Java, Spring Boot e SQL (PostgreSQL). "
                               "Regime híbrido. Salário €30.000 - €45.000. Inglês fluente.",
                   seniority_raw="Assistente", contract_type_raw="Tempo integral"),
        ScrapedJob(external_id="1", title="Backend Developer - Java (DUPLICADO)", company_name="Growin",
                   location_raw="Lisboa", url="https://x/1", description="dup"),
        ScrapedJob(external_id="2", title="Java Developer", company_name="InnoTech",
                   location_raw="Lisboa e Região", url="https://x/2",
                   description="React e TypeScript um plus. 100% remoto. Junte-se a nós!",
                   seniority_raw="Júnior", contract_type_raw="Estágio"),
        ScrapedJob(external_id="3", title="", company_name="SemTitulo",
                   location_raw="Braga", url="https://x/3", description="sem título → descartada"),
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalização de vagas com Pandas")
    parser.add_argument("--demo", action="store_true", help="usar dados sintéticos (sem rede)")
    parser.add_argument("--query", help="scrape real desta query antes de normalizar")
    parser.add_argument("--sector", default="tecnologia", help="setor para extração de skills")
    parser.add_argument("--limit", type=int, default=5)
    args = parser.parse_args()

    config = load_config()
    if args.query:
        from linkedin import scrape_query
        jobs = scrape_query(args.query, config.location, args.limit)
    else:
        jobs = _demo_jobs()

    df = normalize_jobs(jobs, args.sector, config)
    if df.empty:
        print("Sem vagas depois da normalização.")
        return

    cols = ["external_id", "title", "district", "seniority", "contract_type",
            "remote_type", "salary_min", "salary_max", "skills"]
    with pd.option_context("display.max_columns", None, "display.width", 200):
        print(f"\n{len(df)} vagas normalizadas (setor {args.sector}):\n")
        print(df[cols].to_string(index=False))


if __name__ == "__main__":
    main()
