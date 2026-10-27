import { useEffect, useState } from 'react';
import type { HomeStats } from '../api/types';
import { useInView } from '../hooks/useInView';
import { ageInDays, relativeDate } from '../utils/format';

/* Acima disto, os números são velhos demais para os mostrar. */
const MAX_AGE_DAYS = 7;

/* Conta de 0 até ao valor quando a secção entra no ecrã. */
function useCountUp(target: number, enabled: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, duration]);

  return value;
}

function Counter({ target, enabled }: { target: number; enabled: boolean }) {
  return <>{useCountUp(target, enabled).toLocaleString('pt-PT')}</>;
}

export default function StatsStrip({ stats }: { stats: HomeStats }) {
  const [ref, inView] = useInView<HTMLElement>(0.3);

  const lastUpdatedAt = stats.lastUpdatedAt;
  if (!lastUpdatedAt || ageInDays(lastUpdatedAt) > MAX_AGE_DAYS) return null;

  return (
    <section ref={ref} className="page-section">
      <div>
        <p className="eyebrow">Neste momento</p>
        <h2 className="section-title" style={{ marginBottom: 56 }}>O Jobify em números.</h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40,
        }}>
          <Stat label="vagas ativas">
            <Counter target={stats.activeJobs} enabled={inView} />
          </Stat>
          <Stat label="novas esta semana">
            <Counter target={stats.newThisWeek} enabled={inView} />
          </Stat>
          <Stat label="empresas">
            <Counter target={stats.companies} enabled={inView} />
          </Stat>
        </div>

        <p style={{ marginTop: 40, fontSize: 13, color: 'var(--muted)' }}>
          Atualizado {relativeDate(lastUpdatedAt)}.
        </p>
      </div>
    </section>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 24 }}>
      <div style={{
        fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1,
        background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        {children}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 10 }}>
        {label}
      </div>
    </div>
  );
}
