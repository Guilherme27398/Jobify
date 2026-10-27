"""Recalcula o salário de todos os snapshots com o parser atual (normalize.parse_salary).

Por omissão só simula: mostra, por vaga, o salário gravado e o que passaria a ficar.
Com --apply guarda primeiro os valores antigos num CSV em scraper/logs/ e só depois atualiza.
O --apply exige a coluna job_snapshots.salary_period (migração Flyway V2, aplicada ao arrancar a API).

Uso (a partir da raiz do repo):
    scraper/.venv/Scripts/python scraper/backfill_salaries.py            # simulação
    scraper/.venv/Scripts/python scraper/backfill_salaries.py --apply    # grava
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
from pathlib import Path

from db import connect
from normalize import parse_salary

LOGS = Path(__file__).resolve().parent / "logs"


def _has_period_column(conn) -> bool:
    return conn.execute(
        "select 1 from information_schema.columns "
        "where table_name = 'job_snapshots' and column_name = 'salary_period'"
    ).fetchone() is not None


def _fmt(salary: tuple) -> str:
    low, high, _, period = salary
    if low is None:
        return "—"
    value = f"{low:,.0f}" if high is None else f"{low:,.0f}–{high:,.0f}"
    unit = {"month": "/mês", "year": "/ano"}.get(period, " (sem período)")
    return f"{value.replace(',', '.')} €{unit}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Recalcula os salários dos snapshots com o parser atual")
    parser.add_argument("--apply", action="store_true", help="grava as alterações (por omissão só simula)")
    args = parser.parse_args()

    with connect() as conn:
        has_period = _has_period_column(conn)
        if args.apply and not has_period:
            raise SystemExit("Falta a coluna job_snapshots.salary_period: arranca a API (Flyway V2) primeiro.")

        rows = conn.execute(f"""
            select s.id, j.id, j.title, j.description,
                   s.salary_min, s.salary_max, s.salary_currency,
                   {"s.salary_period" if has_period else "null"}
            from job_snapshots s
            join jobs j on j.id = s.job_id
            order by j.title, s.recorded_at
        """).fetchall()

        parsed: dict = {}
        changes = []  # (snapshot_id, job_id, title, valores antigos tal como estão, antes, depois)
        for snap_id, job_id, title, description, smin, smax, currency, period in rows:
            if job_id not in parsed:
                parsed[job_id] = parse_salary(description)
            before = (float(smin) if smin is not None else None,
                      float(smax) if smax is not None else None,
                      currency if smin is not None else None,
                      period)
            after = parsed[job_id]
            if before != after:
                changes.append((snap_id, job_id, title, (smin, smax, currency, period), before, after))

        per_job: dict = {}
        for _, job_id, title, _, before, after in changes:
            entry = per_job.setdefault(job_id, [title, before, after, 0])
            entry[3] += 1

        with_salary_after = sum(1 for p in parsed.values() if p[0] is not None)
        print(f"{len(rows)} snapshots de {len(parsed)} vagas · {len(changes)} snapshots mudam em {len(per_job)} vagas")
        print(f"Vagas com salário comparável depois da correção: {with_salary_after}\n")
        for title, before, after, n in sorted(per_job.values(), key=lambda e: e[0]):
            print(f"- {title} ({n} snapshots)")
            print(f"    antes:  {_fmt(before)}")
            print(f"    depois: {_fmt(after)}")

        if not args.apply:
            print("\nSimulação: nada foi gravado. Usa --apply para gravar.")
            return
        if not changes:
            print("\nNada para atualizar.")
            return

        LOGS.mkdir(exist_ok=True)
        backup = LOGS / f"salary_backup_{datetime.now():%Y%m%d_%H%M%S}.csv"
        with backup.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["snapshot_id", "salary_min", "salary_max", "salary_currency", "salary_period"])
            for snap_id, _, _, raw, _, _ in changes:
                writer.writerow([snap_id, *raw])

        with conn.cursor() as cur:
            cur.executemany(
                "update job_snapshots set salary_min = %s, salary_max = %s, "
                "salary_currency = %s, salary_period = %s where id = %s",
                [(*after, snap_id) for snap_id, _, _, _, _, after in changes],
            )
        conn.commit()
        print(f"\nAtualizados {len(changes)} snapshots. Valores antigos guardados em {backup}")


if __name__ == "__main__":
    main()
