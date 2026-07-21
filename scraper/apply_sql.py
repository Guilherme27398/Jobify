"""Aplica um ficheiro .sql à BD (utilitário de manutenção).

Uso (a partir da raiz do repo):
    scraper/.venv/Scripts/python scraper/apply_sql.py db/fixes_2.sql
"""

import sys
from pathlib import Path

import psycopg
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("uso: apply_sql.py <caminho.sql>")
    sql = Path(sys.argv[1]).read_text(encoding="utf-8")
    url = dotenv_values(ROOT / ".env").get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL não encontrado no .env")
    with psycopg.connect(url, connect_timeout=15) as conn:
        conn.execute(sql)
        conn.commit()
    print(f"Aplicado: {sys.argv[1]}")


if __name__ == "__main__":
    main()
