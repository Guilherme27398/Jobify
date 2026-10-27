import { formatInt } from './theme';

interface Entry {
  name?: string | number;
  value?: unknown;
  color?: string;
}

interface Props {
  active?: boolean;
  payload?: readonly Entry[];
  label?: string | number;
  /** Texto do valor de cada série; por omissão, o número formatado. */
  format?: (value: number) => string;
}

/** Tooltip escura: o texto usa as cores de texto; a cor da série fica na amostra ao lado. */
export default function ChartTooltip({ active, payload, label, format }: Props) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label !== undefined && label !== '' && <p className="chart-tooltip__label">{label}</p>}
      {payload.map((entry, i) => {
        const value = Number(entry.value);
        return (
          <p key={i} className="chart-tooltip__row">
            <span className="chart-swatch" style={{ background: entry.color }} aria-hidden="true" />
            <span className="chart-tooltip__name">{entry.name}</span>
            <strong>{format ? format(value) : formatInt(value)}</strong>
          </p>
        );
      })}
    </div>
  );
}
