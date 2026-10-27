/**
 * Secção de "antes e depois" com dois cards.
 * imageBefore / imageAfter: substituir pelo caminho das imagens Higgsfield
 * quando geradas (ex.: "/higgsfield-before.jpg").
 */
interface Props {
  imageBefore?: string;
  imageAfter?: string;
}

function Card({
  label, accent, image, description, details,
}: {
  label: string;
  accent: string;
  image?: string;
  description: string;
  details: string[];
}) {
  return (
    <div style={{
      flex: 1, minWidth: 280,
      border: '1px solid var(--border)',
      borderRadius: 24,
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {/* Image area */}
      <div style={{
        height: 280, position: 'relative', overflow: 'hidden',
        background: image ? 'transparent' : (
          label === 'Antes'
            ? 'linear-gradient(160deg, #0a0a18 0%, #0d0d2b 100%)'
            : 'linear-gradient(160deg, #0a1a0a 0%, #0d2010 100%)'
        ),
      }}>
        {image ? (
          <img src={image} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          /* Placeholder CSS art */
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{
              fontSize: 64,
              filter: 'grayscale(0.3)',
              opacity: label === 'Antes' ? 0.6 : 1,
            }}>
              {label === 'Antes' ? '😔' : '🎉'}
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.2)',
              border: '1px dashed rgba(255,255,255,0.12)',
              padding: '4px 10px', borderRadius: 6,
              fontFamily: 'monospace',
            }}>
              {label === 'Antes' ? 'imageBefore="/foto.jpg"' : 'imageAfter="/foto.jpg"'}
            </div>
          </div>
        )}

        {/* Label badge */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          background: accent, color: '#fff',
          padding: '4px 12px', borderRadius: 999,
          fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
        }}>
          {label}
        </div>
      </div>

      {/* Text */}
      <div style={{ padding: '24px 28px 28px' }}>
        <p style={{
          fontSize: 16, fontWeight: 600, color: 'var(--text)',
          marginBottom: 14, lineHeight: 1.4,
        }}>
          {description}
        </p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {details.map((d, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: 'var(--muted)' }}>
              <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>—</span>
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function BeforeAfter({ imageBefore, imageAfter }: Props) {
  return (
    <section style={{ padding: '120px 2rem', maxWidth: 1100, margin: '0 auto' }}>
      <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
        A diferença
      </p>
      <h2 style={{
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1,
        color: 'var(--text)', marginBottom: 60,
      }}>
        Uma busca de emprego<br />que finalmente <em style={{ fontStyle: 'normal', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>funciona.</em>
      </h2>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Card
          label="Antes"
          accent="#ef4444"
          image={imageBefore}
          description="Horas perdidas em portais desatualizados."
          details={[
            'Vagas duplicadas ou já encerradas',
            'Filtros que não refletem dados reais',
            'Sem histórico de evolução salarial',
            'Candidaturas para o vazio',
          ]}
        />
        <Card
          label="Com Jobify"
          accent="#22c55e"
          image={imageAfter}
          description="Vagas reais, atualizadas, com contexto."
          details={[
            'Scraper corre automaticamente — dados frescos',
            'Filtros derivados dos dados reais da BD',
            'Evolução salarial e distribuição geográfica',
            'Vagas inativas excluídas por omissão',
          ]}
        />
      </div>
    </section>
  );
}
