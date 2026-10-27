-- Setores
INSERT INTO sectors (id, name, slug) VALUES
    ('11111111-0000-0000-0000-000000000001', 'Tecnologia', 'tecnologia'),
    ('11111111-0000-0000-0000-000000000002', 'Advocacia',  'advocacia');

-- Empresa
INSERT INTO companies (id, name) VALUES
    ('22222222-0000-0000-0000-000000000001', 'Acme Corp');

-- Skills
INSERT INTO skills (id, name, skill_type) VALUES
    ('33333333-0000-0000-0000-000000000001', 'Java',   'technical'),
    ('33333333-0000-0000-0000-000000000002', 'Python', 'technical');

-- Vaga ativa em tecnologia (Lisboa)
INSERT INTO jobs (id, company_id, sector_id, external_id, source, title, url, district, is_active, consecutive_misses)
VALUES ('44444444-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000001',
        'ext-001', 'linkedin', 'Java Developer', 'https://example.com/1', 'Lisboa', true, 0);

-- Vaga inativa em tecnologia
INSERT INTO jobs (id, company_id, sector_id, external_id, source, title, url, is_active, consecutive_misses)
VALUES ('44444444-0000-0000-0000-000000000002',
        '22222222-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000001',
        'ext-002', 'linkedin', 'Python Dev (inactive)', 'https://example.com/2', false, 3);

-- Vaga ativa em advocacia (Porto)
INSERT INTO jobs (id, company_id, sector_id, external_id, source, title, url, district, is_active, consecutive_misses)
VALUES ('44444444-0000-0000-0000-000000000003',
        '22222222-0000-0000-0000-000000000001',
        '11111111-0000-0000-0000-000000000002',
        'ext-003', 'linkedin', 'Advogado Sénior', 'https://example.com/3', 'Porto', true, 0);

-- Skills da vaga ativa de tecnologia
INSERT INTO job_skills (job_id, skill_id)
VALUES ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001');

-- Snapshots da vaga ativa de tecnologia:
-- Mês anterior com salário
INSERT INTO job_snapshots (id, job_id, seniority, contract_type, remote_type, salary_min, salary_max, recorded_at)
VALUES ('55555555-0000-0000-0000-000000000001',
        '44444444-0000-0000-0000-000000000001',
        'senior', 'full_time', 'hybrid', 3000, 4500,
        date_trunc('month', now()) - interval '1 month');

-- Mês atual sem salário
INSERT INTO job_snapshots (id, job_id, seniority, contract_type, remote_type, salary_min, salary_max, recorded_at)
VALUES ('55555555-0000-0000-0000-000000000002',
        '44444444-0000-0000-0000-000000000001',
        'senior', 'full_time', 'hybrid', null, null,
        date_trunc('month', now()));
