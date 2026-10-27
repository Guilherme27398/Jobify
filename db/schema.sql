-- Jobify — schema v1 (PostgreSQL / Supabase)
-- Fotografia fiel da BD real em 2026-07-20 (schema original + db/fixes.sql aplicados).
-- Não voltar a correr na BD existente; serve como referência e como base da
-- migração baseline do Flyway (V1__baseline.sql) na Fase 3.

-- ─────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────

create type skill_type    as enum ('technical', 'legal', 'language', 'certification', 'soft_skill', 'other');
create type scrape_status as enum ('running', 'success', 'failed', 'partial');
create type contract_type as enum ('full_time', 'part_time', 'internship', 'freelance', 'temporary');
create type remote_type   as enum ('on_site', 'hybrid', 'remote');

-- ─────────────────────────────────────────────
-- Tabelas de referência
-- ─────────────────────────────────────────────

create table sectors (
  id          uuid not null default gen_random_uuid() primary key,
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table companies (
  id           uuid not null default gen_random_uuid() primary key,
  name         text not null,
  linkedin_url text,
  location     text,
  logo_url     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table skills (
  id          uuid not null default gen_random_uuid() primary key,
  name        text not null unique,
  skill_type  skill_type not null default 'other',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Execuções do scraper
-- ─────────────────────────────────────────────

create table scrape_runs (
  id            uuid not null default gen_random_uuid() primary key,
  source        text not null,
  sector_target uuid references sectors (id),
  query_used    text,                      -- query de pesquisa usada (vem do queries.yml)
  status        scrape_status not null default 'running',
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  jobs_found    integer default 0,
  jobs_new      integer default 0,
  error_log     text
);

-- ─────────────────────────────────────────────
-- Vagas
-- ─────────────────────────────────────────────

create table jobs (
  id           uuid not null default gen_random_uuid() primary key,
  company_id   uuid references companies (id),
  sector_id    uuid not null references sectors (id),  -- setor da query da primeira vez vista; nunca muda
  external_id  text not null,
  source       text not null,
  title        text not null,
  description  text,
  location     text,                                    -- localização em bruto, tal como vem da fonte
  district     text,                                    -- normalizado pelo scraper (distribuição geográfica)
  url          text not null,
  -- regra de inatividade: 3 execuções consecutivas bem-sucedidas do setor sem ver a vaga → is_active = false;
  -- se reaparecer, o scraper repõe is_active = true e consecutive_misses = 0
  is_active           boolean not null default true,
  consecutive_misses  smallint not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (source, external_id)                          -- alvo do upsert do scraper (deduplicação)
);

create table job_skills (
  job_id    uuid not null references jobs (id),
  skill_id  uuid not null references skills (id),
  primary key (job_id, skill_id)
);

-- Dados voláteis: uma linha por vaga por execução do scraper, em modo append-only.
-- É daqui que saem os gráficos de evolução ao longo do tempo.
create table job_snapshots (
  id              uuid not null default gen_random_uuid() primary key,
  job_id          uuid not null references jobs (id),
  scrape_run_id   uuid references scrape_runs (id),
  seniority       text,
  contract_type   contract_type,
  remote_type     remote_type,
  salary_min      numeric,
  salary_max      numeric,
  salary_currency text default 'EUR',
  salary_period   text check (salary_period in ('month', 'year')),  -- V2 (Flyway)
  recorded_at     timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_min <= salary_max)
);

-- ─────────────────────────────────────────────
-- Funcionalidade futura (fora da v1, por decisão de 2026-07-20)
-- ─────────────────────────────────────────────

create table users (
  id            uuid not null default gen_random_uuid() primary key,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table saved_searches (
  id               uuid not null default gen_random_uuid() primary key,
  user_id          uuid not null references users (id),
  name             text,
  filters          jsonb not null default '{}',
  last_notified_at timestamptz,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Índices para os padrões de leitura da API
-- ─────────────────────────────────────────────

create index if not exists idx_jobs_sector_active on jobs (sector_id) where is_active;
create index if not exists idx_jobs_last_seen on jobs (last_seen_at);
create index if not exists idx_job_skills_skill on job_skills (skill_id);
create index if not exists idx_job_snapshots_job_recorded on job_snapshots (job_id, recorded_at desc);
create index if not exists idx_scrape_runs_sector_started on scrape_runs (sector_target, started_at desc);

-- ─────────────────────────────────────────────
-- Segurança
-- ─────────────────────────────────────────────
-- O scraper e a API ligam-se por connection string direta (role postgres), que ignora RLS.
-- RLS ativado sem políticas bloqueia o acesso anónimo via API auto-gerada do Supabase (PostgREST),
-- que não usamos e não queremos deixar aberta.

alter table sectors        enable row level security;
alter table companies      enable row level security;
alter table skills         enable row level security;
alter table scrape_runs    enable row level security;
alter table jobs           enable row level security;
alter table job_skills     enable row level security;
alter table job_snapshots  enable row level security;
alter table users          enable row level security;
alter table saved_searches enable row level security;
