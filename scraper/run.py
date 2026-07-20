"""Orquestrador do scraper: percorre o queries.yml, escreve na BD e marca inativas.

Para cada setor, corre todas as suas queries (cada query = uma linha em
scrape_runs) e, no fim, se a passagem trouxe vagas, aplica a regra de inatividade
ao setor. Se um setor não devolver vagas nenhumas (ex.: LinkedIn a bloquear), a
marcação de inativas é ignorada nesse setor — para não desativar tudo por engano.

Uso (a partir da raiz do repo):
    scraper/.venv/Scripts/python -m scraper                      # todos os setores
    scraper/.venv/Scripts/python -m scraper --sectors saude --limit 5
    scraper/.venv/Scripts/python scraper/run.py --sectors tecnologia
"""

from __future__ import annotations

import argparse

from db import DbWriter, connect
from linkedin import scrape_query
from normalize import normalize_jobs
from queries import load_config


def run_all(limit: int, only_sectors: list[str] | None = None) -> dict[str, int]:
    config = load_config()
    totals = {"found": 0, "new": 0, "deactivated": 0}

    with connect() as conn:
        writer = DbWriter(conn)
        for slug, sector in config.sectors.items():
            if only_sectors and slug not in only_sectors:
                continue

            sector_start = writer.now()   # marco para saber o que foi visto nesta passagem
            sector_found = 0

            for query in sector.queries:
                run_id = writer.start_run(slug, query)
                try:
                    jobs = scrape_query(query, config.location, limit)
                    df = normalize_jobs(jobs, slug, config)
                    found, new = writer.write_jobs(df, slug, run_id)
                    writer.finish_run(run_id, "success", found, new)
                    sector_found += found
                    totals["found"] += found
                    totals["new"] += new
                    print(f"  [{slug}] '{query}': {found} vagas ({new} novas)")
                except Exception as exc:  # uma query falhada não trava as outras
                    writer.finish_run(run_id, "failed", 0, 0, str(exc))
                    print(f"  [{slug}] '{query}': FALHOU — {exc}")

            if sector_found > 0:
                missed, deactivated = writer.mark_inactive(slug, sector_start)
                totals["deactivated"] += deactivated
                print(f"  [{slug}] inativas: {deactivated} desativadas ({missed} sem aparecer nesta passagem)")
            else:
                print(f"  [{slug}] sem vagas nesta passagem — marcação de inativas ignorada")

    return totals


def main() -> None:
    parser = argparse.ArgumentParser(description="Orquestrador do scraper Jobify")
    parser.add_argument("--limit", type=int, default=25, help="máx. de vagas por query")
    parser.add_argument("--sectors", nargs="*", help="restringe a estes setores (slugs)")
    args = parser.parse_args()

    print("A correr o scraper Jobify...")
    totals = run_all(args.limit, args.sectors)
    print(
        f"\nTotal: {totals['found']} vagas processadas, "
        f"{totals['new']} novas, {totals['deactivated']} desativadas."
    )


if __name__ == "__main__":
    main()
