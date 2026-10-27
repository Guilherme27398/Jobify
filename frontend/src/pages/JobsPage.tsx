import { useEffect, useState } from 'react';
import { getSectors, getSectorFilters, getJobs } from '../api/client';
import type { Sector, Filters, Job, PageResponse } from '../api/types';

const PAGE_SIZE = 20;

/* ── Reusable label for form sections ── */
const Label: React.FC<React.PropsWithChildren> = ({ children }) => (
  <label style={{
    display: 'block', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
    color: 'var(--muted)', marginBottom: 8, fontWeight: 600,
  }}>
    {children}
  </label>
);

const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%',
      background: 'var(--bg)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 12px',
      fontSize: 14,
      fontFamily: 'inherit',
      appearance: 'none',
      cursor: 'pointer',
    }}
  >
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

/* ── Sector pills ── */
const SectorPills: React.FC<{
  sectors: Sector[];
  selected: string;
  onSelect: (slug: string) => void;
}> = ({ sectors, selected, onSelect }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
    {sectors.map(s => {
      const active = s.slug === selected;
      return (
        <button
          key={s.id}
          onClick={() => onSelect(s.slug)}
          style={{
            background: active ? 'var(--gradient)' : 'var(--surface)',
            color: active ? '#fff' : 'var(--text)',
            border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
            borderRadius: 999,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {s.name}
        </button>
      );
    })}
  </div>
);

/* ── Skill chip (multi-select) ── */
const SkillChip: React.FC<{
  skill: { id: string; name: string };
  active: boolean;
  onClick: () => void;
}> = ({ skill, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? 'rgba(79,142,247,0.15)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--muted)',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 999,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 500,
      fontFamily: 'inherit',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
  >
    {skill.name}
  </button>
);

/* ── Job card ── */
const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const daysAgo = Math.floor(
    (Date.now() - new Date(job.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return (
    <article style={{
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = '';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
            {job.title}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            {job.company?.name || 'Empresa não identificada'}
            {job.district && <> · {job.district}</>}
          </p>
        </div>
        <span style={{
          fontSize: 11, color: 'var(--muted)',
          background: 'var(--bg)', border: '1px solid var(--border)',
          padding: '3px 8px', borderRadius: 6,
          whiteSpace: 'nowrap',
        }}>
          {daysAgo === 0 ? 'Hoje' : daysAgo === 1 ? 'Ontem' : `Há ${daysAgo}d`}
        </span>
      </div>

      {job.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {job.skills.slice(0, 6).map(s => (
            <span key={s.id} style={{
              fontSize: 11,
              background: 'var(--bg)',
              color: 'var(--muted)',
              padding: '3px 10px', borderRadius: 999,
              border: '1px solid var(--border)',
            }}>
              {s.name}
            </span>
          ))}
        </div>
      )}

      <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
        fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600,
        alignSelf: 'flex-start', marginTop: 4,
      }}>
        Ver vaga →
      </a>
    </article>
  );
};

export default function JobsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [filters, setFilters] = useState<Filters | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [seniority, setSeniority]           = useState('');
  const [contractType, setContractType]     = useState('');
  const [remoteType, setRemoteType]         = useState('');
  const [district, setDistrict]             = useState('');

  const [page, setPage] = useState(0);
  const [jobs, setJobs] = useState<PageResponse<Job> | null>(null);

  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingJobs, setLoadingJobs]       = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  /* ── Load sectors on mount ── */
  useEffect(() => {
    getSectors()
      .then(s => { setSectors(s); if (s[0]) setSelectedSector(s[0].slug); })
      .catch(e => setError(e.message))
      .finally(() => setLoadingSectors(false));
  }, []);

  /* ── When sector changes: load filters, reset all filter state ── */
  useEffect(() => {
    if (!selectedSector) return;
    setLoadingFilters(true);
    setSelectedSkills([]); setSeniority(''); setContractType('');
    setRemoteType(''); setDistrict(''); setPage(0);

    getSectorFilters(selectedSector)
      .then(setFilters)
      .catch(e => setError(e.message))
      .finally(() => setLoadingFilters(false));
  }, [selectedSector]);

  /* ── When filters/page change: fetch jobs ── */
  useEffect(() => {
    if (!selectedSector) return;
    setLoadingJobs(true);
    setError(null);
    getJobs({
      sector: selectedSector,
      skillId: selectedSkills.length ? selectedSkills : undefined,
      seniority: seniority || undefined,
      contractType: contractType || undefined,
      remoteType: remoteType || undefined,
      district: district || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then(setJobs)
      .catch(e => setError(e.message))
      .finally(() => setLoadingJobs(false));
  }, [selectedSector, selectedSkills, seniority, contractType, remoteType, district, page]);

  const toggleSkill = (id: string) => {
    setPage(0);
    setSelectedSkills(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const setFilterAndReset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v); setPage(0);
  };

  return (
    <main style={{ paddingTop: 100, paddingBottom: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>

        <header style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
            Vagas
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800,
            letterSpacing: '-2px', color: 'var(--text)',
          }}>
            Encontra o teu próximo emprego.
          </h1>
        </header>

        {/* ── Sector selector ── */}
        <section style={{ marginBottom: 32 }}>
          <Label>Setor</Label>
          {loadingSectors
            ? <p style={{ color: 'var(--muted)', fontSize: 14 }}>A carregar setores…</p>
            : <SectorPills sectors={sectors} selected={selectedSector} onSelect={setSelectedSector} />
          }
        </section>

        {/* ── Filters ── */}
        {selectedSector && (
          <section style={{
            border: '1px solid var(--border)', borderRadius: 16,
            padding: 24, marginBottom: 32, background: 'var(--surface)',
          }}>
            {loadingFilters || !filters
              ? <p style={{ color: 'var(--muted)', fontSize: 14 }}>A carregar filtros…</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {filters.skills.length > 0 && (
                    <div>
                      <Label>Skills ({selectedSkills.length} seleccionadas)</Label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {filters.skills.map(s => (
                          <SkillChip key={s.id} skill={s}
                            active={selectedSkills.includes(s.id)}
                            onClick={() => toggleSkill(s.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    <div>
                      <Label>Seniority</Label>
                      <Select value={seniority} onChange={setFilterAndReset(setSeniority)}
                        options={filters.seniorities} placeholder="Todas" />
                    </div>
                    <div>
                      <Label>Contrato</Label>
                      <Select value={contractType} onChange={setFilterAndReset(setContractType)}
                        options={filters.contractTypes} placeholder="Todos" />
                    </div>
                    <div>
                      <Label>Regime</Label>
                      <Select value={remoteType} onChange={setFilterAndReset(setRemoteType)}
                        options={filters.remoteTypes} placeholder="Todos" />
                    </div>
                    <div>
                      <Label>Distrito</Label>
                      <Select value={district} onChange={setFilterAndReset(setDistrict)}
                        options={filters.districts} placeholder="Todos" />
                    </div>
                  </div>
                </div>
              )
            }
          </section>
        )}

        {/* ── Results ── */}
        <section>
          {error && (
            <div style={{
              padding: 20, borderRadius: 12,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: 14, marginBottom: 20,
            }}>
              Erro ao carregar dados: {error}
            </div>
          )}

          {jobs && !loadingJobs && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              {jobs.totalElements === 0
                ? 'Nenhuma vaga encontrada.'
                : `${jobs.totalElements} ${jobs.totalElements === 1 ? 'vaga' : 'vagas'} · página ${jobs.page + 1} de ${jobs.totalPages}`
              }
            </p>
          )}

          {loadingJobs && (
            <p style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
              A carregar vagas…
            </p>
          )}

          {!loadingJobs && jobs && jobs.content.length === 0 && (
            <div style={{
              padding: '60px 20px', textAlign: 'center',
              border: '1px dashed var(--border)', borderRadius: 16,
              color: 'var(--muted)',
            }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>Nenhuma vaga corresponde aos filtros.</p>
              <p style={{ fontSize: 13 }}>Tenta remover algum filtro para alargar a pesquisa.</p>
            </div>
          )}

          {!loadingJobs && jobs && jobs.content.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {jobs.content.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          )}
        </section>

        {/* ── Pagination ── */}
        {jobs && jobs.totalPages > 1 && (
          <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loadingJobs}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'var(--surface)', color: 'var(--text)',
                border: '1px solid var(--border)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
                fontFamily: 'inherit', fontSize: 14,
              }}
            >
              ← Anterior
            </button>
            <span style={{ color: 'var(--muted)', fontSize: 13, minWidth: 80, textAlign: 'center' }}>
              {page + 1} / {jobs.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(jobs.totalPages - 1, p + 1))}
              disabled={page >= jobs.totalPages - 1 || loadingJobs}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'var(--surface)', color: 'var(--text)',
                border: '1px solid var(--border)',
                cursor: page >= jobs.totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page >= jobs.totalPages - 1 ? 0.4 : 1,
                fontFamily: 'inherit', fontSize: 14,
              }}
            >
              Seguinte →
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}
