import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 2rem',
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(6,6,8,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #1e1e26' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
        <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Jobify
        </span>
      </span>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {['Vagas', 'Setores', 'Dashboard'].map(label => (
          <a key={label} href={`#${label.toLowerCase()}`} style={{
            color: 'var(--muted)', fontSize: 14, fontWeight: 500, textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            {label}
          </a>
        ))}
        <a href="#vagas" style={{
          background: 'var(--gradient)', color: '#fff',
          padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          textDecoration: 'none', transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Explorar vagas
        </a>
      </div>
    </nav>
  );
}
