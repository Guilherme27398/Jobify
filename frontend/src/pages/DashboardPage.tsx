import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getSectors, getStats } from '../api/client';
import type { Sector, StatsDto } from '../api/types';

const SECTOR_COLORS = ['#4f8ef7', '#a855f7', '#f59e0b'];

/* ── Dark-theme tooltip ── */
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(6,6,8,0.95)',
      border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong style={{ color: 'var(--text)' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString('pt-PT', { maximumFractionDigits: 0 }) : p.value}
            {p.name.toLowerCase().includes('salário') && ' €'}
          </strong>
        </p>
      ))}
    </div>
  );
}

/* ── Section wrapper ── */
const ChartCard: React.FC<React.PropsWithChildren<{ title: string; subtitle?: string }>> = ({ title, subtitle, children }) => (
  <section style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  }}>
    <header style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--muted)' }}>{subtitle}</p>}
    </header>
    {children}
  </section>
);

export default function DashboardPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [statsBySector, setStatsBySector] = useState<Record<string, StatsDto>>({});
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Load sectors + fetch stats for all in parallel ── */
  useEffect(() => {
    (async () => {
      try {
        const sectorList = await getSectors();
        setSectors(sectorList);
        if (sectorList[0]) setSelectedSector(sectorList[0].slug);

        const entries = await Promise.all(
          sectorList.map(async s => {
            try { return [s.slug, await getStats(s.slug)] as const; }
            catch { return [s.slug, null] as const; }
          })
        );
        const map: Record<string, StatsDto> = {};
        entries.forEach(([slug, stats]) => { if (stats) map[slug] = stats; });
        setStatsBySector(map);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Chart 1: merge jobsOverTime from all sectors into one dataset ── */
  const jobsOverTimeData = useMemo(() => {
    const months = new Set<string>();
    Object.values(statsBySector).forEach(s => s.jobsOverTime.forEach(p => months.add(p.month)));
    return Array.from(months).sort().map(month => {
      const row: Record<string, any> = { month };
      sectors.forEach(s => {
        row[s.name] = statsBySector[s.slug]?.jobsOverTime.find(p => p.month === month)?.count ?? 0;
      });
      return row;
    });
  }, [sectors, statsBySector]);

  const selectedStats = statsBySector[selectedSector];

  if (loading) {
    return (
      <main style={{ paddingTop: 140, textAlign: 'center', color: 'var(--muted)' }}>
        A carregar dashboard…
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ paddingTop: 140, textAlign: 'center' }}>
        <div style={{
          maxWidth: 500, margin: '0 auto', padding: 20,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, color: '#f87171', fontSize: 14,
        }}>
          Erro ao carregar dashboard: {error}
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>

        <header style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
            Dashboard
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800,
            letterSpacing: '-2px', color: 'var(--text)',
          }}>
            O mercado de trabalho em números.
          </h1>
        </header>

        {/* ── Chart 1: jobs per sector over time (multi-line) ── */}
        <ChartCard
          title="Vagas por setor"
          subtitle="Vagas ativas registadas pelo scraper, agrupadas por mês"
        >
          {jobsOverTimeData.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: 40 }}>
              Sem dados históricos suficientes.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={jobsOverTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1e1e26" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#6b6b80" fontSize={12} />
                <YAxis stroke="#6b6b80" fontSize={12} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13, color: 'var(--muted)' }} />
                {sectors.map((s, i) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.name}
                    stroke={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── Sector selector for the next two charts ── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>
            Aprofundar num setor
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {sectors.map(s => {
              const active = s.slug === selectedSector;
              return (
                <button key={s.id} onClick={() => setSelectedSector(s.slug)}
                  style={{
                    background: active ? 'var(--gradient)' : 'var(--surface)',
                    color: active ? '#fff' : 'var(--text)',
                    border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                    borderRadius: 999, padding: '8px 18px',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Two side-by-side charts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>

          {/* Chart 2: salary evolution */}
          <ChartCard
            title="Evolução salarial"
            subtitle={selectedStats
              ? `Média mensal · cobertura de ${(selectedStats.salaryCoverage * 100).toFixed(0)}% das vagas`
              : ''
            }
          >
            {!selectedStats || selectedStats.salaryEvolution.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: 40 }}>
                Sem vagas com salário publicado neste setor.
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={selectedStats.salaryEvolution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salaryMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="salaryMin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e1e26" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#6b6b80" fontSize={12} />
                    <YAxis stroke="#6b6b80" fontSize={12}
                      tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, color: 'var(--muted)' }} />
                    <Area type="monotone" dataKey="avgMax" name="Salário máx (€)"
                      stroke="#22c55e" fill="url(#salaryMax)" strokeWidth={2} />
                    <Area type="monotone" dataKey="avgMin" name="Salário mín (€)"
                      stroke="#4f8ef7" fill="url(#salaryMin)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
                <p style={{
                  fontSize: 12, color: 'var(--muted)',
                  marginTop: 12, padding: '10px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, lineHeight: 1.5,
                }}>
                  ⚠ Baseado apenas nas vagas que publicam salário
                  ({(selectedStats.salaryCoverage * 100).toFixed(0)}% do total). Valores em euros brutos anuais.
                </p>
              </>
            )}
          </ChartCard>

          {/* Chart 3: district distribution */}
          <ChartCard
            title="Distribuição geográfica"
            subtitle="Vagas ativas por distrito"
          >
            {!selectedStats || selectedStats.districtDistribution.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: 40 }}>
                Sem dados geográficos.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={selectedStats.districtDistribution.slice(0, 10)}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid stroke="#1e1e26" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#6b6b80" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="district" stroke="#6b6b80" fontSize={12} width={90} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(79,142,247,0.08)' }} />
                  <Bar dataKey="count" name="Vagas" fill="#4f8ef7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </div>
      </div>
    </main>
  );
}
