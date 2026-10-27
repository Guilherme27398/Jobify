-- Período a que o salário publicado se refere: 'month' (mensal) ou 'year' (anual).
-- Sem período, o valor não é comparável e fica de fora das estatísticas salariais.
alter table job_snapshots
  add column if not exists salary_period text
    check (salary_period in ('month', 'year'));
