import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHomeStats, getSectors } from '../api/client';
import type { HomeStats, Sector } from '../api/types';
import ScrollVideoHero from '../components/ScrollVideoHero';
import SearchBar from '../components/SearchBar';
import FeaturedJobs from '../components/FeaturedJobs';
import HowItWorks from '../components/HowItWorks';
import StatsStrip from '../components/StatsStrip';
import Reveal from '../components/Reveal';

/*
 * Cada secção com dados reais só aparece se a API responder.
 */
export default function LandingPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stats, setStats] = useState<HomeStats | null>(null);

  useEffect(() => {
    getSectors().then(setSectors).catch(() => setSectors([]));
    getHomeStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <>
      <ScrollVideoHero videoSrc="/hero-jobify.mp4" />

      {sectors.length > 0 && (
        <Reveal>
          <div className="page-section" style={{ paddingTop: 72, paddingBottom: 0 }}>
            <SearchBar sectors={sectors} />
          </div>
        </Reveal>
      )}

      {sectors.length > 0 && (
        <Reveal>
          <FeaturedJobs sectors={sectors} />
        </Reveal>
      )}

      <Reveal>
        <HowItWorks />
      </Reveal>

      {stats && <StatsStrip stats={stats} />}

      <Reveal>
        <section className="page-section" style={{ textAlign: 'center' }}>
          <div style={{
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            padding: '88px 40px',
            borderRadius: 28,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.22) 0%, rgba(168,85,247,0.10) 42%, var(--surface) 78%)',
            border: '1px solid rgba(79,142,247,0.25)',
            boxShadow: '0 30px 80px -30px rgba(79,142,247,0.35)',
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1,
              color: 'var(--text)', marginBottom: 24,
              maxWidth: 760, marginLeft: 'auto', marginRight: 'auto',
            }}>
              O próximo emprego está a uma pesquisa de distância.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 48, lineHeight: 1.7 }}>
              Vagas de Portugal, num só lugar e atualizadas regularmente.<br />
              Sem registo e sem spam.
            </p>
            <Link to="/vagas" className="cta-glow" style={{
              display: 'inline-block',
              background: 'var(--gradient)',
              color: '#fff', textDecoration: 'none',
              padding: '16px 40px', borderRadius: 999,
              fontSize: 16, fontWeight: 700,
            }}>
              Explorar vagas →
            </Link>
          </div>
        </section>
      </Reveal>
    </>
  );
}
