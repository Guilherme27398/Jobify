export default function Footer() {
  return (
    <footer style={{
      padding: '60px 2rem',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
      maxWidth: 1100,
      margin: '0 auto',
      width: '100%',
    }}>
      <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
        <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Jobify
        </span>
      </span>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
        Dados recolhidos automaticamente · Vagas inativas excluídas por omissão
      </p>
    </footer>
  );
}
