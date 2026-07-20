-- Jobify — verificação da Fase 1 (schema + fixes + seeds + índices + RLS)
-- Correr no SQL Editor do Supabase (ou noutro cliente SQL) sempre que se quiser
-- confirmar que a BD está no estado esperado. Só lê — não altera nada.
-- Resultado esperado: contagens iguais ao "esperado" e tudo o resto 'OK'.
-- Verificado com sucesso em 2026-07-20.

select 'seed: setores (esperado 3)' as verificacao, count(*)::text as resultado
from sectors
union all
select 'seed: skills (esperado 18)', count(*)::text
from skills
union all
select 'fix 1: unique (source, external_id) em jobs',
  case when exists (select 1 from pg_constraint where conname = 'jobs_source_external_id_key')
       then 'OK' else 'FALTA' end
union all
select 'fix 2: coluna jobs.consecutive_misses',
  case when exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'jobs'
                      and column_name = 'consecutive_misses')
       then 'OK' else 'FALTA' end
union all
select 'fix 3: coluna jobs.district',
  case when exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'jobs'
                      and column_name = 'district')
       then 'OK' else 'FALTA' end
union all
select 'fix 4: jobs.sector_id NOT NULL',
  case when (select is_nullable from information_schema.columns
             where table_schema = 'public' and table_name = 'jobs'
               and column_name = 'sector_id') = 'NO'
       then 'OK' else 'FALTA' end
union all
select 'fix 5: unique (name) em skills',
  case when exists (select 1 from pg_constraint where conname = 'skills_name_key')
       then 'OK' else 'FALTA' end
union all
select 'fix 6: check de salários em job_snapshots',
  case when exists (select 1 from pg_constraint where conname = 'job_snapshots_salary_range_check')
       then 'OK' else 'FALTA' end
union all
select 'fix 7: RLS ativo (esperado 9 tabelas)', count(*)::text
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relrowsecurity
  and c.relname in ('sectors','companies','skills','scrape_runs','jobs',
                    'job_skills','job_snapshots','users','saved_searches')
union all
select 'índices de leitura (esperado 5)', count(*)::text
from pg_indexes
where schemaname = 'public'
  and indexname in ('idx_jobs_sector_active','idx_jobs_last_seen','idx_job_skills_skill',
                    'idx_job_snapshots_job_recorded','idx_scrape_runs_sector_started');
