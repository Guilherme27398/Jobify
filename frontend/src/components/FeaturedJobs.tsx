import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../api/client';
import type { Job, Sector } from '../api/types';
import { contractLabel, normalizeTitle, remoteLabel, salaryLabel, sourceLabel } from '../utils/job';
import { relativeDate } from '../utils/format';

const SIZE = 3;

export default function FeaturedJobs({ sectors }: { sectors: Sector[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);

  /* Os chips filtram os cartões na própria página, através da API. */
  useEffect(() => {
    setJobs(null);
    getJobs({ size: SIZE, sector: selected ?? undefined })
      .then(page => setJobs(page.content))
      .catch(() => setJobs([]));
  }, [selected]);

  return (
    <section className="page-section">
      <p className="eyebrow">Vagas recentes</p>
      <h2 className="section-title">Explora por área.</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 40 }}>
        <Chip active={selected === null} onClick={() => setSelected(null)}>Todas</Chip>
        {sectors.map(s => (
          <Chip key={s.slug} active={selected === s.slug} onClick={() => setSelected(s.slug)}>
            {s.name}
          </Chip>
        ))}
      </div>

      {/* A chave muda com a área: a grelha volta a animar a cada troca. */}
      <div className="job-grid" key={selected ?? 'all'}>
        {jobs === null && [0, 1, 2].map(i => (
          <div key={i} className="skeleton job-skeleton" style={{ '--i': i } as CSSProperties} />
        ))}

        {jobs !== null && jobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
      </div>

      {jobs !== null && jobs.length === 0 && (
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>Ainda não há vagas nesta área.</p>
      )}

      <div style={{ marginTop: 40 }}>
        <Link to="/vagas" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
          Ver todas as vagas →
        </Link>
      </div>
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '10px 20px', minHeight: 44, borderRadius: 999, cursor: 'pointer',
        border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
        background: active ? 'var(--gradient)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--text)',
        fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function JobCard({ job, index }: { job: Job; index: number }) {
  const tags = [contractLabel(job.contractType), remoteLabel(job.remoteType)].filter(Boolean) as string[];
  const salary = salaryLabel(job);
  const company = job.company?.name ?? 'Empresa não indicada';

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="job-card"
      style={{ '--i': index } as CSSProperties}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span className="job-sector">{job.sector.name}</span>
        <span className="job-source">{sourceLabel(job.source)}</span>
      </div>

      <h3 className="job-title">{normalizeTitle(job.title)}</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="job-avatar" aria-hidden="true">{company.charAt(0).toUpperCase()}</span>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {company}
          </p>
          {job.location && <p style={{ fontSize: 13, color: 'var(--muted)' }}>{job.location}</p>}
        </div>
      </div>

      {(tags.length > 0 || salary) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map(t => <Tag key={t}>{t}</Tag>)}
          {salary && <Tag highlight>{salary}</Tag>}
        </div>
      )}

      <div className="job-footer">
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Encontrada {relativeDate(job.firstSeenAt)}</span>
        <span className="job-cta">Ver anúncio →</span>
      </div>
    </a>
  );
}

function Tag({ children, highlight = false }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
      border: `1px solid ${highlight ? 'rgba(79,142,247,0.5)' : 'var(--border)'}`,
      background: highlight ? 'rgba(79,142,247,0.08)' : 'transparent',
      color: highlight ? 'var(--accent)' : 'var(--muted)',
    }}>
      {children}
    </span>
  );
}
