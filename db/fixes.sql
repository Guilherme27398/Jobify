-- Jobify — correções ao schema já existente na BD (2026-07-20)
-- Aplicar no SQL Editor do Supabase, por cima do schema que já lá está.
-- Acrescenta o que as decisões da Fase 0 exigem e que faltava.

-- 1. Deduplicação: uma vaga é única por (source, external_id).
--    Sem isto o upsert do scraper não tem alvo e entram duplicados.
alter table jobs
  add constraint jobs_source_external_id_key unique (source, external_id);

-- 2. Regra de inatividade (3 execuções consecutivas bem-sucedidas sem ver a vaga → inativa).
--    is_active já existe; falta o contador de falhanços consecutivos.
alter table jobs
  add column if not exists consecutive_misses smallint not null default 0;

-- 3. Distrito normalizado pelo scraper, para o gráfico de distribuição geográfica
--    (location fica com o valor em bruto da fonte).
alter table jobs
  add column if not exists district text;

-- 4. Cada vaga pertence a exatamente um setor (decisão de desenho) — não pode ser null.
alter table jobs
  alter column sector_id set not null;

-- 5. Taxonomia de skills sem duplicados (o matching do scraper é feito por nome).
alter table skills
  add constraint skills_name_key unique (name);

-- 6. Sanidade dos salários.
alter table job_snapshots
  add constraint job_snapshots_salary_range_check
  check (salary_min is null or salary_max is null or salary_min <= salary_max);

-- 7. Segurança: RLS em todas as tabelas, sem políticas.
--    O scraper e a API usam ligação direta (ignora RLS); isto serve para fechar
--    a API REST automática do Supabase (PostgREST), que não usamos.
alter table sectors        enable row level security;
alter table companies      enable row level security;
alter table skills         enable row level security;
alter table scrape_runs    enable row level security;
alter table jobs           enable row level security;
alter table job_skills     enable row level security;
alter table job_snapshots  enable row level security;
alter table users          enable row level security;
alter table saved_searches enable row level security;
