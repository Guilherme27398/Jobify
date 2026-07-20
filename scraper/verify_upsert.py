"""Verifica de forma determinística o upsert de jobs e o histórico de snapshots.

Reescreve uma vaga que já existe na BD (mesmo source+external_id) e confirma:
- o total de jobs não muda (não cria duplicado)
- new == 0 (foi update, não insert)
- essa vaga ganha mais um snapshot (histórico append-only)
- o sector_id não muda (setor fica o da primeira vez)

Uso: scraper/.venv/Scripts/python scraper/verify_upsert.py
"""

import pandas as pd

from db import DbWriter, connect


def _count(cur, sql, params=()):
    cur.execute(sql, params)
    return cur.fetchone()[0]


def main() -> None:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select j.source, j.external_id, j.title, j.sector_id, s.slug "
                "from jobs j join sectors s on s.id = j.sector_id limit 1"
            )
            row = cur.fetchone()
            if not row:
                raise SystemExit("Não há jobs na BD para testar o upsert.")
            source, external_id, title, sector_id_before, slug = row

            jobs_before = _count(cur, "select count(*) from jobs")
            snaps_before = _count(
                cur, "select count(*) from job_snapshots where job_id = "
                     "(select id from jobs where source=%s and external_id=%s)",
                (source, external_id),
            )

        df = pd.DataFrame([{
            "source": source, "external_id": external_id, "title": title,
            "company_name": None, "location_raw": "Lisboa, Lisboa, Portugal",
            "district": "Lisboa", "url": f"https://www.linkedin.com/jobs/view/{external_id}",
            "description": "reescrita de teste", "seniority": "senior",
            "contract_type": "full_time", "remote_type": "hybrid",
            "salary_min": None, "salary_max": None, "salary_currency": None,
            "skills": [],
        }])

        writer = DbWriter(conn)
        run_id = writer.start_run(slug, "verificacao-upsert")
        found, new = writer.write_jobs(df, slug, run_id)
        writer.finish_run(run_id, "success", found, new)

        with conn.cursor() as cur:
            jobs_after = _count(cur, "select count(*) from jobs")
            snaps_after = _count(
                cur, "select count(*) from job_snapshots where job_id = "
                     "(select id from jobs where source=%s and external_id=%s)",
                (source, external_id),
            )
            sector_id_after = _count(
                cur, "select sector_id from jobs where source=%s and external_id=%s",
                (source, external_id),
            )

    print(f"vaga testada: [{external_id}] {title} (setor {slug})")
    print(f"  jobs totais:   {jobs_before} -> {jobs_after}  (esperado: igual)")
    print(f"  new reportado: {new}                (esperado: 0)")
    print(f"  snapshots:     {snaps_before} -> {snaps_after}  (esperado: +1)")
    print(f"  sector_id:     {'inalterado' if sector_id_after == sector_id_before else 'MUDOU!'}")

    ok = (jobs_after == jobs_before and new == 0
          and snaps_after == snaps_before + 1 and sector_id_after == sector_id_before)
    print("\nRESULTADO:", "OK — upsert correto" if ok else "FALHOU")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
