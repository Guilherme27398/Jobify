# Roadmap — do desenho ao Jobify a funcionar

Passos para pôr o projeto de pé, pela ordem em que devem ser executados. Cada fase termina com um critério de "feito" verificável — não avançar para a fase seguinte sem o cumprir.

A ordem segue o fluxo dos dados: primeiro a base de dados (o ponto de contacto entre tudo), depois o scraper (quem escreve), depois a API (quem lê), por fim o frontend (quem mostra). Assim cada componente é desenvolvido contra dados reais, nunca contra dados inventados.

---

## Fase 0 — Fechar decisões em aberto ✅ (2026-07-20)

- [x] **Dicionário de queries por setor** — ficheiro `queries.yml` versionado no scraper, com `setor → queries de pesquisa → skills esperadas`. É o que alimenta a classificação de setor.
- [x] **Autenticação na v1** — fora da v1; as tabelas `users`/`saved_searches` ficam no schema, por usar.
- [x] **Vagas inativas** — vaga não vista em 3 execuções consecutivas bem-sucedidas do scraper para o seu setor → `inactive`; se reaparecer, reativa. A API exclui inativas por omissão.

**Feito quando:** as três decisões estão registadas no README. ✅

## Fase 1 — Base de dados (Supabase) ✅ (2026-07-20)

- [x] Criar o projeto no [Supabase](https://supabase.com) (região europeia)
- [x] Schema aplicado na BD (schema pré-existente do utilizador + `db/fixes.sql` com dedup, `consecutive_misses`, `district`, RLS). `db/schema.sql` é a fotografia fiel da BD e a futura baseline do Flyway
- [x] Criar os índices de leitura (bloco "Índices" do `db/schema.sql`)
- [x] Aplicar `db/seed.sql`: 3 setores (tecnologia, advocacia, saúde) e as 18 skills iniciais da taxonomia
- [x] Verificação completa da BD com `db/tests/verificacao_fase1.sql` — tudo OK em 2026-07-20
- [x] Credenciais no `.env` da raiz (`DATABASE_URL`). Nota: em uso a ligação direta (funciona localmente via IPv6); no deploy da API/scraper usar o **session pooler** (porta 5432) — **não** usar o transaction pooler (porta 6543) com JDBC

**Feito quando:** consegues ligar-te à BD com um cliente SQL e as tabelas e seeds estão lá. ✅ (`scraper/check_db.py` liga e vê 3 setores + 18 skills)

## Fase 2 — Scraper (Python) ✅ (2026-07-20)

- [x] Criar `scraper/` com ambiente próprio — venv Python 3.11 em `scraper/.venv`, `requirements.txt` com versões fixas (playwright 1.61, pandas 3.0, psycopg 3.3, python-dotenv, pyyaml), Chromium do Playwright instalado; `scraper/check_db.py` verifica a ligação à BD
- [x] Implementar o dicionário de queries por setor — `scraper/queries.yml` (13 queries nos 3 setores, skills com aliases para matching, `common_skills` transversais) + `scraper/queries.py` (loader que valida a estrutura e cruza slugs/skills/types com a BD)
- [x] Scraping do LinkedIn com Playwright — `scraper/linkedin.py`: listagem pública guest (paginada, sem login) + página de cada vaga; extrai external_id, título, empresa, localização, URL, descrição e senioridade/contrato em bruto; pausas aleatórias entre pedidos e tolerância à authwall. Testado com vagas reais em 2026-07-20
- [x] Normalização com Pandas — `scraper/normalize.py`: dedup por (source, external_id), descarte de linhas sem campos obrigatórios, mapeamento de rótulos PT/EN do LinkedIn para os enums da BD (seniority/contract/remote), distrito a partir da localização, parsing best-effort de salários em EUR e extração de skills (com `\b` para evitar falsos positivos) contra a taxonomia do setor. Validado em `--demo` em 2026-07-20
- [x] Escrita no Supabase — `scraper/db.py` (DbWriter): upsert de companies (por nome, via `db/fixes_2.sql`) e jobs (por source+external_id, sector só na 1ª vez, reaparecer repõe is_active/consecutive_misses), append em job_snapshots, job_skills e ciclo start/finish em scrape_runs. Upsert provado com `scraper/verify_upsert.py` (jobs estáveis, new=0, snapshot +1, setor inalterado); verificação SQL em `db/tests/verificacao_escrita.sql`
- [x] Marcar vagas inativas segundo a regra da Fase 0 — `DbWriter.mark_inactive`: incrementa `consecutive_misses` das vagas ativas do setor não vistas na passagem; ao atingir 3 → `is_active=false`; reaparecer reativa. Só corre se a passagem pelo setor trouxe vagas (não desativa tudo num bloqueio). Provado com `scraper/verify_inactive.py`
- [x] Execução agendada — orquestrador `scraper/run.py` + `python -m scraper` (`__main__.py`/`__init__.py`): percorre o `queries.yml`, uma `scrape_run` por query, marcação de inativas por setor no fim. Testado com `python -m scraper --sectors saude` (9 vagas reais escritas). Falta só agendar em produção (Task Scheduler local ou cron/GitHub Actions) → Fase 5

**Feito quando:** duas execuções seguidas do scraper produzem vagas reais na BD, sem duplicados, com dois snapshots por vaga e duas linhas em `scrape_runs`. ✅ (upsert e histórico de snapshots provados por `verify_upsert.py`; BD com 15 vagas reais em 3 execuções)

## Fase 3 — API (Java / Spring Boot)

- [x] Gerar o projeto em `api/` com [start.spring.io](https://start.spring.io): Java 21, Maven, dependências Spring Web, Spring Data JPA, Flyway, driver PostgreSQL
- [x] Configurar a ligação ao Supabase (`application.yml` com variáveis de ambiente; nunca credenciais no código)
- [x] Migração Flyway `V1__baseline.sql` com o schema existente, para as migrações futuras ficarem versionadas
- [x] Entidades JPA + repositories para as tabelas de leitura (`sectors`, `jobs`, `skills`, `job_snapshots`, …)
- [x] Endpoints, com DTOs próprios (nunca expor entidades):
  - [x] `GET /sectors`
  - [x] `GET /sectors/:slug/filters` — filtros derivados dos dados reais (skills, senioridades, tipos de contrato existentes)
  - [x] `GET /jobs` — filtros combináveis via JPA Specifications, paginação, inativas excluídas por omissão
  - [x] `GET /stats/:sector` — vagas ao longo do tempo, evolução salarial (só vagas com salário + % de cobertura), distribuição geográfica
- [x] CORS configurado para o domínio do frontend
- [x] Testes de integração dos endpoints (Testcontainers com Postgres)

**Feito quando:** com a BD populada pelo scraper, os quatro endpoints respondem corretamente e os testes passam.

## Fase 4 — Frontend (React)

- [x] Criar `frontend/` com Vite + React + TypeScript
- [ ] Página de pesquisa: seletor de setor → carrega os filtros de `GET /sectors/:slug/filters` → lista de vagas de `GET /jobs` com paginação
- [ ] Dashboard com Recharts: vagas por setor, evolução salarial (com a nota de % de cobertura), distribuição geográfica
- [ ] Estados de loading/erro/vazio em todas as chamadas à API

**Feito quando:** o fluxo completo funciona localmente — escolher setor, filtrar, ver vagas e gráficos com dados reais.

## Fase 5 — Deploy

- [ ] BD já está no Supabase (nada a fazer)
- [ ] API no Render via Dockerfile (build multi-stage; limitar heap com `-Xmx` para caber nos 512 MB do plano gratuito)
- [ ] Frontend no Vercel, com a URL da API em variável de ambiente
- [ ] Scraper: agendar num serviço com cron (ex.: cron job do Render ou GitHub Actions com `schedule`)
- [ ] Verificação ponta-a-ponta em produção: o scraper corre, a API serve, o frontend mostra

**Feito quando:** o Jobify está acessível publicamente e atualiza-se sozinho.

## Fase 6 — Polimento de portfólio

- [ ] README com screenshots do dashboard e link para a versão em produção
- [ ] Documentação da API (springdoc-openapi → Swagger UI)
- [ ] CI no GitHub Actions: testes da API e lint do scraper em cada push
