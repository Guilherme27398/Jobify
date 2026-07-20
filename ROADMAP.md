# Roadmap — do desenho ao Jobify a funcionar

Passos para pôr o projeto de pé, pela ordem em que devem ser executados. Cada fase termina com um critério de "feito" verificável — não avançar para a fase seguinte sem o cumprir.

A ordem segue o fluxo dos dados: primeiro a base de dados (o ponto de contacto entre tudo), depois o scraper (quem escreve), depois a API (quem lê), por fim o frontend (quem mostra). Assim cada componente é desenvolvido contra dados reais, nunca contra dados inventados.

---

## Fase 0 — Fechar decisões em aberto ✅ (2026-07-20)

- [x] **Dicionário de queries por setor** — ficheiro `queries.yml` versionado no scraper, com `setor → queries de pesquisa → skills esperadas`. É o que alimenta a classificação de setor.
- [x] **Autenticação na v1** — fora da v1; as tabelas `users`/`saved_searches` ficam no schema, por usar.
- [x] **Vagas inativas** — vaga não vista em 3 execuções consecutivas bem-sucedidas do scraper para o seu setor → `inactive`; se reaparecer, reativa. A API exclui inativas por omissão.

**Feito quando:** as três decisões estão registadas no README. ✅

## Fase 1 — Base de dados (Supabase)

- [x] Criar o projeto no [Supabase](https://supabase.com) (região europeia)
- [x] Schema aplicado na BD (schema pré-existente do utilizador + `db/fixes.sql` com dedup, `consecutive_misses`, `district`, RLS). `db/schema.sql` é a fotografia fiel da BD e a futura baseline do Flyway
- [x] Criar os índices de leitura (bloco "Índices" do `db/schema.sql`)
- [x] Aplicar `db/seed.sql`: 3 setores (tecnologia, advocacia, saúde) e as 18 skills iniciais da taxonomia
- [x] Verificação completa da BD com `db/tests/verificacao_fase1.sql` — tudo OK em 2026-07-20
- [ ] Guardar as credenciais no `.env` (a partir do `.env.example`): connection string do **session pooler** (porta 5432; funciona em IPv4, serve o scraper e a API via JDBC) — **não** usar o transaction pooler (porta 6543) com JDBC. Password antiga foi exposta → fazer reset no Supabase antes

**Feito quando:** consegues ligar-te à BD com um cliente SQL e as tabelas e seeds estão lá.

## Fase 2 — Scraper (Python)

- [ ] Criar `scraper/` com ambiente próprio (`uv` ou `venv` + `requirements.txt`): Playwright, Pandas, driver Postgres (`psycopg`)
- [ ] Implementar o dicionário de queries por setor (decisão da Fase 0)
- [ ] Scraping do LinkedIn com Playwright: dada uma query, extrair título, empresa, localização, URL, `external_id`, texto da vaga
- [ ] Normalização com Pandas: duplicados por `(source, external_id)`, campos em falta, parsing de salários (EUR), extração de skills contra a taxonomia do setor
- [ ] Escrita no Supabase: upsert de `companies` e `jobs` (setor = setor da query, só na primeira vez), append em `job_snapshots`, registo em `scrape_runs`
- [ ] Marcar vagas inativas segundo a regra da Fase 0
- [ ] Execução agendada: começar com um simples cron/Task Scheduler a chamar `python -m scraper`; Celery + Redis só se vier a ser preciso

**Feito quando:** duas execuções seguidas do scraper produzem vagas reais na BD, sem duplicados, com dois snapshots por vaga e duas linhas em `scrape_runs`.

## Fase 3 — API (Java / Spring Boot)

- [ ] Gerar o projeto em `api/` com [start.spring.io](https://start.spring.io): Java 21, Maven, dependências Spring Web, Spring Data JPA, Flyway, driver PostgreSQL
- [ ] Configurar a ligação ao Supabase (`application.yml` com variáveis de ambiente; nunca credenciais no código)
- [ ] Migração Flyway `V1__baseline.sql` com o schema existente, para as migrações futuras ficarem versionadas
- [ ] Entidades JPA + repositories para as tabelas de leitura (`sectors`, `jobs`, `skills`, `job_snapshots`, …)
- [ ] Endpoints, com DTOs próprios (nunca expor entidades):
  - [ ] `GET /sectors`
  - [ ] `GET /sectors/:slug/filters` — filtros derivados dos dados reais (skills, senioridades, tipos de contrato existentes)
  - [ ] `GET /jobs` — filtros combináveis via JPA Specifications, paginação, inativas excluídas por omissão
  - [ ] `GET /stats/:sector` — vagas ao longo do tempo, evolução salarial (só vagas com salário + % de cobertura), distribuição geográfica
- [ ] CORS configurado para o domínio do frontend
- [ ] Testes de integração dos endpoints (Testcontainers com Postgres)

**Feito quando:** com a BD populada pelo scraper, os quatro endpoints respondem corretamente e os testes passam.

## Fase 4 — Frontend (React)

- [ ] Criar `frontend/` com Vite + React + TypeScript
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
