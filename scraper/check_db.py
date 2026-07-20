"""Verifica a ligação à base de dados e o estado dos seeds.

Uso (a partir da raiz do repo):
    scraper/.venv/Scripts/python scraper/check_db.py

Lê DATABASE_URL do .env na raiz. Só faz leituras.
"""

from pathlib import Path

import psycopg
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    env = dotenv_values(ROOT / ".env")
    url = env.get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL não encontrado no .env da raiz")

    with psycopg.connect(url, connect_timeout=10) as conn, conn.cursor() as cur:
        cur.execute("select current_database(), version()")
        db, version = cur.fetchone()
        print(f"Ligado a '{db}' — {version.split(',')[0]}")

        for table in ("sectors", "companies", "skills", "jobs", "job_snapshots", "scrape_runs"):
            cur.execute(f"select count(*) from {table}")
            print(f"  {table}: {cur.fetchone()[0]} linhas")


if __name__ == "__main__":
    main()
