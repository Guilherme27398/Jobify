import { formatInt } from './theme';

interface Kpi {
  label: string;
  value: number;
}

/** Números de destaque: um número não precisa de gráfico. */
export default function KpiRow({ items, caption }: { items: Kpi[]; caption?: string }) {
  return (
    <section className="kpi-row" aria-label="Resumo">
      {items.map(item => (
        <div key={item.label} className="kpi">
          <p className="kpi__label">{item.label}</p>
          <p className="kpi__value">{formatInt(item.value)}</p>
        </div>
      ))}
      {caption && <p className="kpi-row__caption">{caption}</p>}
    </section>
  );
}
