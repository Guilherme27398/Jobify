import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDistricts, getSectorFilters } from '../api/client';
import type { Sector } from '../api/types';

/*
 * Barra de pesquisa da homepage: uma pill com palavra-chave, área e localização.
 * Ao submeter navega para /vagas com q, sector e district (só os preenchidos).
 * Os estilos vivem em index.css (secção "Barra de pesquisa").
 */
export default function SearchBar({ sectors }: { sectors: Sector[] }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [sector, setSector] = useState(''); // '' = todas as áreas
  const [district, setDistrict] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);

  /* As localizações dependem da área escolhida; sem área, vêm de todas. */
  useEffect(() => {
    let cancelled = false;
    setDistrict('');
    const load = sector ? getSectorFilters(sector).then(f => f.districts) : getDistricts();
    load
      .then(list => { if (!cancelled) setDistricts(list); })
      .catch(() => { if (!cancelled) setDistricts([]); });
    return () => { cancelled = true; };
  }, [sector]);

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (sector) params.set('sector', sector);
    if (district) params.set('district', district);
    navigate(`/vagas?${params.toString()}`);
  };

  return (
    <form role="search" aria-label="Pesquisar vagas" onSubmit={submit} className="search-pill">
      <label className="search-seg search-seg--keyword search-seg--icon">
        <SearchIcon />
        <span className="sr-only">Cargo ou palavra-chave</span>
        <input
          type="search"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="Cargo ou palavra-chave"
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      <span className="search-divider" aria-hidden="true" />

      <label className="search-seg">
        <span className="sr-only">Área</span>
        <select value={sector} onChange={e => setSector(e.target.value)} className={sector ? undefined : 'is-empty'}>
          <option value="">Todas as áreas</option>
          {sectors.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <ChevronIcon />
      </label>

      <span className="search-divider" aria-hidden="true" />

      <label className="search-seg search-seg--icon">
        <PinIcon />
        <span className="sr-only">Localização</span>
        <select value={district} onChange={e => setDistrict(e.target.value)} className={district ? undefined : 'is-empty'}>
          <option value="">Todo o país</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <ChevronIcon />
      </label>

      <button type="submit" className="search-submit">Pesquisar</button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="search-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
