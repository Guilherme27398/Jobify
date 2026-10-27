import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';

/*
 * História do hero. Cada legenda aparece entre `from` e `to`
 * (progresso do scroll, de 0 a 1). Edita aqui para mudar o texto ou os momentos.
 */
const HERO_CAPTIONS = [
  { from: 0.2, to: 0.42, text: 'O João não encontra trabalho.' },
  { from: 0.44, to: 0.6, text: 'Há muito tempo que procura, sem sucesso.' },
  { from: 0.66, to: 0.82, text: 'Pouco depois de conhecer o Jobify…' },
  { from: 0.84, to: 1, text: '…encontrou emprego.' },
];

/* Altura da área de scroll que controla o vídeo. */
const SCROLL_HEIGHT = '250vh';
const FADE = 0.04;
const INTRO_END = 0.06;

const STATIC_QUERY = '(max-width: 767px), (prefers-reduced-motion: reduce)';

function captionOpacity(from: number, to: number, p: number): number {
  if (p < from || p > to) return 0;
  if (p < from + FADE) return (p - from) / FADE;
  if (p > to - FADE) return (to - p) / FADE;
  return 1;
}

function introOpacity(p: number): number {
  return Math.max(0, 1 - p / INTRO_END);
}

export default function ScrollVideoHero({ videoSrc }: { videoSrc: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const isStatic = useMediaQuery(STATIC_QUERY);

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

  /* Versão estática: última frame, texto em sequência, sem scrub. */
  if (isStatic) {
    return (
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <img
          src="/hero-final.jpg"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,8,0.95) 0%, rgba(6,6,8,0.4) 70%)' }} />
        <div style={{ position: 'relative', padding: '120px 1.25rem 56px' }}>
          <Intro />
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HERO_CAPTIONS.map(c => (
              <p key={c.text} style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                {c.text}
              </p>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const introVisible = introOpacity(progress);

  return (
    <div ref={wrapperRef} style={{ height: SCROLL_HEIGHT, position: 'relative' }}>
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster="/hero-poster.jpg"
          onLoadedData={() => setReady(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: ready ? 1 : 0, transition: 'opacity 0.6s ease',
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(6,6,8,0.85) 0%, rgba(6,6,8,0) 55%)',
          pointerEvents: 'none',
        }} />

        {/* Intro: título, subtítulo e CTA, visíveis sem scroll */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '42%',
          transform: 'translateY(-50%)',
          padding: '0 1.5rem', textAlign: 'center', zIndex: 10,
          opacity: introVisible, pointerEvents: introVisible > 0.5 ? 'auto' : 'none',
          transition: 'opacity 0.2s linear',
        }}>
          <Intro />
        </div>

        {/* Legendas sincronizadas com o scroll */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: '12vh', height: 160,
          zIndex: 10, textAlign: 'center', padding: '0 1.5rem', pointerEvents: 'none',
        }}>
          {HERO_CAPTIONS.map(c => (
            <p key={c.text} style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(100%, 820px)',
              fontSize: 'clamp(1.6rem, 3.6vw, 2.9rem)',
              fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15,
              color: '#fff', textShadow: '0 2px 30px rgba(0,0,0,0.6)',
              opacity: captionOpacity(c.from, c.to, progress),
              transition: 'opacity 0.25s ease',
            }}>
              {c.text}
            </p>
          ))}
        </div>

        {/* Barra de progresso */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: 'var(--gradient)', transition: 'width 0.05s linear',
          }} />
        </div>

        {/* Indicador de scroll, que desaparece cedo */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          opacity: Math.max(0, 1 - progress * 8),
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
        }}>
          <svg className="scroll-bounce" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span>Desliza</span>
        </div>
      </div>
    </div>
  );
}

function Intro() {
  return (
    <>
      <p style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
        Jobify
      </p>
      <h1 style={{
        fontSize: 'clamp(2.25rem, 6vw, 4.5rem)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.05,
        color: '#fff', textShadow: '0 2px 30px rgba(0,0,0,0.5)',
      }}>
        O mercado de trabalho,{' '}
        <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          filtrado.
        </span>
      </h1>
      <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(255,255,255,0.8)', marginTop: 20, lineHeight: 1.6 }}>
        Vagas reais de Portugal, num só lugar.<br />Sem registo e sem spam.
      </p>
      <Link to="/vagas" className="cta-glow" style={{
        display: 'inline-block', marginTop: 32,
        background: 'var(--gradient)', color: '#fff', textDecoration: 'none',
        padding: '15px 36px', borderRadius: 999, fontSize: 16, fontWeight: 700,
      }}>
        Explorar vagas →
      </Link>
    </>
  );
}
