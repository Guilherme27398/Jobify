import { useEffect, useRef, useState } from 'react';

/* ─── Captions shown at different scroll progress ─── */
const CAPTIONS = [
  {
    start: 0, end: 0.22,
    title: 'Conhece o João.',
    sub: 'Desempregado há 8 meses. 200 candidaturas. Zero respostas.',
  },
  {
    start: 0.25, end: 0.47,
    title: 'Cada dia igual ao anterior.',
    sub: 'Vagas desatualizadas. Filtros que não funcionam. Tempo desperdiçado.',
  },
  {
    start: 0.5, end: 0.72,
    title: 'Depois descobriu o Jobify.',
    sub: 'Vagas reais, agregadas e filtradas automaticamente pelo scraper.',
  },
  {
    start: 0.75, end: 1,
    title: 'Hoje trabalha onde sempre sonhou.',
    sub: 'A tua vez.',
  },
];

function captionOpacity(start: number, end: number, p: number): number {
  const fade = 0.06;
  if (p < start || p > end) return 0;
  if (p < start + fade) return (p - start) / fade;
  if (p > end - fade) return (end - p) / fade;
  return 1;
}

/* ─── Gradient that transitions dark→warm as user scrolls ─── */
function heroBg(p: number): string {
  const h1 = 220 + p * 30;
  const h2 = 255 + p * 25;
  const l1 = 6 + p * 22;
  const l2 = 4 + p * 18;
  const s  = 60 - p * 15;
  return `radial-gradient(ellipse at 40% 60%, hsl(${h1},${s}%,${l1}%) 0%, hsl(${h2},${s - 10}%,${l2}%) 100%)`;
}

/* ─── Subtle particle dots ─── */
function ParticleDot({ p, i }: { p: number; i: number }) {
  const seed = (i * 137.508) % 1;
  const x = (seed * 100).toFixed(1);
  const y = ((i * 61.803) % 100).toFixed(1);
  const opacity = Math.max(0, Math.sin(p * Math.PI + i) * 0.15 + 0.05);
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      width: 2, height: 2,
      borderRadius: '50%',
      background: 'white',
      opacity,
      transition: 'opacity 0.1s',
      pointerEvents: 'none',
    }} />
  );
}

interface Props {
  /** Path to the Higgsfield-generated MP4. Leave undefined to show the animated placeholder. */
  videoSrc?: string;
}

export default function ScrollVideoHero({ videoSrc }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const { top } = wrapper.getBoundingClientRect();
      const totalScroll = wrapper.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -top / totalScroll));
      setProgress(p);

      const video = videoRef.current;
      if (video && isFinite(video.duration) && video.duration > 0) {
        video.currentTime = p * video.duration;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeCaption = CAPTIONS.find(c => progress >= c.start && progress <= c.end);

  return (
    /* Tall wrapper — scrolling through this drives the progress */
    <div ref={wrapperRef} style={{ height: '300vh', position: 'relative' }}>

      {/* Sticky viewport-filling container */}
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>

        {/* ── Background: real video OR animated gradient placeholder ── */}
        {videoSrc ? (
          <video
            ref={videoRef}
            muted playsInline preload="auto"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: heroBg(progress),
            transition: 'background 0.05s linear',
          }}>
            {Array.from({ length: 40 }, (_, i) => <ParticleDot key={i} p={progress} i={i} />)}

            {/* Simulated laptop glow */}
            <div style={{
              position: 'absolute',
              left: '50%', top: '55%',
              transform: 'translate(-50%,-50%)',
              width: 380, height: 240,
              borderRadius: 12,
              background: progress < 0.5
                ? `rgba(30,30,60,${0.6 + progress * 0.2})`
                : `rgba(255,200,80,${0.08 + progress * 0.15})`,
              boxShadow: progress < 0.5
                ? `0 0 80px 20px rgba(79,142,247,${0.08 + progress * 0.1})`
                : `0 0 120px 40px rgba(255,180,50,${0.1 + progress * 0.2})`,
              border: `1px solid rgba(255,255,255,${0.05 + progress * 0.06})`,
              transition: 'all 0.15s ease',
            }}>
              {/* Fake screen content */}
              <div style={{ padding: 20 }}>
                <div style={{
                  display: 'flex', gap: 6, marginBottom: 14,
                }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width: 10, height: 10, borderRadius: '50%', background: ['#ff5f57','#ffbd2e','#28c840'][d] }} />
                  ))}
                </div>
                {progress < 0.5 ? (
                  /* Before: rejection emails */
                  <>
                    {['Candidatura rejeitada ✗', 'Sem resposta há 3 semanas', 'Vaga já não disponível', 'Perfil não selecionado ✗'].map((line, i) => (
                      <div key={i} style={{
                        height: 12, borderRadius: 4, marginBottom: 10,
                        background: `rgba(255,80,80,${0.15 + i * 0.05})`,
                        width: `${70 + i * 8}%`,
                        display: 'flex', alignItems: 'center',
                        padding: '0 8px',
                        color: 'rgba(255,120,120,0.7)', fontSize: 9, fontFamily: 'monospace',
                      }}>{line}</div>
                    ))}
                  </>
                ) : (
                  /* After: job offer */
                  <>
                    <div style={{ color: 'rgba(80,255,150,0.8)', fontSize: 11, fontFamily: 'monospace', marginBottom: 8 }}>
                      ✓ Jobify — 3 novas vagas correspondentes
                    </div>
                    {['Senior Developer · Lisboa · 4.200€', 'Full-Stack · Remoto · 3.800€', 'Tech Lead · Porto · 5.000€'].map((line, i) => (
                      <div key={i} style={{
                        height: 14, borderRadius: 4, marginBottom: 8,
                        background: `rgba(79,142,247,${0.12 + i * 0.04})`,
                        padding: '0 8px',
                        display: 'flex', alignItems: 'center',
                        color: 'rgba(150,200,255,0.8)', fontSize: 9, fontFamily: 'monospace',
                      }}>{line}</div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Placeholder label */}
            <div style={{
              position: 'absolute', bottom: 80, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '6px 14px',
              fontSize: 11, color: 'rgba(255,255,255,0.3)',
              whiteSpace: 'nowrap',
            }}>
              Substitui por: <code style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>videoSrc="/hero.mp4"</code>
            </div>
          </div>
        )}

        {/* Dark vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }} />

        {/* ── Captions ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          textAlign: 'center', padding: '0 1.5rem',
          maxWidth: 700,
        }}>
          {CAPTIONS.map((c, i) => (
            <div key={i} style={{
              position: 'absolute', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', top: '50%',
              opacity: captionOpacity(c.start, c.end, progress),
              transition: 'opacity 0.25s ease',
              pointerEvents: 'none',
            }}>
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                fontWeight: 800,
                letterSpacing: '-2px',
                lineHeight: 1.1,
                color: '#fff',
                textShadow: '0 2px 40px rgba(0,0,0,0.5)',
                marginBottom: '1rem',
              }}>{c.title}</h1>
              <p style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 400,
                lineHeight: 1.5,
              }}>{c.sub}</p>
            </div>
          ))}

          {/* Initial text (before any caption activates) */}
          {!activeCaption && progress === 0 && (
            <div>
              <p style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                Jobify
              </p>
              <h1 style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                fontWeight: 800, letterSpacing: '-3px', lineHeight: 1.05,
                color: '#fff',
              }}>
                O mercado de trabalho,<br />
                <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  filtrado.
                </span>
              </h1>
            </div>
          )}
        </div>

        {/* ── Scroll progress bar ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2,
          background: 'rgba(255,255,255,0.08)',
        }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'var(--gradient)',
            transition: 'width 0.05s linear',
          }} />
        </div>

        {/* ── Scroll indicator (fades out) ── */}
        <div style={{
          position: 'absolute', bottom: 28,
          left: '50%', transform: 'translateX(-50%)',
          opacity: Math.max(0, 1 - progress * 8),
          transition: 'opacity 0.3s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
        }}>
          <div style={{ animation: 'bounce 1.5s infinite' }}>↓</div>
          <span>Desliza</span>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
    </div>
  );
}
