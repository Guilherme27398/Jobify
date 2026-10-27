import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const onLanding = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkStyle = {
    color: 'var(--muted)', fontSize: 14, fontWeight: 500, textDecoration: 'none',
    transition: 'color 0.2s',
  } as const;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 2rem',
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled || !onLanding ? 'rgba(6,6,8,0.85)' : 'transparent',
      backdropFilter: scrolled || !onLanding ? 'blur(12px)' : 'none',
      borderBottom: scrolled || !onLanding ? '1px solid #1e1e26' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
          <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Jobify
          </span>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/vagas" style={linkStyle}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          Vagas
        </Link>
        <Link to="/dashboard" style={linkStyle}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          Dashboard
        </Link>
        <Link to="/vagas" style={{
          background: 'var(--gradient)', color: '#fff',
          padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          textDecoration: 'none', transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Explorar vagas
        </Link>
      </div>
    </nav>
  );
}
