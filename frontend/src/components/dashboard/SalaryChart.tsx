import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlySalary } from '../../api/types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { formatCompact, formatInt, GRID, SALARY_COLORS, SURFACE, TICK, TICK_STYLE } from './theme';

/* A API devolve valores anuais; o mensal é o anual ÷ 14 (12 meses + subsídios de férias e de Natal). */
const MONTHS_PER_YEAR = 14;

function SalaryFigure({ label, value, unit }: { label: string; value: number | null; unit: 'month' | 'year' }) {
  return (
    <div>
      <p className="kpi__label">{label}</p>
      <p className="salary-summary__value">
        {value == null ? '—' : `${formatInt(value)} €`}
        <span>{unit === 'month' ? '/mês' : '/ano'}</span>
      </p>
    </div>
  );
}

export default function SalaryChart({ data, coverage }: { data: MonthlySalary[]; coverage: number }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [unit, setUnit] = useState<'month' | 'year'>('month');

  const rows = useMemo(() => {
    const divisor = unit === 'month' ? MONTHS_PER_YEAR : 1;
    return data.map(p => ({
      month: p.month,
      avgMin: p.avgMin == null ? null : p.avgMin / divisor,
      avgMax: p.avgMax == null ? null : p.avgMax / divisor,
    }));
  }, [data, unit]);

  /* Com um só mês, a "evolução" é um valor: mostra-se como número, não como gráfico. */
  const single = rows.length === 1 ? rows[0] : null;

  return (
    <>
      <div className="chart-controls">
        <div role="group" aria-label="Unidade do salário" className="segmented">
          {(['month', 'year'] as const).map(u => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>
              {u === 'month' ? 'Mensal' : 'Anual'}
            </button>
          ))}
        </div>
        {!single && (
          <ChartLegend items={[
            { label: 'Salário mínimo', color: SALARY_COLORS.min },
            { label: 'Salário máximo', color: SALARY_COLORS.max },
          ]} />
        )}
      </div>

      {single ? (
        <div className="salary-summary">
          <SalaryFigure label="Mínimo médio" value={single.avgMin} unit={unit} />
          <SalaryFigure label="Máximo médio" value={single.avgMax} unit={unit} />
          <p className="chart-note">
            Dados de {single.month}. A evolução aparece quando houver recolhas em mais do que um mês.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="month" stroke={GRID} tick={TICK_STYLE} tickLine={false} />
            <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} width={52} tickFormatter={v => formatCompact(Number(v))} />
            <Tooltip cursor={{ stroke: TICK, strokeWidth: 1 }} content={<ChartTooltip format={v => `${formatInt(v)} €`} />} />
            {(['avgMax', 'avgMin'] as const).map(key => {
              const color = key === 'avgMax' ? SALARY_COLORS.max : SALARY_COLORS.min;
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key === 'avgMax' ? 'Salário máximo' : 'Salário mínimo'}
                  stroke={color}
                  strokeWidth={2}
                  fill={color}
                  fillOpacity={0.1}
                  dot={{ r: 4, strokeWidth: 2, stroke: SURFACE, fill: color, fillOpacity: 1 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: SURFACE, fill: color, fillOpacity: 1 }}
                  isAnimationActive={!reducedMotion}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      )}

      <p className="chart-note">
        Baseado apenas nas vagas que publicam o salário com período claro ({Math.round(coverage * 100)}% do total).
        Subsídios, prémios e valores à hora não entram. Mensal = anual ÷ 14 (12 meses + subsídios de férias e de Natal).
      </p>
    </>
  );
}
