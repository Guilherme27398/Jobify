import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ChartLegend from './ChartLegend';
import type { ModalityRow } from './data';
import { formatInt, MODALITIES, SURFACE, TICK_STYLE } from './theme';

/** Parte do todo por área: barras empilhadas a 100%, com 2px de fundo entre segmentos. */
export default function ModalityChart({ rows }: { rows: ModalityRow[] }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const last = MODALITIES.length - 1;

  return (
    <>
      <ChartLegend items={MODALITIES.map(m => ({ label: m.label, color: m.color }))} />
      <ResponsiveContainer width="100%" height={rows.length * 44 + 8}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis type="category" dataKey="sector" width={96} axisLine={false} tickLine={false} interval={0} tick={TICK_STYLE} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<ModalityTooltip />} />
          {MODALITIES.map((m, i) => (
            <Bar
              key={m.key}
              dataKey={m.key}
              name={m.label}
              stackId="modality"
              fill={m.color}
              stroke={SURFACE}
              strokeWidth={2}
              barSize={22}
              radius={i === last ? [0, 4, 4, 0] : 0}
              isAnimationActive={!reducedMotion}
            >
              <LabelList dataKey={m.key} content={<SegmentLabel />} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

interface SegmentLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
}

/** Percentagem dentro do segmento, só quando cabe com folga; senão fica na tooltip e na tabela. */
function SegmentLabel(props: SegmentLabelProps) {
  const x = Number(props.x), y = Number(props.y);
  const width = Number(props.width), height = Number(props.height), value = Number(props.value);
  if (!value || width < 38) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} dy={4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600}>
      {Math.round(value)}%
    </text>
  );
}

function ModalityTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: ModalityRow }[] }) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{row.sector} · {formatInt(row.total)} vagas</p>
      {MODALITIES.map(m => (
        <p key={m.key} className="chart-tooltip__row">
          <span className="chart-swatch" style={{ background: m.color }} aria-hidden="true" />
          <span className="chart-tooltip__name">{m.label}</span>
          <strong>{formatInt(row.counts[m.key] ?? 0)} ({Math.round(Number(row[m.key]))}%)</strong>
        </p>
      ))}
    </div>
  );
}
