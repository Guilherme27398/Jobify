import type { ReactNode } from 'react';

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

interface Props {
  title: string;
  subtitle?: string;
  /** Os mesmos dados em tabela: acessível e sem depender da cor nem da tooltip. */
  table?: ChartTable;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, table, children }: Props) {
  return (
    <section className="chart-card">
      <header className="chart-card__header">
        <h2 className="chart-card__title">{title}</h2>
        {subtitle && <p className="chart-card__subtitle">{subtitle}</p>}
      </header>

      {children}

      {table && table.rows.length > 0 && (
        <details className="chart-table">
          <summary>Ver dados</summary>
          <div className="chart-table__scroll">
            <table>
              <thead>
                <tr>{table.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (j === 0
                      ? <th key={j} scope="row">{cell}</th>
                      : <td key={j}>{cell}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
