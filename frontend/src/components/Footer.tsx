import { Link } from 'react-router-dom';

const LINKS = [
  { to: '/vagas', label: 'Vagas' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '64px 2rem 40px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 40,
      }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-white.png" alt="" height={34} />
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>
              <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Jobify
              </span>
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginTop: 14 }}>
            O mercado de trabalho, filtrado. Vagas reais de Portugal, num só lugar.
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
            Explorar
          </span>
          {LINKS.map(link => (
            <Link key={link.to} to={link.to} style={{
              fontSize: 15, color: 'var(--text)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', minHeight: 44,
              opacity: 0.85,
            }}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{
        maxWidth: 1100, margin: '48px auto 0',
        paddingTop: 24, borderTop: '1px solid var(--border)',
        fontSize: 13, color: 'var(--muted)',
      }}>
        © 2026 Jobify. Todos os direitos reservados.
      </div>
    </footer>
  );
}
