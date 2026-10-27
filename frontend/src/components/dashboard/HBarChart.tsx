import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { SERIES, TICK } from './theme';

export interface HBarRow {
  label: string;
  value: number;
  /** Texto na ponta da barra (ex.: "73%"). */
  tip: string;
  /** Texto da tooltip (ex.: "45 de 62 vagas"). */
  detail: string;
}

interface Props {
  rows: HBarRow[];
  name: string;
  color?: string;
  maxLabelChars?: number;
}

const ROW_HEIGHT = 34;
const CHAR_WIDTH = 7;

/** Barras horizontais de uma só série: uma cor, ordenadas, valor na ponta. */
export default function HBarChart({ rows, name, color = SERIES[0], maxLabelChars = 22 }: Props) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const longest = Math.min(maxLabelChars, Math.max(4, ...rows.map(r => r.label.length)));

  return (
    <ResponsiveContainer width="100%" height={rows.length * ROW_HEIGHT + 8}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 0 }}>
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={longest * CHAR_WIDTH + 16}
          axisLine={false}
          tickLine={false}
          interval={0}
          tick={props => <TruncatedTick {...props} maxChars={maxLabelChars} />}
        />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<RowTooltip />} />
        <Bar dataKey="value" name={name} fill={color} barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={!reducedMotion}>
          <LabelList dataKey="tip" position="right" offset={8} fill="#f0f0f5" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
  maxChars: number;
}

/** Rótulos longos (nomes de empresas) cortados com reticências; o nome completo fica no title. */
function TruncatedTick({ x, y, payload, maxChars }: TickProps) {
  const full = String(payload?.value ?? '');
  const short = full.length > maxChars ? `${full.slice(0, maxChars - 1)}…` : full;
  return (
    <text x={x} y={y} dy={4} dx={-4} textAnchor="end" fill={TICK} fontSize={12}>
      <title>{full}</title>
      {short}
    </text>
  );
}

function RowTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: HBarRow }[] }) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{row.label}</p>
      <p className="chart-tooltip__row">{row.detail}</p>
    </div>
  );
}
