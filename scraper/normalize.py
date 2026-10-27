"""Normalização das vagas em bruto (ScrapedJob) com Pandas.

Transforma o que o scraper extraiu em linhas limpas e prontas para a BD:
- deduplica por (source, external_id)
- descarta linhas sem os campos obrigatórios (external_id, title, url)
- normaliza os rótulos do LinkedIn (PT/EN) para os valores dos enums da BD
- extrai o distrito da localização em bruto
- extrai o salário em EUR e o seu período (mensal/anual), ignorando subsídios, prémios e
  orçamentos que aparecem no mesmo texto (a maioria das vagas não publica salário)
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

# ── Salários ─────────────────────────────────────────────────────────────────
# Um montante em euros, em formato PT ou EN: "1.654,50€", "€45,000", "24.000 €", "€30k", "30 mil euros".
_NUM = r"\d{1,3}(?:[.,  ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?"
_MONEY = re.compile(
    rf"(?:€|\beur\b|\beuros?\b)\s*(?P<a>{_NUM})\s*(?P<ak>k|mil)?\b"
    rf"|(?P<b>{_NUM})\s*(?P<bk>k|mil)?\s*(?:€|\beur(?:os?)?\b)",
    re.IGNORECASE,
)
# Liga dois montantes num intervalo: "1.654€ e 2.100€", "€45,000 - €60,000".
_RANGE_JOIN = re.compile(r"^\s*(?:-|–|—|a|e|to|and|até|ate)\s*$", re.IGNORECASE)
# Limite inferior sem símbolo de euro: "entre 1.500 e 1.800€".
_RANGE_LOW = re.compile(rf"(?P<n>{_NUM})\s*(?P<k>k|mil)?\s*(?:-|–|—|\ba\b|\be\b|\bto\b|\baté\b)\s*$", re.IGNORECASE)

# Fim de frase ou de item: o contexto de um montante não atravessa estes limites.
_BOUNDARY = re.compile(r"[;•|]|\.\s+(?=[^\d\s])|\s\+\s")

_SALARY_WORDS = re.compile(
    r"sal[aá]ri[oa]l?|vencimento|remunera[cç][aã]o|ordenado|retribui[cç][aã]o|bolsa|"
    r"salary|compensation|base pay|pay range|wage|stipend|\bbrut[oa]s?\b|\bgross\b",
    re.IGNORECASE,
)
# Dinheiro que não é salário: subsídios, prémios, orçamentos, seguros…
_OTHER_MONEY_WORDS = re.compile(
    r"subs[ií]dio|pr[eé]mio|b[oó]nus|bonus|budget|or[cç]amento|seguro|insurance|ajudas? de custo|"
    r"cart[aã]o|refei[cç][aã]o|alimenta[cç][aã]o|top-up|allowance|voucher|referral|recomend|"
    r"comiss[aã]o|comiss[oõ]es|commission|relocation|reembolso|reimbursement|plafond|"
    r"forma[cç][aã]o|training|learning|invest",
    re.IGNORECASE,
)
_YEAR_WORDS = re.compile(
    r"\banua(?:l|is)\b|\bpor ano\b|/\s*ano\b|\bao ano\b|\bp\.a\.|\bper (?:year|annum)\b|\ba year\b|"
    r"\bannual(?:ly)?\b|\byearly\b|/\s*(?:year|yr)\b",
    re.IGNORECASE,
)
_MONTH_WORDS = re.compile(
    r"\bmensa(?:l|is)\b|\bpor m[eê]s\b|/\s*m[eê]s\b|\bao m[eê]s\b|\bp/m\b|\bper month\b|\ba month\b|"
    r"\bmonthly\b|/\s*(?:month|mo)\b|\bx\s*14\b|\b14 meses\b",
    re.IGNORECASE,
)
# Valores à hora ou ao dia não são comparáveis com salários mensais/anuais.
_HOUR_DAY_WORDS = re.compile(
    r"\bpor hora\b|\bà hora\b|/\s*h(?:ora)?\b|\bper hour\b|\bhourly\b|/\s*hr\b|"
    r"\bpor dia\b|/\s*dia\b|\bper day\b|\bdaily\b|\bdi[aá]ri[oa]\b",
    re.IGNORECASE,
)

# Valores brutos plausíveis em Portugal. Sem período escrito, abaixo de 10.000€ é mensal.
_PLAUSIBLE = {"month": (500, 20_000), "year": (6_000, 300_000)}
_MONTHLY_CEILING = 10_000
_CONTEXT_CHARS = 120


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
    """'1.654,50' → 1654.5, '1,500' → 1500, '9.60' → 9.6; 'k'/'mil' multiplica por 1000."""
    s = num_str.replace(" ", "").replace(" ", "")
    if "," in s and "." in s:                 # o último separador é o decimal
        decimal = "," if s.rfind(",") > s.rfind(".") else "."
        s = s.replace("." if decimal == "," else ",", "").replace(decimal, ".")
    elif "," in s or "." in s:                # só um tipo: grupos de 3 dígitos = milhares
        sep = "," if "," in s else "."
        groups = s.split(sep)
        s = s.replace(sep, "") if len(groups) > 2 or len(groups[-1]) == 3 else s.replace(sep, ".")
    try:
        value = float(s)
    except ValueError:
        return None
    if suffix and suffix.lower() in ("k", "mil"):
        value *= 1000
    return value


def _money_mentions(text: str) -> list[dict]:
    """Montantes em euros, com intervalos ("1.654€ e 2.100€") juntos numa só menção."""
    mentions: list[dict] = []
    for m in _MONEY.finditer(text):
        value = _to_eur(m.group("a") or m.group("b"), m.group("ak") or m.group("bk"))
        if value is None:
            continue
        thousands = bool(m.group("ak") or m.group("bk"))
        prev = mentions[-1] if mentions else None
        if prev and prev["high"] is None and _RANGE_JOIN.match(text[prev["end"]:m.start()]):
            prev.update(high=value, end=m.end(), thousands=prev["thousands"] or thousands)
            continue
        mention = {"start": m.start(), "end": m.end(), "low": value, "high": None, "thousands": thousands}
        low = _RANGE_LOW.search(text[max(prev["end"] if prev else 0, m.start() - 30):m.start()])
        if low:
            low_value = _to_eur(low.group("n"), low.group("k"))
            if low_value is not None:
                mention.update(start=m.start() - (len(low.string) - low.start()), low=low_value, high=value)
        mentions.append(mention)
    return mentions


def _nearest(pattern: re.Pattern, text: str, from_end: bool) -> int | None:
    """Distância (em caracteres) da ocorrência mais próxima do montante, ou None."""
    distances = [len(text) - m.end() if from_end else m.start() for m in pattern.finditer(text)]
    return min(distances) if distances else None


def _context(text: str, mentions: list[dict], i: int) -> tuple[str, str]:
    """Texto da mesma frase/item antes e depois da menção i, sem atravessar outras menções."""
    m = mentions[i]
    pre_start = max(mentions[i - 1]["end"] if i else 0, m["start"] - _CONTEXT_CHARS)
    pre = text[pre_start:m["start"]]
    cuts = list(_BOUNDARY.finditer(pre))
    if cuts:
        pre = pre[cuts[-1].end():]
    post_end = min(mentions[i + 1]["start"] if i + 1 < len(mentions) else len(text), m["end"] + 60)
    post = text[m["end"]:post_end]
    cut = _BOUNDARY.search(post)
    return pre, post[:cut.start()] if cut else post


def _closest_word(pre: str, post: str) -> str | None:
    """'salary' ou 'other' conforme a palavra mais próxima; a frase anterior tem prioridade."""
    for text, from_end in ((pre, True), (post, False)):
        salary = _nearest(_SALARY_WORDS, text, from_end)
        other = _nearest(_OTHER_MONEY_WORDS, text, from_end)
        if salary is not None or other is not None:
            return "other" if other is not None and (salary is None or other < salary) else "salary"
    return None


def _explicit_period(pre: str, post: str) -> str | None:
    found = []
    for pattern, period in ((_YEAR_WORDS, "year"), (_MONTH_WORDS, "month")):
        for d in (_nearest(pattern, pre, True), _nearest(pattern, post, False)):
            if d is not None:
                found.append((d, period))
    return min(found)[1] if found else None


def parse_salary(text: str | None) -> tuple[float | None, float | None, str | None, str | None]:
    """Devolve (mínimo, máximo, moeda, período) do salário publicado na vaga.

    O período é 'month' ou 'year' — valores à hora/ao dia, subsídios, prémios e orçamentos
    não contam. Um montante só é salário se a palavra mais próxima for de salário ou se
    tiver período explícito ("/mês", "anual"). Sem período escrito, decide a ordem de grandeza.
    """
    none = (None, None, None, None)
    if not text:
        return none
    text = " ".join(text.split())
    mentions = _money_mentions(text)

    for i, m in enumerate(mentions):
        pre, post = _context(text, mentions, i)
        if _HOUR_DAY_WORDS.search(pre) or _HOUR_DAY_WORDS.search(post):
            continue
        kind = _closest_word(pre, post)
        period = _explicit_period(pre, post)
        if kind == "other" or (kind is None and period is None):
            continue

        low, high = sorted((m["low"], m["high"])) if m["high"] is not None else (m["low"], None)
        if period is None:
            if m["thousands"]:
                period = "year"
            elif low < _PLAUSIBLE["month"][0]:
                continue
            else:
                period = "month" if low < _MONTHLY_CEILING else "year"
        floor, ceiling = _PLAUSIBLE[period]
        if not (floor <= low and (high or low) <= ceiling):
            continue
        return (low, high if high != low else None, "EUR", period)
    return none


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
    df["salary_period"] = salaries.apply(lambda t: t[3])

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
