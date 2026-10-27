import type { Filters, JobsQuery, PageResponse, Job, Sector, StatsDto } from './types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function getSectors(): Promise<Sector[]> {
  return get<Sector[]>('/sectors');
}

export function getSectorFilters(slug: string): Promise<Filters> {
  return get<Filters>(`/sectors/${encodeURIComponent(slug)}/filters`);
}

export function getStats(slug: string): Promise<StatsDto> {
  return get<StatsDto>(`/stats/${encodeURIComponent(slug)}`);
}

export function getJobs(query: JobsQuery): Promise<PageResponse<Job>> {
  const params = new URLSearchParams();
  if (query.sector)       params.set('sector', query.sector);
  if (query.seniority)    params.set('seniority', query.seniority);
  if (query.contractType) params.set('contractType', query.contractType);
  if (query.remoteType)   params.set('remoteType', query.remoteType);
  if (query.district)     params.set('district', query.district);
  if (query.page != null) params.set('page', String(query.page));
  if (query.size != null) params.set('size', String(query.size));
  if (query.skillId) query.skillId.forEach(id => params.append('skillId', id));
  return get<PageResponse<Job>>(`/jobs?${params.toString()}`);
}
