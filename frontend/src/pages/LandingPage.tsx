import { Link } from 'react-router-dom';
import ScrollVideoHero from '../components/ScrollVideoHero';
import BeforeAfter from '../components/BeforeAfter';
import HowItWorks from '../components/HowItWorks';

/*
 * Para activar os assets Higgsfield após geração, passa os props:
 *   <ScrollVideoHero videoSrc="/hero-jobify.mp4" />
 *   <BeforeAfter imageBefore="/before.jpg" imageAfter="/after.jpg" />
 */
export default function LandingPage() {
  return (
    <>
      <ScrollVideoHero />
      <BeforeAfter />
      <HowItWorks />

      <section id="vagas" style={{
        padding: '140px 2rem',
        textAlign: 'center',
        maxWidth: 700,
        margin: '0 auto',
      }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
          Começa agora
        </p>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3.5rem)',
          fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1,
          color: 'var(--text)', marginBottom: 24,
        }}>
          O emprego certo<br />está na próxima pesquisa.
        </h2>
        <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 48, lineHeight: 1.7 }}>
          Vagas reais, filtros que funcionam, dados sempre frescos.<br />
          Sem cadastro. Sem spam.
        </p>
        <Link to="/vagas" style={{
          display: 'inline-block',
          background: 'var(--gradient)',
          color: '#fff', textDecoration: 'none',
          padding: '16px 40px', borderRadius: 999,
          fontSize: 16, fontWeight: 700,
          boxShadow: '0 0 40px rgba(79,142,247,0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 50px rgba(79,142,247,0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.3)';
          }}
        >
          Explorar vagas →
        </Link>
      </section>
    </>
  );
}
