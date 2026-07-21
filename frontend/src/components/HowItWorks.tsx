const STEPS = [
  {
    num: '01',
    title: 'Scraper agrega',
    body: 'Um scraper Python corre automaticamente, recolhendo vagas do LinkedIn por setor e normalizando os dados — salário, localização, seniority, skills.',
  },
  {
    num: '02',
    title: 'API filtra',
    body: 'A API Spring Boot expõe endpoints com filtros combináveis derivados dos dados reais: por skills existentes, tipo de contrato, regime remoto e distrito.',
  },
  {
    num: '03',
    title: 'Tu decides',
    body: 'Escolhes setor, aplicas filtros e vês vagas ativas ordenadas por data. Sem duplicados, sem vagas encerradas — só o que importa.',
  },
];

export default function HowItWorks() {
  return (
    <section style={{
      padding: '120px 2rem',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
          Como funciona
        </p>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 800, letterSpacing: '-2px',
          color: 'var(--text)', marginBottom: 80,
        }}>
          Três camadas.<br />Um resultado.
        </h2>

        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 240,
              padding: '40px 36px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: i === 0 ? '24px 0 0 24px' : i === 2 ? '0 24px 24px 0' : 0,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -10, right: 16,
                fontSize: 80, fontWeight: 900,
                color: 'rgba(255,255,255,0.02)',
                letterSpacing: -4, lineHeight: 1,
                userSelect: 'none',
              }}>
                {step.num}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: 'var(--accent)',
                marginBottom: 16, letterSpacing: 1,
              }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
