"""Prova determinística da regra de inatividade (3 misses) e da reativação.

Isola uma vaga forçando-a a `MISS_THRESHOLD-1` misses e last_seen_at antigo,
e usa um `seen_since` que só a apanha a ela (as outras foram vistas há pouco).
Depois:
  1. mark_inactive → a vaga chega a MISS_THRESHOLD e fica inativa
  2. reaparece (write_jobs com o mesmo external_id) → volta a ativa, misses=0

Uso: scraper/.venv/Scripts/python scraper/verify_inactive.py
"""

import pandas as pd

from db import MISS_THRESHOLD, DbWriter, connect


def _job_state(cur, source, external_id):
    cur.execute(
        "select is_active, consecutive_misses from jobs where source=%s and external_id=%s",
        (source, external_id),
    )
    return cur.fetchone()


def main() -> None:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select j.source, j.external_id, j.title, s.slug "
                "from jobs j join sectors s on s.id = j.sector_id "
                "where j.is_active = true limit 1"
            )
            row = cur.fetchone()
            if not row:
                raise SystemExit("Não há vagas ativas para testar.")
            source, external_id, title, slug = row

            # Forçar o estado da vaga-alvo: quase no limite e vista há 2 dias.
            cur.execute(
                "update jobs set consecutive_misses = %s, "
                "last_seen_at = now() - interval '2 days' "
                "where source = %s and external_id = %s",
                (MISS_THRESHOLD - 1, source, external_id),
            )
            # seen_since a 1 dia atrás: apanha a alvo (2 dias) mas não as restantes (vistas hoje).
            cur.execute("select now() - interval '1 day'")
            seen_since = cur.fetchone()[0]
        conn.commit()

        writer = DbWriter(conn)
        missed, deactivated = writer.mark_inactive(slug, seen_since)
        with conn.cursor() as cur:
            active_after, misses_after = _job_state(cur, source, external_id)

        # Reaparecimento: o scraper vê a vaga outra vez.
        df = pd.DataFrame([{
            "source": source, "external_id": external_id, "title": title,
            "company_name": None, "location_raw": "Lisboa, Lisboa, Portugal",
            "district": "Lisboa", "url": f"https://www.linkedin.com/jobs/view/{external_id}",
            "description": "reaparecimento de teste", "seniority": None,
            "contract_type": None, "remote_type": None,
            "salary_min": None, "salary_max": None, "salary_currency": None, "skills": [],
        }])
        run_id = writer.start_run(slug, "verificacao-reativacao")
        writer.write_jobs(df, slug, run_id)
        writer.finish_run(run_id, "success", 1, 0)
        with conn.cursor() as cur:
            active_react, misses_react = _job_state(cur, source, external_id)

    print(f"vaga testada: [{external_id}] {title} (setor {slug})")
    print(f"  após marcação:   is_active={active_after}, misses={misses_after}  "
          f"(esperado: False / {MISS_THRESHOLD}); desativadas nesta chamada={deactivated}")
    print(f"  após reaparecer: is_active={active_react}, misses={misses_react}  "
          f"(esperado: True / 0)")

    ok = (active_after is False and misses_after == MISS_THRESHOLD
          and active_react is True and misses_react == 0 and deactivated == 1)
    print("\nRESULTADO:", "OK — regra de inatividade e reativação corretas" if ok else "FALHOU")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
