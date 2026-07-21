-- Jobify — correção 2 ao schema (2026-07-20)
-- companies.name único, necessário para o upsert (get-or-create) de empresas
-- no scraper. Idempotente.

do $$
begin
  alter table companies add constraint companies_name_key unique (name);
exception
  when duplicate_object then null;  -- constraint já existe
end $$;
