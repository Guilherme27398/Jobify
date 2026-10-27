import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { monthsTable, monthsWithoutData, type SectorSeries } from './data';
import { formatInt, GRID, sectorColor, SURFACE, TICK, TICK_STYLE } from './theme';

/** Uma linha por área; cada área tem sempre a mesma cor. */
export default function JobsOverTimeChart({ series }: { series: SectorSeries[] }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const data = useMemo(() => monthsTable(series), [series]);
  const gaps = useMemo(() => monthsWithoutData(series), [series]);

  return (
    <>
      <ChartLegend items={series.map(s => ({ label: s.name, color: sectorColor(s.slug) }))} />
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="month" stroke={GRID} tick={TICK_STYLE} tickLine={false} />
          <YAxis allowDecimals={false} tick={TICK_STYLE} tickLine={false} axisLine={false} width={40} />
          <Tooltip cursor={{ stroke: TICK, strokeWidth: 1 }} content={<ChartTooltip format={v => `${formatInt(v)} vagas`} />} />
          {series.map(s => {
            const color = sectorColor(s.slug);
            return (
              <Line
                key={s.slug}
                type="monotone"
                dataKey={s.slug}
                name={s.name}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: SURFACE, fill: color }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: SURFACE, fill: color }}
                isAnimationActive={!reducedMotion}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      {gaps.length > 0 && (
        <p className="chart-note">Sem recolhas em {gaps.join(', ')}: esses meses ficam em branco em vez de ligar os pontos.</p>
      )}
    </>
  );
}
