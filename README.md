# Jobify

Agregador de vagas de emprego multi-setor. O Jobify faz scraping de vagas (principalmente LinkedIn), guarda os dados numa base de dados partilhada e serve-os através de uma API REST e de um dashboard interativo com filtros por setor, skill, localização, senioridade e tipo de contrato.

## Propósito

A maioria dos agregadores de vagas com filtros úteis é pensada para tecnologia. O Jobify generaliza essa experiência a qualquer setor: um advogado escolhe o setor "Advocacia" e filtra por área de prática, tal como um programador escolhe "Tecnologia" e filtra por linguagem ou framework. Os filtros disponíveis para cada setor são derivados dinamicamente dos dados reais recolhidos, pelo que nunca ficam vazios nem desatualizados.

Além da pesquisa, o dashboard apresenta análises construídas sobre o histórico recolhido: vagas por setor, evolução salarial ao longo do tempo e distribuição geográfica.

A v1 foca-se em vagas em Portugal (PT/EN, salários em EUR).

## Arquitetura

O projeto é propositadamente poliglota e está dividido em três componentes independentes. Não comunicam diretamente entre si — o único ponto de contacto é a base de dados partilhada (Supabase/Postgres):

```
┌──────────────┐        ┌──────────────────┐        ┌───────────┐        ┌──────────┐
│   LinkedIn   │──────▶ │  Scraper (Python) │──────▶│ Supabase  │◀───────│   API    │◀──── Frontend
│  (+ outras   │ scrape │ Playwright/Pandas │ write │ Postgres  │  read  │ (Spring  │      (React)
│   fontes)    │        │  execução cron    │       │           │        │  Boot)   │
└──────────────┘        └──────────────────┘        └───────────┘        └──────────┘
```

### 1. Scraper — Python

- **Playwright** para scraping do LinkedIn (e futuramente outras fontes)
- **Pandas** para limpeza e normalização (duplicados, campos em falta, salários)
- Corre periodicamente (cron ou Celery + Redis); não expõe API
- Grava diretamente no Supabase e regista cada execução em `scrape_runs`

### 2. API — Java / Spring Boot

- Único componente que fala com o frontend
- **Spring Web** para os endpoints REST, **Spring Data JPA** para acesso ao Postgres, **Flyway** para migrações do schema
- Lê os dados que o scraper gravou e expõe endpoints REST, por exemplo:
  - `GET /sectors` — setores disponíveis
  - `GET /sectors/:slug/filters` — filtros reais existentes para o setor (skills, senioridades, tipos de contrato)
  - `GET /jobs` — pesquisa de vagas com filtros
  - `GET /stats/:sector` — estatísticas para o dashboard
- Não sabe nada sobre o scraper nem comunica com ele

### 3. Frontend — React

- Consome exclusivamente a API Spring Boot
- Formulário de pesquisa com filtros dependentes do setor escolhido
- Dashboard com gráficos (Recharts ou Chart.js): vagas por setor, evolução salarial, distribuição geográfica

## Base de dados (Postgres via Supabase)

Tabelas principais:

| Tabela | O que guarda |
|---|---|
| `sectors` | Setores de atividade (tecnologia, advocacia, saúde, …) |
| `companies` | Empresas que publicam vagas |
| `jobs` | Dados estáveis da vaga (título, empresa, setor, URL, fonte) |
| `skills` | Competências genéricas com `skill_type` (technical, legal, language, certification, soft_skill) |
| `job_skills` | Relação muitos-para-muitos entre vagas e skills |
| `job_snapshots` | Dados que mudam entre scrapes (salário, senioridade, contrato, remoto) — histórico, não sobrescreve |
| `scrape_runs` | Registo de cada execução do scraper (fonte, setor-alvo, estado, nº de vagas) |
| `users` / `saved_searches` | Pesquisas guardadas e alertas (funcionalidade futura, fora da v1) |

Decisões de desenho relevantes:

- **`jobs` vs `job_snapshots`**: o que é estável fica em `jobs`; o que varia entre execuções fica em `job_snapshots`, em modo append-only, para permitir gráficos de evolução ao longo do tempo.
- **Classificação de setor** feita a partir da query de pesquisa usada no scraping — mais simples e fiável do que analisar o texto da vaga. Cada vaga pertence a exatamente um setor (o da primeira vez que foi vista); a unicidade é garantida por `(source, external_id)`.
- **Salários em falta**: não se estimam valores. Os gráficos de evolução salarial usam apenas vagas com salário publicado e indicam a percentagem de cobertura.
- **Dicionário de queries**: ficheiro `queries.yml` versionado no scraper, com a estrutura `setor → queries de pesquisa → skills esperadas`. Alterar queries passa por commit + redeploy do scraper.
- **Autenticação**: fora da v1. Pesquisa e dashboard são públicos e read-only; as tabelas `users`/`saved_searches` ficam no schema, por usar, até existirem pesquisas guardadas/alertas.
- **Vagas inativas**: uma vaga não vista em 3 execuções consecutivas bem-sucedidas do scraper para o seu setor é marcada como inativa; se reaparecer, é reativada. A API exclui inativas por omissão.

## Stack

| Componente | Tecnologias |
|---|---|
| Scraper | Python, Playwright, Pandas |
| Agendamento | cron ou Celery + Redis |
| API | Java 21, Spring Boot 3 (Spring Web, Spring Data JPA, Flyway) |
| Frontend | React, Recharts ou Chart.js |
| Base de dados | PostgreSQL (Supabase) |

## Deploy previsto

| Componente | Plataforma |
|---|---|
| API | Render (Docker; heap da JVM limitado via `-Xmx` no plano gratuito) |
| Frontend | Vercel |
| Base de dados | Supabase |

## Estado do projeto

Em fase de desenho. O schema da base de dados está definido; o desenvolvimento dos três componentes ainda não começou.
