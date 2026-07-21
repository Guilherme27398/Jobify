"""Carrega e valida o dicionário de queries por setor (queries.yml).

Uso como script (a partir da raiz do repo):
    scraper/.venv/Scripts/python scraper/queries.py

Valida a estrutura do YAML e cruza com a BD: os slugs dos setores têm de
existir em `sectors` e as skills em `skills`. Só faz leituras.
"""

from dataclasses import dataclass, field
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
QUERIES_PATH = Path(__file__).resolve().parent / "queries.yml"

VALID_SKILL_TYPES = {"technical", "legal", "language", "certification", "soft_skill", "other"}


@dataclass
class ExpectedSkill:
    name: str
    type: str
    aliases: list[str] = field(default_factory=list)

    def patterns(self) -> list[str]:
        """Termos, em minúsculas, a procurar no texto da vaga."""
        return [self.name.lower(), *(a.lower() for a in self.aliases)]


@dataclass
class SectorConfig:
    slug: str
    queries: list[str]
    skills: list[ExpectedSkill]  # expected_skills do setor + common_skills


@dataclass
class QueriesConfig:
    location: str
    sectors: dict[str, SectorConfig]


def _parse_skill(raw: dict, context: str) -> ExpectedSkill:
    name = raw.get("name")
    skill_type = raw.get("type")
    if not name or not isinstance(name, str):
        raise ValueError(f"{context}: skill sem 'name' válido: {raw!r}")
    if skill_type not in VALID_SKILL_TYPES:
        raise ValueError(
            f"{context}: skill '{name}' com type inválido {skill_type!r} "
            f"(válidos: {sorted(VALID_SKILL_TYPES)})"
        )
    aliases = raw.get("aliases", [])
    if not isinstance(aliases, list) or any(not isinstance(a, str) for a in aliases):
        raise ValueError(f"{context}: aliases de '{name}' têm de ser uma lista de strings")
    return ExpectedSkill(name=name, type=skill_type, aliases=aliases)


def load_config(path: Path = QUERIES_PATH) -> QueriesConfig:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or "sectors" not in raw:
        raise ValueError("queries.yml: falta a chave de topo 'sectors'")

    location = (raw.get("defaults") or {}).get("location", "Portugal")
    common = [_parse_skill(s, "common_skills") for s in raw.get("common_skills", [])]

    sectors: dict[str, SectorConfig] = {}
    for slug, cfg in raw["sectors"].items():
        context = f"sectors.{slug}"
        queries = (cfg or {}).get("queries", [])
        if not queries or any(not isinstance(q, str) or not q.strip() for q in queries):
            raise ValueError(f"{context}: 'queries' tem de ser uma lista não vazia de strings")
        own = [_parse_skill(s, context) for s in (cfg or {}).get("expected_skills", [])]
        sectors[slug] = SectorConfig(slug=slug, queries=queries, skills=own + common)

    if not sectors:
        raise ValueError("queries.yml: 'sectors' está vazio")
    return QueriesConfig(location=location, sectors=sectors)


def validate_against_db(config: QueriesConfig) -> list[str]:
    """Devolve a lista de problemas encontrados ao cruzar com a BD (vazia = tudo OK)."""
    import psycopg
    from dotenv import dotenv_values

    url = dotenv_values(ROOT / ".env").get("DATABASE_URL")
    if not url:
        return ["DATABASE_URL não encontrado no .env da raiz"]

    problems: list[str] = []
    with psycopg.connect(url, connect_timeout=10) as conn, conn.cursor() as cur:
        cur.execute("select slug from sectors")
        db_slugs = {row[0] for row in cur.fetchall()}
        cur.execute("select name, skill_type from skills")
        db_skills = {row[0]: row[1] for row in cur.fetchall()}

    for slug, sector in config.sectors.items():
        if slug not in db_slugs:
            problems.append(f"setor '{slug}' não existe na tabela sectors ({sorted(db_slugs)})")
        for skill in sector.skills:
            if skill.name not in db_skills:
                problems.append(f"skill '{skill.name}' ({slug}) não existe na tabela skills")
            elif db_skills[skill.name] != skill.type:
                problems.append(
                    f"skill '{skill.name}' ({slug}): type no yml é '{skill.type}' "
                    f"mas na BD é '{db_skills[skill.name]}'"
                )
    return problems


def main() -> None:
    config = load_config()
    print(f"queries.yml válido — location por omissão: {config.location}")
    for slug, sector in config.sectors.items():
        print(f"  {slug}: {len(sector.queries)} queries, {len(sector.skills)} skills (com comuns)")

    problems = validate_against_db(config)
    if problems:
        print("\nProblemas no cruzamento com a BD:")
        for p in problems:
            print(f"  ✗ {p}")
        raise SystemExit(1)
    print("Cruzamento com a BD: tudo OK (setores e skills existem e os types batem certo)")


if __name__ == "__main__":
    main()
