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
  skills: SkillSummary[];
  lastSeenAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MonthCount     { month: string; count: number; }
export interface MonthlySalary  { month: string; avgMin: number | null; avgMax: number | null; }
export interface DistrictCount  { district: string; count: number; }

export interface StatsDto {
  jobsOverTime: MonthCount[];
  salaryEvolution: MonthlySalary[];
  salaryCoverage: number;
  districtDistribution: DistrictCount[];
}

export interface JobsQuery {
  sector?: string;
  skillId?: string[];
  seniority?: string;
  contractType?: string;
  remoteType?: string;
  district?: string;
  page?: number;
  size?: number;
}
