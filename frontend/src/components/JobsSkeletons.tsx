import JobCardSkeleton from './JobCardSkeleton';

/*
 * Esqueletos da página de vagas. Ocupam o mesmo espaço dos elementos reais
 * (pills de área, painel de filtros, contagem e cartões) para a página não saltar.
 */

/** Pills de área enquanto as áreas carregam. */
export function SectorPillsSkeleton() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {/* Larguras aproximadas das pills reais ('Todas' + áreas), para ocuparem as mesmas linhas */}
      {[84, 100, 94, 70, 108, 156, 218, 96, 188, 184, 208, 100].map((width, i) => (
        <div key={i} className="skeleton" style={{ height: 40, width, borderRadius: 999 }} />
      ))}
    </div>
  );
}

/** Conteúdo do painel de filtros: skills e os quatro selects. */
export function FiltersSkeleton() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="skeleton" style={{ height: 11, width: 150, marginBottom: 10 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[92, 124, 104, 80, 116].map((width, i) => (
            <div key={i} className="skeleton" style={{ height: 26, width, borderRadius: 999 }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i}>
            <div className="skeleton" style={{ height: 11, width: 64, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Linha da contagem de resultados + grelha de cartões. */
export function ResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {/* Anunciado por leitores de ecrã; o resto é decorativo. */}
      <p role="status" className="sr-only">A carregar vagas…</p>
      <div className="skeleton" aria-hidden="true" style={{ height: 14, width: 170, marginBottom: 22 }} />
      <div className="jobs-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => <JobCardSkeleton key={i} />)}
      </div>
    </>
  );
}
