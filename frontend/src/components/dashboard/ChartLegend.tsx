/** Legenda em HTML: amostra de cor + texto nas cores de texto (nunca na cor da série). */
export default function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="chart-legend">
      {items.map(item => (
        <li key={item.label}>
          <span className="chart-swatch" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
