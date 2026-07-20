-- Jobify — verificação da escrita do scraper (jobs, skills, snapshots, runs)
-- Correr no SQL Editor do Supabase depois de o scraper ter corrido. Só lê.

-- Vagas com o setor, empresa, nº de skills e nº de snapshots
select j.external_id, j.title, s.slug as setor, c.name as empresa,
       count(distinct js.skill_id) as n_skills,
       count(distinct snap.id) as n_snapshots,
       j.is_active
from jobs j
join sectors s on s.id = j.sector_id
left join companies c on c.id = j.company_id
left join job_skills js on js.job_id = j.id
left join job_snapshots snap on snap.job_id = j.id
group by j.id, j.external_id, j.title, s.slug, c.name, j.is_active
order by j.first_seen_at;

-- Execuções registadas
select source, query_used, status, jobs_found, jobs_new, started_at, finished_at
from scrape_runs
order by started_at;
