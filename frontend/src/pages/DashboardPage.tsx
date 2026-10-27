import { useEffect, useMemo, useState } from 'react';
import { getHomeStats, getSectors, getStats } from '../api/client';
import type { HomeStats, Sector, StatsDto } from '../api/types';
import ChartCard from '../components/dashboard/ChartCard';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import HBarChart, { type HBarRow } from '../components/dashboard/HBarChart';
import JobsOverTimeChart from '../components/dashboard/JobsOverTimeChart';
import KpiRow from '../components/dashboard/KpiRow';
import ModalityChart from '../components/dashboard/ModalityChart';
import { monthsTable, toModalityRow, type SectorSeries } from '../components/dashboard/data';
import SalaryChart from '../components/dashboard/SalaryChart';
import { formatInt, MODALITIES } from '../components/dashboard/theme';
import { relativeDate } from '../utils/format';

interface SectorStats {
  sector: Sector;
  stats: StatsDto;
}

const MONTHS_PER_YEAR = 14;
const TOP_DISTRICTS = 10;

function PageHeader() {
  return (
    <header>
      <p className="eyebrow">Dashboard</p>
      <h1 className="dashboard__title">O mercado de trabalho em números.</h1>
    </header>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<SectorStats[]>([]);
  const [home, setHome] = useState<HomeStats | null>(null);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Estatísticas de todas as áreas + números globais ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sectors = await getSectors();
        const [homeStats, entries] = await Promise.all([
          getHomeStats().catch(() => null),
          Promise.all(sectors.map(async sector => {
            try { return { sector, stats: await getStats(sector.slug) }; }
            catch { return null; }
          })),
        ]);
        if (cancelled) return;
        /* Só as áreas com vagas ativas, da maior para a menor. */
        const withJobs = entries
          .filter((e): e is SectorStats => e !== null && e.stats.activeJobs > 0)
          .sort((a, b) => b.stats.activeJobs - a.stats.activeJobs);
        setData(withJobs);
        setHome(homeStats);
        setSelected(withJobs[0]?.sector.slug ?? '');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sectorRows: HBarRow[] = useMemo(() => data.map(({ sector, stats }) => ({
    label: sector.name,
    value: stats.activeJobs,
    tip: formatInt(stats.activeJobs),
    detail: `${formatInt(stats.activeJobs)} vagas ativas`,
  })), [data]);
  const modalityRows = useMemo(() => data.map(({ sector, stats }) => toModalityRow(sector.name, stats.remoteTypes)), [data]);
  const series: SectorSeries[] = useMemo(
    () => data.map(({ sector, stats }) => ({ slug: sector.slug, name: sector.name, points: stats.jobsOverTime })),
    [data],
  );

  if (loading) {
    return (
      <main className="dashboard" aria-busy="true">
        <div className="dashboard__inner">
          <PageHeader />
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard dashboard--status">
        <div className="dashboard__error">Erro ao carregar dashboard: {error}</div>
      </main>
    );
  }

  const current = data.find(d => d.sector.slug === selected);
  const active = current?.stats.activeJobs ?? 0;

  const skillRows: HBarRow[] = (current?.stats.topSkills ?? []).map(s => {
    const pct = (s.count / active) * 100;
    return { label: s.name, value: pct, tip: `${Math.round(pct)}%`, detail: `${formatInt(s.count)} de ${formatInt(active)} vagas` };
  });
  const companyRows: HBarRow[] = (current?.stats.topCompanies ?? []).map(c => ({
    label: c.name, value: c.count, tip: formatInt(c.count), detail: `${formatInt(c.count)} vagas ativas`,
  }));
  const districtRows: HBarRow[] = (current?.stats.districtDistribution ?? []).slice(0, TOP_DISTRICTS).map(d => ({
    label: d.district, value: d.count, tip: formatInt(d.count), detail: `${formatInt(d.count)} vagas ativas`,
  }));

  return (
    <main className="dashboard">
      <div className="dashboard__inner">
        <PageHeader />

        {home && (
          <KpiRow
            items={[
              { label: 'Vagas ativas', value: home.activeJobs },
              { label: 'Novas esta semana', value: home.newThisWeek },
              { label: 'Empresas a contratar', value: home.companies },
              { label: 'Áreas com vagas', value: data.length },
            ]}
            caption={home.lastUpdatedAt ? `Atualizado ${relativeDate(home.lastUpdatedAt)}.` : undefined}
          />
        )}

        {data.length === 0 ? (
          <p className="chart-empty">Ainda não há vagas ativas para mostrar.</p>
        ) : (
          <>
            <div className="dash-grid">
              <ChartCard
                title="Vagas ativas por área"
                subtitle="Quantas vagas estão abertas em cada área"
                table={{ columns: ['Área', 'Vagas ativas'], rows: data.map(d => [d.sector.name, formatInt(d.stats.activeJobs)]) }}
              >
                <HBarChart rows={sectorRows} name="Vagas ativas" />
              </ChartCard>

              <ChartCard
                title="Modalidade de trabalho"
                subtitle="Percentagem das vagas ativas, segundo o que cada anúncio indica"
                table={{
                  columns: ['Área', ...MODALITIES.map(m => m.label), 'Total'],
                  rows: modalityRows.map(r => [r.sector, ...MODALITIES.map(m => formatInt(r.counts[m.key] ?? 0)), formatInt(r.total)]),
                }}
              >
                <ModalityChart rows={modalityRows} />
              </ChartCard>
            </div>

            <ChartCard
              title="Vagas por área ao longo do tempo"
              subtitle="Vagas ativas registadas em cada mês de recolha"
              table={{
                columns: ['Mês', ...series.map(s => s.name)],
                rows: monthsTable(series).map(row => [String(row.month), ...series.map(s => (row[s.slug] == null ? '—' : formatInt(Number(row[s.slug]))))]),
              }}
            >
              <JobsOverTimeChart series={series} />
            </ChartCard>

            <section className="dash-section" aria-labelledby="dash-deep-dive">
              <div className="dash-section__header">
                <h2 id="dash-deep-dive" className="dash-section__title">Aprofundar numa área</h2>
                <div className="sector-pills" role="group" aria-label="Área">
                  {data.map(({ sector, stats }) => (
                    <button
                      key={sector.slug}
                      type="button"
                      aria-pressed={sector.slug === selected}
                      onClick={() => setSelected(sector.slug)}
                    >
                      {sector.name}
                      <span className="sector-pills__count">{formatInt(stats.activeJobs)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {current && (
                <div className="dash-grid">
                  <ChartCard
                    title="Competências mais pedidas"
                    subtitle={`Percentagem das ${formatInt(active)} vagas que pedem cada competência`}
                    table={{
                      columns: ['Competência', 'Vagas', '% das vagas'],
                      rows: current.stats.topSkills.map(s => [s.name, formatInt(s.count), `${Math.round((s.count / active) * 100)}%`]),
                    }}
                  >
                    {skillRows.length > 0
                      ? <HBarChart rows={skillRows} name="Vagas" />
                      : <p className="chart-empty">Sem competências identificadas nesta área.</p>}
                  </ChartCard>

                  <ChartCard
                    title="Quem está a contratar"
                    subtitle="Empresas com mais vagas ativas nesta área"
                    table={{ columns: ['Empresa', 'Vagas'], rows: current.stats.topCompanies.map(c => [c.name, formatInt(c.count)]) }}
                  >
                    {companyRows.length > 0
                      ? <HBarChart rows={companyRows} name="Vagas" maxLabelChars={26} />
                      : <p className="chart-empty">Sem empresas identificadas nesta área.</p>}
                  </ChartCard>

                  <ChartCard
                    title="Evolução salarial"
                    subtitle="Média das vagas com salário publicado, por mês de recolha"
                    table={{
                      columns: ['Mês', 'Mínimo (€/mês)', 'Máximo (€/mês)', 'Mínimo (€/ano)', 'Máximo (€/ano)'],
                      rows: current.stats.salaryEvolution.map(p => [
                        p.month,
                        p.avgMin == null ? '—' : formatInt(p.avgMin / MONTHS_PER_YEAR),
                        p.avgMax == null ? '—' : formatInt(p.avgMax / MONTHS_PER_YEAR),
                        p.avgMin == null ? '—' : formatInt(p.avgMin),
                        p.avgMax == null ? '—' : formatInt(p.avgMax),
                      ]),
                    }}
                  >
                    {current.stats.salaryEvolution.length > 0
                      ? <SalaryChart data={current.stats.salaryEvolution} coverage={current.stats.salaryCoverage} />
                      : <p className="chart-empty">Ainda não há vagas com salário publicado nesta área.</p>}
                  </ChartCard>

                  <ChartCard
                    title="Distribuição geográfica"
                    subtitle="Vagas ativas por distrito"
                    table={{ columns: ['Distrito', 'Vagas'], rows: current.stats.districtDistribution.map(d => [d.district, formatInt(d.count)]) }}
                  >
                    {districtRows.length > 0
                      ? <HBarChart rows={districtRows} name="Vagas" />
                      : <p className="chart-empty">Sem dados geográficos nesta área.</p>}
                  </ChartCard>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
