"""Escrita das vagas normalizadas no Supabase.

Fluxo de uma execução do scraper para uma query:
  1. start_run    → cria uma linha em scrape_runs (status 'running')
  2. write_jobs   → upsert de companies e jobs, append em job_snapshots, job_skills
  3. finish_run   → fecha a scrape_runs (status, finished_at, contagens)

Regras de desenho respeitadas:
- jobs tem upsert por (source, external_id); o `sector_id` é definido só na
  primeira vez (no ON CONFLICT não é atualizado) → setor = setor da query inicial
- reaparecer repõe is_active=true e consecutive_misses=0 (ver marcação de inativas)
- job_snapshots é append-only: uma linha nova por vaga por execução

Uso como script — teste end-to-end real (scrape + normaliza + escreve):
    scraper/.venv/Scripts/python scraper/db.py --query "java spring boot" --sector tecnologia --limit 3
"""

from __future__ import annotations

import math
from datetime import datetime
from pathlib import Path

import psycopg
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "linkedin"

# Regra da Fase 0: vaga não vista em N execuções consecutivas do seu setor → inativa.
MISS_THRESHOLD = 3


def connect() -> psycopg.Connection:
    url = dotenv_values(ROOT / ".env").get("DATABASE_URL")
    if not url:
        raise SystemExit("DATABASE_URL não encontrado no .env")
    return psycopg.connect(url, connect_timeout=15)


def _clean(value):
    """NaN do pandas → None (para ir a NULL na BD)."""
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


class DbWriter:
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn
        self._sector_ids: dict[str, str] = {}
        self._skill_ids: dict[str, str | None] = {}

    def _sector_id(self, cur, slug: str) -> str:
        if slug not in self._sector_ids:
            cur.execute("select id from sectors where slug = %s", (slug,))
            row = cur.fetchone()
            if not row:
                raise ValueError(f"setor '{slug}' não existe na BD")
            self._sector_ids[slug] = row[0]
        return self._sector_ids[slug]

    def _skill_id(self, cur, name: str) -> str | None:
        if name not in self._skill_ids:
            cur.execute("select id from skills where name = %s", (name,))
            row = cur.fetchone()
            self._skill_ids[name] = row[0] if row else None
        return self._skill_ids[name]

    def _company_id(self, cur, name: str | None) -> str | None:
        if not name:
            return None
        cur.execute(
            "insert into companies (name) values (%s) "
            "on conflict (name) do update set updated_at = now() "
            "returning id",
            (name,),
        )
        return cur.fetchone()[0]

    def start_run(self, sector_slug: str, query: str, source: str = SOURCE) -> str:
        with self.conn.cursor() as cur:
            sector_id = self._sector_id(cur, sector_slug)
            cur.execute(
                "insert into scrape_runs (source, sector_target, query_used, status) "
                "values (%s, %s, %s, 'running') returning id",
                (source, sector_id, query),
            )
            run_id = cur.fetchone()[0]
        self.conn.commit()
        return run_id

    def now(self) -> datetime:
        """Timestamp do lado da BD (para comparar com last_seen_at sem risco de clock skew)."""
        with self.conn.cursor() as cur:
            cur.execute("select now()")
            return cur.fetchone()[0]

    def mark_inactive(self, sector_slug: str, seen_since: datetime) -> tuple[int, int]:
        """Incrementa os misses das vagas ativas do setor não vistas nesta passagem.

        Chamar só depois de uma passagem BEM-SUCEDIDA pelo setor: uma vaga cujo
        last_seen_at seja anterior a `seen_since` não apareceu nesta execução, logo
        soma 1 miss; ao atingir MISS_THRESHOLD fica inativa. Reaparecer (no upsert de
        write_jobs) repõe is_active=true e consecutive_misses=0.

        Devolve (nº de vagas que somaram miss, nº de vagas desativadas agora).
        """
        with self.conn.cursor() as cur:
            sector_id = self._sector_id(cur, sector_slug)
            cur.execute(
                """
                update jobs
                set consecutive_misses = consecutive_misses + 1,
                    is_active = (consecutive_misses + 1 < %s),
                    updated_at = now()
                where sector_id = %s and is_active = true and last_seen_at < %s
                returning (consecutive_misses >= %s) as deactivated
                """,
                (MISS_THRESHOLD, sector_id, seen_since, MISS_THRESHOLD),
            )
            rows = cur.fetchall()
        self.conn.commit()
        return (len(rows), sum(1 for (deactivated,) in rows if deactivated))

    def finish_run(self, run_id, status: str, jobs_found: int, jobs_new: int, error: str | None = None) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "update scrape_runs set status = %s, finished_at = now(), "
                "jobs_found = %s, jobs_new = %s, error_log = %s where id = %s",
                (status, jobs_found, jobs_new, error, run_id),
            )
        self.conn.commit()

    def write_jobs(self, df, sector_slug: str, run_id) -> tuple[int, int]:
        """Devolve (vagas_processadas, vagas_novas)."""
        if df.empty:
            return (0, 0)
        found = len(df)
        new = 0
        with self.conn.cursor() as cur:
            sector_id = self._sector_id(cur, sector_slug)
            for row in df.itertuples(index=False):
                company_id = self._company_id(cur, _clean(row.company_name))

                cur.execute(
                    """
                    insert into jobs (source, external_id, sector_id, company_id,
                                      title, description, location, district, url,
                                      is_active, consecutive_misses, last_seen_at, updated_at)
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, true, 0, now(), now())
                    on conflict (source, external_id) do update set
                        company_id = excluded.company_id,
                        title = excluded.title,
                        description = excluded.description,
                        location = excluded.location,
                        district = excluded.district,
                        url = excluded.url,
                        is_active = true,
                        consecutive_misses = 0,
                        last_seen_at = now(),
                        updated_at = now()
                    returning id, (xmax = 0) as inserted
                    """,
                    (row.source, row.external_id, sector_id, company_id,
                     _clean(row.title), _clean(row.description), _clean(row.location_raw),
                     _clean(row.district), _clean(row.url)),
                )
                job_id, inserted = cur.fetchone()
                if inserted:
                    new += 1

                for skill_name in row.skills:
                    skill_id = self._skill_id(cur, skill_name)
                    if skill_id:
                        cur.execute(
                            "insert into job_skills (job_id, skill_id) values (%s, %s) "
                            "on conflict do nothing",
                            (job_id, skill_id),
                        )

                cur.execute(
                    """
                    insert into job_snapshots (job_id, scrape_run_id, seniority,
                        contract_type, remote_type, salary_min, salary_max, salary_currency)
                    values (%s, %s, %s, %s::contract_type, %s::remote_type, %s, %s, %s)
                    """,
                    (job_id, run_id, _clean(row.seniority),
                     _clean(row.contract_type), _clean(row.remote_type),
                     _clean(row.salary_min), _clean(row.salary_max), _clean(row.salary_currency)),
                )
        self.conn.commit()
        return (found, new)


def run_query(query: str, sector_slug: str, limit: int) -> tuple[int, int]:
    """Scrape + normaliza + escreve uma query, com a scrape_runs a envolver tudo."""
    from linkedin import scrape_query
    from normalize import normalize_jobs
    from queries import load_config

    config = load_config()
    jobs = scrape_query(query, config.location, limit)
    df = normalize_jobs(jobs, sector_slug, config)

    with connect() as conn:
        writer = DbWriter(conn)
        run_id = writer.start_run(sector_slug, query)
        try:
            found, new = writer.write_jobs(df, sector_slug, run_id)
            writer.finish_run(run_id, "success", found, new)
            return (found, new)
        except Exception as exc:
            writer.finish_run(run_id, "failed", 0, 0, str(exc))
            raise


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Teste end-to-end da escrita na BD")
    parser.add_argument("--query", required=True)
    parser.add_argument("--sector", required=True)
    parser.add_argument("--limit", type=int, default=3)
    args = parser.parse_args()

    found, new = run_query(args.query, args.sector, args.limit)
    print(f"Escrito: {found} vagas processadas, {new} novas (setor {args.sector}, query '{args.query}')")


if __name__ == "__main__":
    main()
