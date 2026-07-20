-- Jobify — seeds mínimos da v1
-- Aplicar no SQL Editor do Supabase depois do schema.sql.
-- Idempotente: pode correr mais do que uma vez sem duplicar.

insert into sectors (slug, name) values
  ('tecnologia', 'Tecnologia'),
  ('advocacia',  'Advocacia'),
  ('saude',      'Saúde')
on conflict (slug) do nothing;

-- Taxonomia inicial de skills — tem de bater certo com as expected_skills do queries.yml do scraper.
insert into skills (name, skill_type) values
  -- tecnologia
  ('Java',            'technical'),
  ('Spring Boot',     'technical'),
  ('Python',          'technical'),
  ('TypeScript',      'technical'),
  ('React',           'technical'),
  ('SQL',             'technical'),
  ('Docker',          'technical'),
  ('AWS',             'technical'),
  -- advocacia
  ('Direito Laboral',   'legal'),
  ('Direito Fiscal',    'legal'),
  ('Direito Comercial', 'legal'),
  ('Contencioso',       'legal'),
  -- saúde
  ('Enfermagem Geral',    'certification'),
  ('Cuidados Intensivos', 'technical'),
  ('Geriatria',           'technical'),
  -- transversais
  ('Inglês',             'language'),
  ('Comunicação',        'soft_skill'),
  ('Trabalho em Equipa', 'soft_skill')
on conflict (name) do nothing;
