/** Tipos espelhados dos DTOs Java em com.jobify.api.dto */

export interface Sector {
  id: string;
  name: string;
  slug: string;
}

export interface SkillSummary {
  id: string;
  name: string;
  type: string;
}

export interface CompanySummary {
  name: string;
  logoUrl: string | null;
}

export interface Filters {
  skills: SkillSummary[];
  seniorities: string[];
  contractTypes: string[];
  remoteTypes: string[];
  districts: string[];
}

export interface Job {
  id: string;
  title: string;
  company: CompanySummary | null;
  sector: Sector;
  location: string | null;
  district: string | null;
  url: string;
  source: string;
  contractType: string | null;
  remoteType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: 'month' | 'year' | null;
  skills: SkillSummary[];
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface HomeStats {
  activeJobs: number;
  companies: number;
  newThisWeek: number;
  lastUpdatedAt: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MonthCount     { month: string; count: number; }
/** Médias em euros brutos anuais (salários mensais × 14). */
export interface MonthlySalary  { month: string; avgMin: number | null; avgMax: number | null; }
export interface DistrictCount  { district: string; count: number; }

/** Contagem por nome: competência, empresa ou modalidade ('remote', 'hybrid', 'on_site', 'unknown'). */
export interface NamedCount     { name: string; count: number; }

export interface StatsDto {
  activeJobs: number;
  jobsOverTime: MonthCount[];
  salaryEvolution: MonthlySalary[];
  salaryCoverage: number;
  districtDistribution: DistrictCount[];
  topSkills: NamedCount[];
  topCompanies: NamedCount[];
  remoteTypes: NamedCount[];
}

export interface JobsQuery {
  q?: string;
  sector?: string;
  skillId?: string[];
  seniority?: string;
  contractType?: string;
  remoteType?: string;
  district?: string;
  page?: number;
  size?: number;
}
