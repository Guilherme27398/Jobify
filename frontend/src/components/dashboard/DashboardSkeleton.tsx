/*
 * Esqueleto da dashboard: imita o layout final (indicadores, dois cartões, gráfico largo e a
 * secção "Aprofundar numa área") para a página não saltar quando os dados chegam.
 * As alturas dos cartões são as medidas reais em desktop.
 */

const BAR_WIDTHS = [88, 72, 61, 49, 38, 30, 24, 20, 16, 12];

function SkeletonCard({ height, bars }: { height: number; bars?: number }) {
  return (
    <div className="chart-card sk-card" style={{ minHeight: height }} aria-hidden="true">
      <div className="skeleton sk-title" />
      <div className="skeleton sk-subtitle" />
      {bars ? (
        <div className="sk-bars">
          {BAR_WIDTHS.slice(0, bars).map((width, i) => (
            <div key={i} className="sk-bar-row">
              <div className="skeleton sk-bar-label" />
              <div className="skeleton sk-bar" style={{ width: `${width}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="skeleton sk-plot" />
      )}
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <>
      {/* Anunciado por leitores de ecrã; o resto é decorativo. */}
      <p role="status" className="sr-only">A carregar dashboard…</p>

      <section className="kpi-row" aria-hidden="true">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="kpi">
            <div className="skeleton sk-kpi-label" />
            <div className="skeleton sk-kpi-value" />
          </div>
        ))}
        <div className="skeleton sk-caption" />
      </section>

      <div className="dash-grid" aria-hidden="true">
        <SkeletonCard height={332} bars={3} />
        <SkeletonCard height={332} bars={3} />
      </div>

      <SkeletonCard height={503} />

      <section className="dash-section" aria-hidden="true">
        <div className="dash-section__header">
          <div className="skeleton sk-heading" />
          <div className="sector-pills">
            {[0, 1, 2].map(i => <div key={i} className="skeleton sk-pill" />)}
          </div>
        </div>
        <div className="dash-grid">
          <SkeletonCard height={512} bars={10} />
          <SkeletonCard height={512} bars={8} />
          <SkeletonCard height={403} />
          <SkeletonCard height={403} bars={5} />
        </div>
      </section>
    </>
  );
}
