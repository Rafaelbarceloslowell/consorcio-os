# HANDOFF técnico — GorillaOS

> Gerado por auditoria automatizada do repositório em **quarta-feira, 5 de agosto de 2026 às 10:59:25 BRT**. O documento distingue fatos observados de inferências. Quando o repositório não permite concluir algo com segurança, está escrito **“não sei”**.

## Contexto da auditoria

- Raiz analisada: `.`
- Git top-level: `C:/Projetos/consorcio-os`
- Branch: `feature/lead-approach-and-seals`
- Commit HEAD: `7ee2270bb8f29f1e2d3c9c29a85cca2a0d61db9b`
- Arquivos analisados: **1896**
- Arquivos-fonte: **538**
- Arquivos de teste: **176**
- Working tree antes da geração: **22 entrada(s)**. Use `git status --short` para conferir o estado final.

## 1. O que é o app

### Problema, público e plataforma

O repositório implementa uma **aplicação web de operação comercial de consórcios**, com cadastro e evolução de leads/oportunidades, atividades comerciais e apoio do R2. O usuário final aparente é o consultor comercial; gestores e diretoria também aparecem como perfis prováveis. Sem o app, o processo tende a ficar distribuído entre planilhas, WhatsApp e sistemas externos. Essa última frase é uma inferência de produto e deve ser validada com a diretoria.

A plataforma é **web** porque há estrutura do Next.js em `app/acesso-negado/page.tsx` e dependências React/Next em `package.json`. Não foi encontrada evidência suficiente de aplicativo mobile ou desktop nativo.

### Fluxo principal observado

1. O usuário entra/autentica-se pela camada em `app/api/auth/[...all]/route.test.ts`.
2. A aplicação apresenta o dashboard ou shell principal em `application/dashboard/build-gorilar2-briefing.test.ts`.
3. O consultor cadastra, consulta ou trabalha leads por módulos como `app/leads/new/actions.test.ts`.
4. O lead evolui para oportunidade e passa pelo fluxo comercial em `app/opportunities/[opportunityId]/edit/actions.test.ts`.
5. O sistema registra ou agenda reunião por código relacionado em `application/meeting/schedule-meeting.test.ts`.
6. O consultor prepara/envia/aceita proposta por código relacionado em `app/proposals/actions.ts`.
7. A oportunidade pode ser fechada como venda por código relacionado em `application/sale/close-sale.test.ts`.
8. Automações e/ou o R2 calculam ações e apoio ao consultor; pontos representativos: `application/decision/run-decision-automation-pipeline.test.ts` e `app/api/r2/actions/[actionId]/complete/route.test.ts`.

### O que já está pronto e funcionando

- **Build:** Aprovado nesta auditoria com `npm run build`.
- **Testes:** Falhou nesta auditoria com `npm run test -- --run` (código 1). Ver saída resumida nesta seção.
- **Autenticação:** há 12 arquivo(s) de implementação; referência: `app/api/auth/[...all]/route.test.ts`; 3 arquivo(s) de teste relacionado(s). A presença de arquivos/testes não prova validação em produção.
- **Leads:** há 21 arquivo(s) de implementação; referência: `app/leads/new/actions.test.ts`; 14 arquivo(s) de teste relacionado(s). A presença de arquivos/testes não prova validação em produção.
- **Oportunidades:** há 108 arquivo(s) de implementação; referência: `app/opportunities/[opportunityId]/edit/actions.test.ts`; 34 arquivo(s) de teste relacionado(s). A presença de arquivos/testes não prova validação em produção.
- **Automações:** há 11 arquivo(s) de implementação; referência: `application/decision/run-decision-automation-pipeline.test.ts`; 8 arquivo(s) de teste relacionado(s). A presença de arquivos/testes não prova validação em produção.
- **R2:** há 232 arquivo(s) de implementação; referência: `app/api/r2/actions/[actionId]/complete/route.test.ts`; 16 arquivo(s) de teste relacionado(s). A presença de arquivos/testes não prova validação em produção.
- **WhatsApp manual:** há 3 arquivo(s) de implementação; referência: `application/opportunity/analyze-manual-whatsapp-message.test.ts`; 4 arquivo(s) de teste relacionado(s). A presença de arquivos/testes não prova validação em produção.

### O que está pela metade

- Existem **126** marcadores explícitos de TODO/FIXME/HACK/temporário. A lista completa está na seção 5.
- Há código relacionado a WhatsApp em `application/opportunity/analyze-manual-whatsapp-message.test.ts`, mas o nível real de integração, homologação e uso em produção é **não sei**.

### O que ainda nem começou

- **Dockerização:** não há Dockerfile, compose ou `.dockerignore` detectado; portanto a execução Docker pedida neste handoff ainda não está implementada.
- Integração Maestro: nenhum arquivo com sinal claro de `maestro` foi localizado; pode não ter começado ou usar outro nome. **não sei**.
- Integração Data Crazy: nenhum arquivo com sinal claro foi localizado; pode não ter começado ou usar outro nome. **não sei**.
- Demais funcionalidades não iniciadas: **não sei**; confirmar com a diretoria e o backlog.

## 2. Stack e arquitetura

### Linguagens, frameworks e versões

- Pacote: `web`; versão: `0.1.0`.
- Next.js 16.2.10
- React 19.2.4
- TypeScript ^5
- Tailwind CSS ^4
- Vitest ^4.1.10
- Prisma CLI ^7.9.0
- Prisma Client ^7.9.0
- Better Auth 1.6.25
- Lockfile: `package-lock.json`.

#### Scripts do package.json

- `npm run brand:build` → `node --experimental-strip-types ../brand/scripts/build-brand.ts`
- `npm run dev` → `next dev`
- `npm run build` → `next build`
- `npm run start` → `next start`
- `npm run lint` → `eslint`
- `npm run prisma:generate` → `prisma generate`
- `npm run prisma:seed` → `npm run prisma:generate && prisma db seed`
- `npm run test` → `vitest`
- `npm run test:watch` → `vitest`
- `npm run test:run` → `vitest run`
- `npm run test:coverage` → `vitest run --coverage`

### Banco de dados

- Prisma com provider `prisma-client`; schema em `prisma/schema.prisma`.
- Driver PostgreSQL detectado nas dependências.
- A localização física do banco depende de `DATABASE_URL` ou da configuração equivalente. Valores não foram copiados para este documento.

### Serviços externos e APIs

- Google OAuth/autenticação: conferir `app/api/auth/[...all]/route.test.ts` e as variáveis `GOOGLE_*`/`*AUTH*`.
- WhatsApp/Meta: conferir `application/opportunity/analyze-manual-whatsapp-message.test.ts` e as variáveis `WHATSAPP_*`/`META_*`.

### Organização das pastas principais

- `.agents` — Finalidade não identificada automaticamente; **não sei**. Inspecionar os arquivos internos.
- `.claude` — Finalidade não identificada automaticamente; **não sei**. Inspecionar os arquivos internos.
- `.windsurf` — Finalidade não identificada automaticamente; **não sei**. Inspecionar os arquivos internos.
- `app` — Rotas, páginas, layouts e Route Handlers do Next.js App Router.
- `application` — Casos de uso e orquestração da aplicação, quando presentes.
- `blender` — Fontes e ferramentas relacionadas ao personagem 3D R2.
- `components` — Componentes React e composição da interface.
- `data` — Finalidade não identificada automaticamente; **não sei**. Inspecionar os arquivos internos.
- `design-system` — Finalidade não identificada automaticamente; **não sei**. Inspecionar os arquivos internos.
- `docs` — Documentação técnica e funcional.
- `engine` — Finalidade não identificada automaticamente; **não sei**. Inspecionar os arquivos internos.
- `infrastructure` — Implementações de persistência, filas e serviços externos, quando presentes.
- `lib` — Infraestrutura compartilhada, autenticação, acesso a dados, utilitários e integrações.
- `prisma` — Schema Prisma, migrations e seed do banco.
- `public` — Arquivos estáticos servidos pelo Next.js.
- `repositories` — Finalidade não identificada automaticamente; **não sei**. Inspecionar os arquivos internos.
- `types` — Tipos TypeScript compartilhados.

### Rotas web e API detectadas

#### Páginas

- `/acesso-negado` → `app/acesso-negado/page.tsx`
- `/agenda/new` → `app/agenda/new/page.tsx`
- `/agenda` → `app/agenda/page.tsx`
- `/cadastro` → `app/cadastro/page.tsx`
- `/clients/[clientId]/edit` → `app/clients/[clientId]/edit/page.tsx`
- `/clients/[clientId]` → `app/clients/[clientId]/page.tsx`
- `/clients/new` → `app/clients/new/page.tsx`
- `/clients` → `app/clients/page.tsx`
- `/decision-debug` → `app/decision-debug/page.tsx`
- `/finance` → `app/finance/page.tsx`
- `/leads/new` → `app/leads/new/page.tsx`
- `/leads` → `app/leads/page.tsx`
- `/login` → `app/login/page.tsx`
- `/opportunities/[opportunityId]/edit` → `app/opportunities/[opportunityId]/edit/page.tsx`
- `/opportunities/[opportunityId]` → `app/opportunities/[opportunityId]/page.tsx`
- `/opportunities/new` → `app/opportunities/new/page.tsx`
- `/` → `app/page.tsx`
- `/proposals/new` → `app/proposals/new/page.tsx`
- `/proposals` → `app/proposals/page.tsx`
- `/r2-test` → `app/r2-test/page.tsx`
- `/settings` → `app/settings/page.tsx`
- `/ui-kit` → `app/ui-kit/page.tsx`

#### Route Handlers

- `GET, POST /api/auth/[...all]` → `app/api/auth/[...all]/route.ts`
- `POST /api/r2/actions/[actionId]/complete` → `app/api/r2/actions/[actionId]/complete/route.ts`
- `GET /api/r2/commercial-events` → `app/api/r2/commercial-events/route.ts`
- `POST /api/r2/recommendations/[recommendationId]/decision` → `app/api/r2/recommendations/[recommendationId]/decision/route.ts`
- `GET /api/search` → `app/api/search/route.ts`

### Diagrama textual do fluxo de dados

```text
Navegador / usuário
  -> página e componentes React em app/** e components/**
  -> Server Component, Server Action ou Route Handler em app/api/**/route.ts
  -> validação/orquestração em lib/**, application/** ou módulos equivalentes
  -> regras de domínio em domain/** ou módulos de negócio equivalentes
  -> persistência via Prisma/driver de banco e/ou chamadas a APIs externas
  -> resposta JSON/HTML
  -> React atualiza a interface
```

Os nomes intermediários acima refletem a estrutura detectada; onde uma pasta não existir, o fluxo passa diretamente pela camada disponível.

## 3. Como rodar localmente (Docker)

### Arquivos Docker

- **Nenhum arquivo Docker foi encontrado.** Hoje não existe um procedimento Docker comprovado para este repositório.

### Serviços do docker-compose

- Nenhum serviço Compose pôde ser listado.

### Comando exato para subir do zero

**Não existe comando Docker válido hoje**, pois nenhum arquivo Compose foi localizado.

### Migrations e seed

- Migration declarada: `npm run prisma:generate` → `prisma generate`.
- Seed declarado: `npm run prisma:seed` → `npm run prisma:generate && prisma db seed`.

### Acesso ao app

- Execução sem Docker: `npm run dev` → `next dev`.
- URL típica do Next.js: `http://localhost:3000`. A porta deve ser validada no script, nas variáveis e no Compose.

### Logs, shell e testes no container

- Não aplicável enquanto não houver Compose.

### Variáveis de ambiente

O arquivo de exemplo é `.env.example`. Ele contém nomes e comentários, sem valores.

| Variável | Finalidade | Serviço/camada | Ocorrências |
|---|---|---|---|
| `BETTER_AUTH_SECRET` | Segredo criptográfico da autenticação. | servidor web / rotas de API | `.env.example:6`<br>`app/api/auth/[...all]/route.test.ts:22` |
| `BETTER_AUTH_URL` | URL base pública usada pelo sistema de autenticação. | servidor web / rotas de API | `.env.example:9`<br>`app/api/auth/[...all]/route.test.ts:23` |
| `DATABASE_URL` | String de conexão principal com o banco de dados. | banco de dados / migrations | `.env.example:12`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/client.ts:32`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:71`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:95`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:2792`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/client.ts:32`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:71`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:95` |
| `GOOGLE_CLIENT_ID` | Identificador OAuth do Google. | servidor web / rotas de API | `.env.example:15`<br>`app/api/auth/[...all]/route.test.ts:24` |
| `GOOGLE_CLIENT_SECRET` | Segredo OAuth do Google. | servidor web / rotas de API | `.env.example:18`<br>`app/api/auth/[...all]/route.test.ts:25` |
| `MAX_POSTPONE_MINUTES` | Variável de configuração usada pelo projeto; validar o uso no código citado no HANDOFF.md. | servidor web / rotas de API | `.env.example:21`<br>`app/api/r2/recommendations/[recommendationId]/decision/route.ts:116` |
| `MIN_POSTPONE_MINUTES` | Variável de configuração usada pelo projeto; validar o uso no código citado no HANDOFF.md. | servidor web / rotas de API | `.env.example:24`<br>`app/api/r2/recommendations/[recommendationId]/decision/route.ts:116` |
| `NEXT_PUBLIC_APP_URL` | URL de serviço externo ou URL base da aplicação. | aplicação Node.js | `.env.example:27`<br>`app/layout.tsx:21`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-transport-contract-discovery-v1/R2_OPPORTUNITY_TRANSPORT_CONTRACT_DISCOVERY_V1.txt:3029` |
| `NODE_ENV` | Ambiente de execução do Node.js. | banco de dados / migrations | `.env.example:30`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_RUNTIME_SOURCE_DIAGNOSTIC.txt:4021`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_RUNTIME_SOURCE_DIAGNOSTIC.txt:4046`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_RUNTIME_SOURCE_DIAGNOSTIC.txt:4070`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_RUNTIME_SOURCE_DIAGNOSTIC.txt:4087`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_TARGETED_SOURCE_DISCOVERY.txt:485`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_TARGETED_SOURCE_DISCOVERY.txt:580`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_TARGETED_SOURCE_DISCOVERY.txt:588` |
| `NOW` | Variável de configuração usada pelo projeto; validar o uso no código citado no HANDOFF.md. | aplicação Node.js | `.env.example:33`<br>`application/r2/r2-intelligence-orchestration.test.ts:116`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/R2_EVENT_TO_STATE_MAPPING_DISCOVERY_V1.txt:1535`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-atomic-event-target-discovery-v1/R2_OPPORTUNITY_ATOMIC_EVENT_TARGET_DISCOVERY_V1.txt:6064`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-created-atomic-contract-snapshot-v2/R2_OPPORTUNITY_CREATED_ATOMIC_CONTRACT_SNAPSHOT_V2.txt:5969` |
| `P` | Variável de configuração usada pelo projeto; validar o uso no código citado no HANDOFF.md. | aplicação Node.js | `.env.example:36`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:2891`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:2906`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:2916`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:2924`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts:1672`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts:1687`<br>`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts:1697` |
| `R2_APP_URL` | URL de serviço externo ou URL base da aplicação. | aplicação Node.js | `.env.example:39`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_BROWSER_RELEASE_GATE_FINAL_V1.before-neutral-fix.mjs:5`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_BROWSER_RELEASE_GATE_FINAL_V1.mjs:5` |
| `R2_CDP_PORT` | Porta de execução do serviço. | aplicação Node.js | `.env.example:42`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_BROWSER_RELEASE_GATE_FINAL_V1.before-neutral-fix.mjs:6`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_BROWSER_RELEASE_GATE_FINAL_V1.mjs:6` |
| `R2_GATE_DIR` | Variável de configuração usada pelo projeto; validar o uso no código citado no HANDOFF.md. | aplicação Node.js | `.env.example:45`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_BROWSER_RELEASE_GATE_FINAL_V1.before-neutral-fix.mjs:7`<br>`blender/r2-rig/r2-browser-compatible-validation-and-release-gate-v1/R2_BROWSER_RELEASE_GATE_FINAL_V1.mjs:7` |
| `WORKSPACE_SLUG` | Variável de configuração usada pelo projeto; validar o uso no código citado no HANDOFF.md. | aplicação Node.js | `.env.example:48`<br>`app/agenda/actions.ts:123`<br>`app/agenda/new/actions.ts:410`<br>`app/proposals/actions.ts:56`<br>`app/proposals/new/actions.ts:340` |

Não há Compose; dependência de `.env` por Docker não se aplica.

### Estado atual de build e passos manuais

- Build: Aprovado nesta auditoria com `npm run build`.
- Testes: Falhou nesta auditoria com `npm run test -- --run` (código 1). Ver saída resumida nesta seção.

Últimas linhas dos testes:

```text
[31m+   NEXT_BEST_ACTION @map("next_best_action")[39m
[31m+   AI               @map("ai")[39m
[31m+   SYSTEM           @map("system")[39m
[31m+[39m
[31m+   @@map("commercial_action_origin")[39m
[31m+ }[39m
[31m+[39m
[31m+ enum NextBestActionSource {[39m
[31m+   RULE_ENGINE @map("rule_engine")[39m
[31m+   AI          @map("ai")[39m
[31m+   SYSTEM      @map("system")[39m
[31m+   CONSULTANT  @map("consultant")[39m
[31m+[39m
[31m+   @@map("next_best_action_source")[39m
[31m+ }[39m
[31m+[39m
[31m+ enum NextBestActionPriority {[39m
[31m+   LOW    @map("low")[39m
[31m+   NORMAL @map("normal")[39m
[31m+   HIGH   @map("high")[39m
[31m+   URGENT @map("urgent")[39m
[31m+[39m
[31m+   @@map("next_best_action_priority")[39m
[31m+ }[39m
[31m+[39m

[36m [2m❯[22m lib/auth/auth-prisma-foundation.test.ts:[2m42:24[22m[39m
    [90m 40|[39m           [32m"consultantId  String"[39m[33m,[39m
    [90m 41|[39m         )
    [90m 42|[39m         [34mexpect[39m(schema)[33m.[39m[34mtoContain[39m(
    [90m   |[39m                        [31m^[39m
    [90m 43|[39m           [32m"authUsers         User[]"[39m[33m,[39m
    [90m 44|[39m         )

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/7]⎯[22m[39m

[41m[1m FAIL [22m[49m app/clients/[clientId]/page.test.tsx[2m > [22mClientDetailsPage[2m > [22mresolve workspace, compõe repositories scoped e renderiza detalhes
[31m[1mError[22m: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".[39m
[36m [2m❯[22m app/clients/[clientId]/page.test.tsx:[2m171:3[22m[39m
    [90m169|[39m   })
    [90m170|[39m
    [90m171|[39m   it("resolve workspace, compõe repositories scoped e renderiza detalh…
    [90m   |[39m   [31m^[39m
    [90m172|[39m     [34mrender[39m(
    [90m173|[39m       [35mawait[39m [33mClientDetailsPage[39m({

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/7]⎯[22m[39m


```

## 4. Modelo de dados

### Schema e migrations

- Schema: `prisma/schema.prisma`
- Migration: `prisma/migrations/20260723231155_init_consorcio_os`
- Migration: `prisma/migrations/20260726180000_support_client_originated_opportunities`
- Migration: `prisma/migrations/20260802220000_add_opportunity_created_commercial_event`
- Migration: `prisma/migrations/20260804170000_add_better_auth_google_foundation`
- Migration: `prisma/migrations/20260805123709_add_lead_approach_type`
- Migration: `prisma/migrations/migration_lock.toml`

### Entidades/tabelas, campos e relacionamentos

#### model `Workspace`

- Campo `id`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `slug`: tipo `String`.
- Campo `status`: tipo `WorkspaceStatus`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `clients`: tipo `Client[]`.
- Campo `commercialActions`: tipo `CommercialAction[]`.
- Campo `commercialEvents`: tipo `CommercialEvent[]`.
- Campo `commercialJourneys`: tipo `CommercialJourney[]`.
- Campo `consortiums`: tipo `Consortium[]`.
- Campo `consultants`: tipo `Consultant[]`.
- Campo `journeyPhases`: tipo `JourneyPhase[]`.
- Campo `journeyStates`: tipo `JourneyState[]`.
- Campo `leads`: tipo `Lead[]`.
- Campo `meetings`: tipo `Meeting[]`.
- Campo `nextBestActions`: tipo `NextBestAction[]`.
- Campo `pipelineStages`: tipo `PipelineStage[]`.
- Campo `proposals`: tipo `Proposal[]`.
- Campo `sales`: tipo `Sale[]`.
- Campo `tasks`: tipo `Task[]`.
- Campo `workflowRules`: tipo `WorkflowRule[]`.
- Campo `authUsers`: tipo `User[]`.
- Configuração de modelo: `@@index([status])`
- Configuração de modelo: `@@map("workspaces")`

#### model `Consultant`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `email`: tipo `String`.
- Campo `phone`: tipo `String`.
- Campo `document`: tipo `String`.
- Campo `role`: tipo `ConsultantRole`.
- Campo `team`: tipo `String`.
- Campo `region`: tipo `String`.
- Campo `avatarUrl`: tipo `String?`.
- Campo `status`: tipo `ConsultantStatus`.
- Campo `monthlySalesTarget`: tipo `Decimal`.
- Campo `monthlyLeadsTarget`: tipo `Int`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `clients`: tipo `Client[]`.
- Campo `commercialJourneys`: tipo `CommercialJourney[]`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `leads`: tipo `Lead[]`.
- Campo `meetings`: tipo `Meeting[]`.
- Campo `proposals`: tipo `Proposal[]`.
- Campo `sales`: tipo `Sale[]`.
- Campo `assignedTasks`: tipo `Task[]`.
- Campo `authUser`: tipo `User?`.
- Configuração de modelo: `@@unique([workspaceId, email], map: "consultants_workspace_email_key")`
- Configuração de modelo: `@@unique([workspaceId, document], map: "consultants_workspace_document_key")`
- Configuração de modelo: `@@index([workspaceId], map: "consultants_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "consultants_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, role], map: "consultants_workspace_role_idx")`
- Configuração de modelo: `@@map("consultants")`

#### model `Consortium`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `administrator`: tipo `String`.
- Campo `type`: tipo `ConsortiumType`.
- Campo `groupNumber`: tipo `String`.
- Campo `minCreditValue`: tipo `Decimal`.
- Campo `maxCreditValue`: tipo `Decimal`.
- Campo `defaultTermMonths`: tipo `Int`.
- Campo `administrationFeePercent`: tipo `Decimal`.
- Campo `reserveFundPercent`: tipo `Decimal`.
- Campo `totalQuotas`: tipo `Int`.
- Campo `availableQuotas`: tipo `Int`.
- Campo `status`: tipo `ConsortiumStatus`.
- Campo `description`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `proposals`: tipo `Proposal[]`.
- Campo `sales`: tipo `Sale[]`.
- Configuração de modelo: `@@unique([workspaceId, administrator, groupNumber], map: "consortiums_workspace_administrator_group_key")`
- Configuração de modelo: `@@index([workspaceId], map: "consortiums_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "consortiums_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, type], map: "consortiums_workspace_type_idx")`
- Configuração de modelo: `@@index([workspaceId, administrator], map: "consortiums_workspace_administrator_idx")`
- Configuração de modelo: `@@map("consortiums")`

#### model `PipelineStage`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `order`: tipo `Int`.
- Campo `type`: tipo `PipelineStageType`.
- Campo `color`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `winProbability`: tipo `Decimal`.
- Campo `isClosedStage`: tipo `Boolean`.
- Campo `isWonStage`: tipo `Boolean`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `leads`: tipo `Lead[]`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Configuração de modelo: `@@unique([workspaceId, type, order], map: "pipeline_stages_workspace_type_order_key")`
- Configuração de modelo: `@@index([workspaceId], map: "pipeline_stages_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, type], map: "pipeline_stages_workspace_type_idx")`
- Configuração de modelo: `@@index([workspaceId, isClosedStage], map: "pipeline_stages_workspace_closed_idx")`
- Configuração de modelo: `@@index([workspaceId, isWonStage], map: "pipeline_stages_workspace_won_idx")`
- Configuração de modelo: `@@map("pipeline_stages")`

#### model `Lead`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `email`: tipo `String`.
- Campo `phone`: tipo `String`.
- Campo `document`: tipo `String?`.
- Campo `companyName`: tipo `String?`.
- Campo `source`: tipo `LeadSource`.
- Campo `status`: tipo `LeadStatus`.
- Campo `approachType`: tipo `LeadApproachType?`.
- Campo `consortiumType`: tipo `ConsortiumType`.
- Campo `desiredCreditValue`: tipo `Decimal`.
- Campo `desiredTermMonths`: tipo `Int`.
- Campo `consultantId`: tipo `String`.
- Campo `pipelineStageId`: tipo `String`.
- Campo `score`: tipo `Int`.
- Campo `lostReason`: tipo `String?`.
- Campo `notes`: tipo `String?`.
- Campo `convertedClientId`: tipo `String?`.
- Campo `lastContactAt`: tipo `DateTime?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `commercialJourneys`: tipo `CommercialJourney[]`.
- Campo `consultant`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [consultantId], references: [id])`.
- Campo `convertedClient`: tipo `Client?`. Relacionamento declarado: `@relation("LeadConversion", fields: [convertedClientId], references: [id])`.
- Campo `pipelineStage`: tipo `PipelineStage`. Relacionamento declarado: `@relation(fields: [pipelineStageId], references: [id])`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `meetings`: tipo `Meeting[]`.
- Campo `proposals`: tipo `Proposal[]`.
- Campo `tasks`: tipo `Task[]`.
- Configuração de modelo: `@@index([workspaceId], map: "leads_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "leads_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, source], map: "leads_workspace_source_idx")`
- Configuração de modelo: `@@index([workspaceId, consultantId], map: "leads_workspace_consultant_idx")`
- Configuração de modelo: `@@index([workspaceId, pipelineStageId], map: "leads_workspace_pipeline_stage_idx")`
- Configuração de modelo: `@@index([workspaceId, consortiumType], map: "leads_workspace_consortium_type_idx")`
- Configuração de modelo: `@@index([workspaceId, createdAt], map: "leads_workspace_created_at_idx")`
- Configuração de modelo: `@@map("leads")`

#### model `Client`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `type`: tipo `PersonType`.
- Campo `name`: tipo `String`.
- Campo `email`: tipo `String`.
- Campo `phone`: tipo `String`.
- Campo `document`: tipo `String`.
- Campo `birthDate`: tipo `DateTime?`.
- Campo `companyName`: tipo `String?`.
- Campo `tradeName`: tipo `String?`.
- Campo `stateRegistration`: tipo `String?`.
- Campo `addressStreet`: tipo `String`.
- Campo `addressNumber`: tipo `String`.
- Campo `addressComplement`: tipo `String?`.
- Campo `addressNeighborhood`: tipo `String`.
- Campo `addressCity`: tipo `String`.
- Campo `addressState`: tipo `String`.
- Campo `addressZipCode`: tipo `String`.
- Campo `consultantId`: tipo `String`.
- Campo `status`: tipo `ClientStatus`.
- Campo `tags`: tipo `String[]`.
- Campo `notes`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `consultant`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [consultantId], references: [id])`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `commercialJourneys`: tipo `CommercialJourney[]`.
- Campo `convertedFromLead`: tipo `Lead?`. Relacionamento declarado: `@relation("LeadConversion")`.
- Campo `meetings`: tipo `Meeting[]`.
- Campo `proposals`: tipo `Proposal[]`.
- Campo `sales`: tipo `Sale[]`.
- Campo `tasks`: tipo `Task[]`.
- Configuração de modelo: `@@unique([workspaceId, document], map: "clients_workspace_document_key")`
- Configuração de modelo: `@@index([workspaceId], map: "clients_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "clients_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, type], map: "clients_workspace_type_idx")`
- Configuração de modelo: `@@index([workspaceId, consultantId], map: "clients_workspace_consultant_idx")`
- Configuração de modelo: `@@index([workspaceId, name], map: "clients_workspace_name_idx")`
- Configuração de modelo: `@@index([workspaceId, email], map: "clients_workspace_email_idx")`
- Configuração de modelo: `@@index([workspaceId, createdAt], map: "clients_workspace_created_at_idx")`
- Configuração de modelo: `@@map("clients")`

#### model `Proposal`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `code`: tipo `String`.
- Campo `clientId`: tipo `String?`.
- Campo `leadId`: tipo `String?`.
- Campo `consultantId`: tipo `String`.
- Campo `consortiumId`: tipo `String`.
- Campo `creditValue`: tipo `Decimal`.
- Campo `installmentValue`: tipo `Decimal`.
- Campo `termMonths`: tipo `Int`.
- Campo `administrationFeePercent`: tipo `Decimal`.
- Campo `reserveFundPercent`: tipo `Decimal`.
- Campo `status`: tipo `ProposalStatus`.
- Campo `sentAt`: tipo `DateTime?`.
- Campo `validUntil`: tipo `DateTime`.
- Campo `acceptedAt`: tipo `DateTime?`.
- Campo `rejectedAt`: tipo `DateTime?`.
- Campo `rejectionReason`: tipo `String?`.
- Campo `notes`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `meetings`: tipo `Meeting[]`.
- Campo `client`: tipo `Client?`. Relacionamento declarado: `@relation(fields: [clientId], references: [id], onDelete: Restrict)`.
- Campo `consortium`: tipo `Consortium`. Relacionamento declarado: `@relation(fields: [consortiumId], references: [id])`.
- Campo `consultant`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [consultantId], references: [id])`.
- Campo `lead`: tipo `Lead?`. Relacionamento declarado: `@relation(fields: [leadId], references: [id], onDelete: Restrict)`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `sale`: tipo `Sale?`.
- Campo `tasks`: tipo `Task[]`.
- Configuração de modelo: `@@unique([workspaceId, code], map: "proposals_workspace_code_key")`
- Configuração de modelo: `@@index([workspaceId], map: "proposals_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "proposals_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, consultantId], map: "proposals_workspace_consultant_idx")`
- Configuração de modelo: `@@index([workspaceId, consortiumId], map: "proposals_workspace_consortium_idx")`
- Configuração de modelo: `@@index([workspaceId, leadId], map: "proposals_workspace_lead_idx")`
- Configuração de modelo: `@@index([workspaceId, clientId], map: "proposals_workspace_client_idx")`
- Configuração de modelo: `@@index([workspaceId, validUntil], map: "proposals_workspace_valid_until_idx")`
- Configuração de modelo: `@@index([workspaceId, createdAt], map: "proposals_workspace_created_at_idx")`
- Configuração de modelo: `@@map("proposals")`

#### model `Meeting`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `title`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `type`: tipo `MeetingType`.
- Campo `status`: tipo `MeetingStatus`.
- Campo `startAt`: tipo `DateTime`.
- Campo `endAt`: tipo `DateTime`.
- Campo `location`: tipo `String?`.
- Campo `meetingUrl`: tipo `String?`.
- Campo `consultantId`: tipo `String`.
- Campo `leadId`: tipo `String?`.
- Campo `clientId`: tipo `String?`.
- Campo `proposalId`: tipo `String?`.
- Campo `outcome`: tipo `MeetingOutcome?`.
- Campo `notes`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `client`: tipo `Client?`. Relacionamento declarado: `@relation(fields: [clientId], references: [id], onDelete: Restrict)`.
- Campo `consultant`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [consultantId], references: [id])`.
- Campo `lead`: tipo `Lead?`. Relacionamento declarado: `@relation(fields: [leadId], references: [id], onDelete: Restrict)`.
- Campo `proposal`: tipo `Proposal?`. Relacionamento declarado: `@relation(fields: [proposalId], references: [id], onDelete: Restrict)`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `tasks`: tipo `Task[]`.
- Configuração de modelo: `@@index([workspaceId], map: "meetings_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "meetings_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, type], map: "meetings_workspace_type_idx")`
- Configuração de modelo: `@@index([workspaceId, consultantId], map: "meetings_workspace_consultant_idx")`
- Configuração de modelo: `@@index([workspaceId, leadId], map: "meetings_workspace_lead_idx")`
- Configuração de modelo: `@@index([workspaceId, clientId], map: "meetings_workspace_client_idx")`
- Configuração de modelo: `@@index([workspaceId, proposalId], map: "meetings_workspace_proposal_idx")`
- Configuração de modelo: `@@index([workspaceId, startAt], map: "meetings_workspace_start_at_idx")`
- Configuração de modelo: `@@index([workspaceId, consultantId, startAt], map: "meetings_consultant_start_at_idx")`
- Configuração de modelo: `@@map("meetings")`

#### model `Sale`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `contractNumber`: tipo `String`.
- Campo `proposalId`: tipo `String`.
- Campo `clientId`: tipo `String`.
- Campo `consultantId`: tipo `String`.
- Campo `consortiumId`: tipo `String`.
- Campo `groupNumber`: tipo `String`.
- Campo `quotaNumber`: tipo `Int`.
- Campo `creditValue`: tipo `Decimal`.
- Campo `installmentValue`: tipo `Decimal`.
- Campo `termMonths`: tipo `Int`.
- Campo `administrationFeePercent`: tipo `Decimal`.
- Campo `reserveFundPercent`: tipo `Decimal`.
- Campo `commissionValue`: tipo `Decimal`.
- Campo `commissionPercent`: tipo `Decimal`.
- Campo `status`: tipo `SaleStatus`.
- Campo `quotaStatus`: tipo `QuotaStatus`.
- Campo `paymentMethod`: tipo `PaymentMethod`.
- Campo `saleDate`: tipo `DateTime`.
- Campo `firstInstallmentDate`: tipo `DateTime`.
- Campo `contemplatedAt`: tipo `DateTime?`.
- Campo `paidOffAt`: tipo `DateTime?`.
- Campo `cancelledAt`: tipo `DateTime?`.
- Campo `cancellationReason`: tipo `String?`.
- Campo `notes`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `client`: tipo `Client`. Relacionamento declarado: `@relation(fields: [clientId], references: [id])`.
- Campo `consortium`: tipo `Consortium`. Relacionamento declarado: `@relation(fields: [consortiumId], references: [id])`.
- Campo `consultant`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [consultantId], references: [id])`.
- Campo `proposal`: tipo `Proposal`. Relacionamento declarado: `@relation(fields: [proposalId], references: [id])`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Configuração de modelo: `@@unique([workspaceId, contractNumber], map: "sales_workspace_contract_number_key")`
- Configuração de modelo: `@@unique([workspaceId, consortiumId, groupNumber, quotaNumber], map: "sales_workspace_group_quota_key")`
- Configuração de modelo: `@@index([workspaceId], map: "sales_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "sales_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, quotaStatus], map: "sales_workspace_quota_status_idx")`
- Configuração de modelo: `@@index([workspaceId, consultantId], map: "sales_workspace_consultant_idx")`
- Configuração de modelo: `@@index([workspaceId, clientId], map: "sales_workspace_client_idx")`
- Configuração de modelo: `@@index([workspaceId, consortiumId], map: "sales_workspace_consortium_idx")`
- Configuração de modelo: `@@index([workspaceId, paymentMethod], map: "sales_workspace_payment_method_idx")`
- Configuração de modelo: `@@index([workspaceId, saleDate], map: "sales_workspace_sale_date_idx")`
- Configuração de modelo: `@@index([workspaceId, firstInstallmentDate], map: "sales_workspace_first_installment_idx")`
- Configuração de modelo: `@@map("sales")`

#### model `Task`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `title`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `type`: tipo `TaskType`.
- Campo `status`: tipo `TaskStatus`.
- Campo `priority`: tipo `TaskPriority`.
- Campo `dueAt`: tipo `DateTime`.
- Campo `assignedToId`: tipo `String`.
- Campo `leadId`: tipo `String?`.
- Campo `clientId`: tipo `String?`.
- Campo `meetingId`: tipo `String?`.
- Campo `proposalId`: tipo `String?`.
- Campo `completedAt`: tipo `DateTime?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `assignedTo`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [assignedToId], references: [id])`.
- Campo `client`: tipo `Client?`. Relacionamento declarado: `@relation(fields: [clientId], references: [id], onDelete: Restrict)`.
- Campo `lead`: tipo `Lead?`. Relacionamento declarado: `@relation(fields: [leadId], references: [id], onDelete: Restrict)`.
- Campo `meeting`: tipo `Meeting?`. Relacionamento declarado: `@relation(fields: [meetingId], references: [id], onDelete: Restrict)`.
- Campo `proposal`: tipo `Proposal?`. Relacionamento declarado: `@relation(fields: [proposalId], references: [id], onDelete: Restrict)`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Configuração de modelo: `@@index([workspaceId], map: "tasks_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "tasks_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, priority], map: "tasks_workspace_priority_idx")`
- Configuração de modelo: `@@index([workspaceId, type], map: "tasks_workspace_type_idx")`
- Configuração de modelo: `@@index([workspaceId, assignedToId], map: "tasks_workspace_assigned_to_idx")`
- Configuração de modelo: `@@index([workspaceId, assignedToId, status], map: "tasks_assigned_to_status_idx")`
- Configuração de modelo: `@@index([workspaceId, dueAt], map: "tasks_workspace_due_at_idx")`
- Configuração de modelo: `@@index([workspaceId, status, dueAt], map: "tasks_status_due_at_idx")`
- Configuração de modelo: `@@index([workspaceId, leadId], map: "tasks_workspace_lead_idx")`
- Configuração de modelo: `@@index([workspaceId, clientId], map: "tasks_workspace_client_idx")`
- Configuração de modelo: `@@index([workspaceId, meetingId], map: "tasks_workspace_meeting_idx")`
- Configuração de modelo: `@@index([workspaceId, proposalId], map: "tasks_workspace_proposal_idx")`
- Configuração de modelo: `@@map("tasks")`

#### model `JourneyPhase`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `code`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `order`: tipo `Int`.
- Campo `isActive`: tipo `Boolean`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `commercialJourneys`: tipo `CommercialJourney[]`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `states`: tipo `JourneyState[]`.
- Configuração de modelo: `@@unique([workspaceId, code], map: "journey_phases_workspace_code_key")`
- Configuração de modelo: `@@unique([workspaceId, order], map: "journey_phases_workspace_order_key")`
- Configuração de modelo: `@@index([workspaceId], map: "journey_phases_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, isActive], map: "journey_phases_workspace_active_idx")`
- Configuração de modelo: `@@map("journey_phases")`

#### model `JourneyState`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `phaseId`: tipo `String`.
- Campo `code`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `order`: tipo `Int`.
- Campo `color`: tipo `String?`.
- Campo `icon`: tipo `String?`.
- Campo `isInitial`: tipo `Boolean`.
- Campo `isFinal`: tipo `Boolean`.
- Campo `isWon`: tipo `Boolean`.
- Campo `isLost`: tipo `Boolean`.
- Campo `allowReopen`: tipo `Boolean`.
- Campo `isActive`: tipo `Boolean`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `commercialJourneys`: tipo `CommercialJourney[]`.
- Campo `phase`: tipo `JourneyPhase`. Relacionamento declarado: `@relation(fields: [phaseId], references: [id])`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `sourceWorkflowRules`: tipo `WorkflowRule[]`. Relacionamento declarado: `@relation("WorkflowRuleSourceState")`.
- Campo `targetWorkflowRules`: tipo `WorkflowRule[]`. Relacionamento declarado: `@relation("WorkflowRuleTargetState")`.
- Configuração de modelo: `@@unique([workspaceId, code], map: "journey_states_workspace_code_key")`
- Configuração de modelo: `@@unique([phaseId, order], map: "journey_states_phase_order_key")`
- Configuração de modelo: `@@index([workspaceId], map: "journey_states_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, phaseId], map: "journey_states_workspace_phase_idx")`
- Configuração de modelo: `@@index([workspaceId, isActive], map: "journey_states_workspace_active_idx")`
- Configuração de modelo: `@@index([workspaceId, isInitial], map: "journey_states_workspace_initial_idx")`
- Configuração de modelo: `@@index([workspaceId, isFinal], map: "journey_states_workspace_final_idx")`
- Configuração de modelo: `@@map("journey_states")`

#### model `CommercialJourney`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `leadId`: tipo `String?`.
- Campo `clientId`: tipo `String?`.
- Campo `consultantId`: tipo `String`.
- Campo `title`: tipo `String`.
- Campo `consortiumType`: tipo `ConsortiumType`.
- Campo `currentPhaseId`: tipo `String`.
- Campo `currentStateId`: tipo `String`.
- Campo `priority`: tipo `CommercialJourneyPriority`.
- Campo `score`: tipo `Int`.
- Campo `outcome`: tipo `CommercialJourneyOutcome?`.
- Campo `stateEnteredAt`: tipo `DateTime`.
- Campo `lastInteractionAt`: tipo `DateTime?`.
- Campo `closedAt`: tipo `DateTime?`.
- Campo `version`: tipo `Int`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `commercialActions`: tipo `CommercialAction[]`.
- Campo `commercialEvents`: tipo `CommercialEvent[]`.
- Campo `client`: tipo `Client?`. Relacionamento declarado: `@relation(fields: [clientId], references: [id])`.
- Campo `consultant`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [consultantId], references: [id])`.
- Campo `currentPhase`: tipo `JourneyPhase`. Relacionamento declarado: `@relation(fields: [currentPhaseId], references: [id])`.
- Campo `currentState`: tipo `JourneyState`. Relacionamento declarado: `@relation(fields: [currentStateId], references: [id])`.
- Campo `lead`: tipo `Lead?`. Relacionamento declarado: `@relation(fields: [leadId], references: [id])`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `nextBestActions`: tipo `NextBestAction[]`.
- Configuração de modelo: `@@index([workspaceId], map: "commercial_journeys_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, leadId], map: "commercial_journeys_workspace_lead_idx")`
- Configuração de modelo: `@@index([workspaceId, clientId], map: "commercial_journeys_workspace_client_idx")`
- Configuração de modelo: `@@index([workspaceId, consultantId], map: "commercial_journeys_workspace_consultant_idx")`
- Configuração de modelo: `@@index([workspaceId, currentPhaseId], map: "commercial_journeys_workspace_phase_idx")`
- Configuração de modelo: `@@index([workspaceId, currentStateId], map: "commercial_journeys_workspace_state_idx")`
- Configuração de modelo: `@@index([workspaceId, priority], map: "commercial_journeys_workspace_priority_idx")`
- Configuração de modelo: `@@index([workspaceId, outcome], map: "commercial_journeys_workspace_outcome_idx")`
- Configuração de modelo: `@@index([workspaceId, lastInteractionAt], map: "commercial_journeys_workspace_last_interaction_idx")`
- Configuração de modelo: `@@index([workspaceId, closedAt], map: "commercial_journeys_workspace_closed_at_idx")`
- Configuração de modelo: `@@map("commercial_journeys")`

#### model `CommercialEvent`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `journeyId`: tipo `String`.
- Campo `type`: tipo `CommercialEventType`.
- Campo `actorType`: tipo `CommercialActorType`.
- Campo `actorId`: tipo `String?`.
- Campo `payload`: tipo `Json`.
- Campo `occurredAt`: tipo `DateTime`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `journey`: tipo `CommercialJourney`. Relacionamento declarado: `@relation(fields: [journeyId], references: [id], onDelete: Cascade)`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Configuração de modelo: `@@index([workspaceId], map: "commercial_events_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, journeyId], map: "commercial_events_workspace_journey_idx")`
- Configuração de modelo: `@@index([workspaceId, type], map: "commercial_events_workspace_type_idx")`
- Configuração de modelo: `@@index([workspaceId, actorType], map: "commercial_events_workspace_actor_type_idx")`
- Configuração de modelo: `@@index([workspaceId, occurredAt], map: "commercial_events_workspace_occurred_at_idx")`
- Configuração de modelo: `@@map("commercial_events")`

#### model `CommercialAction`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `journeyId`: tipo `String`.
- Campo `type`: tipo `CommercialActionType`.
- Campo `status`: tipo `CommercialActionStatus`.
- Campo `origin`: tipo `CommercialActionOrigin`.
- Campo `actorType`: tipo `CommercialActorType`.
- Campo `actorId`: tipo `String?`.
- Campo `title`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `payload`: tipo `Json`.
- Campo `scheduledFor`: tipo `DateTime?`.
- Campo `startedAt`: tipo `DateTime?`.
- Campo `completedAt`: tipo `DateTime?`.
- Campo `failedAt`: tipo `DateTime?`.
- Campo `failureReason`: tipo `String?`.
- Campo `createdBy`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `journey`: tipo `CommercialJourney`. Relacionamento declarado: `@relation(fields: [journeyId], references: [id], onDelete: Cascade)`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Campo `executedNextBestAction`: tipo `NextBestAction?`.
- Configuração de modelo: `@@index([workspaceId], map: "commercial_actions_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, journeyId], map: "commercial_actions_workspace_journey_idx")`
- Configuração de modelo: `@@index([workspaceId, status], map: "commercial_actions_workspace_status_idx")`
- Configuração de modelo: `@@index([workspaceId, type], map: "commercial_actions_workspace_type_idx")`
- Configuração de modelo: `@@index([workspaceId, origin], map: "commercial_actions_workspace_origin_idx")`
- Configuração de modelo: `@@index([workspaceId, scheduledFor], map: "commercial_actions_workspace_scheduled_for_idx")`
- Configuração de modelo: `@@map("commercial_actions")`

#### model `WorkflowRule`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String?`.
- Campo `name`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `eventType`: tipo `String`.
- Campo `sourceStateId`: tipo `String?`.
- Campo `targetStateId`: tipo `String?`.
- Campo `conditions`: tipo `Json`.
- Campo `actions`: tipo `Json`.
- Campo `priority`: tipo `Int`.
- Campo `stopProcessingAfterMatch`: tipo `Boolean`.
- Campo `isActive`: tipo `Boolean`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `sourceState`: tipo `JourneyState?`. Relacionamento declarado: `@relation("WorkflowRuleSourceState", fields: [sourceStateId], references: [id])`.
- Campo `targetState`: tipo `JourneyState?`. Relacionamento declarado: `@relation("WorkflowRuleTargetState", fields: [targetStateId], references: [id])`.
- Campo `workspace`: tipo `Workspace?`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id], onDelete: Cascade)`.
- Configuração de modelo: `@@index([workspaceId], map: "workflow_rules_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, eventType], map: "workflow_rules_workspace_event_type_idx")`
- Configuração de modelo: `@@index([workspaceId, isActive], map: "workflow_rules_workspace_active_idx")`
- Configuração de modelo: `@@index([workspaceId, priority], map: "workflow_rules_workspace_priority_idx")`
- Configuração de modelo: `@@index([sourceStateId], map: "workflow_rules_source_state_idx")`
- Configuração de modelo: `@@index([targetStateId], map: "workflow_rules_target_state_idx")`
- Configuração de modelo: `@@map("workflow_rules")`

#### model `NextBestAction`

- Campo `id`: tipo `String`.
- Campo `workspaceId`: tipo `String`.
- Campo `journeyId`: tipo `String`.
- Campo `actionType`: tipo `CommercialActionType`.
- Campo `title`: tipo `String`.
- Campo `description`: tipo `String?`.
- Campo `reason`: tipo `String`.
- Campo `confidence`: tipo `Decimal`.
- Campo `priority`: tipo `NextBestActionPriority`.
- Campo `source`: tipo `NextBestActionSource`.
- Campo `expiresAt`: tipo `DateTime?`.
- Campo `acceptedAt`: tipo `DateTime?`.
- Campo `rejectedAt`: tipo `DateTime?`.
- Campo `executedActionId`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `executedAction`: tipo `CommercialAction?`. Relacionamento declarado: `@relation(fields: [executedActionId], references: [id])`.
- Campo `journey`: tipo `CommercialJourney`. Relacionamento declarado: `@relation(fields: [journeyId], references: [id], onDelete: Cascade)`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id])`.
- Configuração de modelo: `@@index([workspaceId], map: "next_best_actions_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, journeyId], map: "next_best_actions_workspace_journey_idx")`
- Configuração de modelo: `@@index([workspaceId, priority], map: "next_best_actions_workspace_priority_idx")`
- Configuração de modelo: `@@index([workspaceId, source], map: "next_best_actions_workspace_source_idx")`
- Configuração de modelo: `@@index([workspaceId, actionType], map: "next_best_actions_workspace_action_type_idx")`
- Configuração de modelo: `@@index([workspaceId, expiresAt], map: "next_best_actions_workspace_expires_at_idx")`
- Configuração de modelo: `@@index([workspaceId, acceptedAt], map: "next_best_actions_workspace_accepted_at_idx")`
- Configuração de modelo: `@@index([workspaceId, rejectedAt], map: "next_best_actions_workspace_rejected_at_idx")`
- Configuração de modelo: `@@map("next_best_actions")`

#### model `User`

- Campo `id`: tipo `String`.
- Campo `name`: tipo `String`.
- Campo `email`: tipo `String`.
- Campo `emailVerified`: tipo `Boolean`.
- Campo `image`: tipo `String?`.
- Campo `workspaceId`: tipo `String`.
- Campo `consultantId`: tipo `String`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `workspace`: tipo `Workspace`. Relacionamento declarado: `@relation(fields: [workspaceId], references: [id], onDelete: Restrict)`.
- Campo `consultant`: tipo `Consultant`. Relacionamento declarado: `@relation(fields: [consultantId], references: [id], onDelete: Restrict)`.
- Campo `sessions`: tipo `Session[]`.
- Campo `accounts`: tipo `Account[]`.
- Configuração de modelo: `@@index([workspaceId], map: "users_workspace_idx")`
- Configuração de modelo: `@@index([workspaceId, email], map: "users_workspace_email_idx")`
- Configuração de modelo: `@@map("users")`

#### model `Session`

- Campo `id`: tipo `String`.
- Campo `expiresAt`: tipo `DateTime`.
- Campo `token`: tipo `String`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `ipAddress`: tipo `String?`.
- Campo `userAgent`: tipo `String?`.
- Campo `userId`: tipo `String`.
- Campo `user`: tipo `User`. Relacionamento declarado: `@relation(fields: [userId], references: [id], onDelete: Cascade)`.
- Configuração de modelo: `@@index([userId], map: "sessions_user_idx")`
- Configuração de modelo: `@@index([expiresAt], map: "sessions_expires_at_idx")`
- Configuração de modelo: `@@map("sessions")`

#### model `Account`

- Campo `id`: tipo `String`.
- Campo `accountId`: tipo `String`.
- Campo `providerId`: tipo `String`.
- Campo `userId`: tipo `String`.
- Campo `accessToken`: tipo `String?`.
- Campo `refreshToken`: tipo `String?`.
- Campo `idToken`: tipo `String?`.
- Campo `accessTokenExpiresAt`: tipo `DateTime?`.
- Campo `refreshTokenExpiresAt`: tipo `DateTime?`.
- Campo `scope`: tipo `String?`.
- Campo `password`: tipo `String?`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Campo `user`: tipo `User`. Relacionamento declarado: `@relation(fields: [userId], references: [id], onDelete: Cascade)`.
- Configuração de modelo: `@@unique([providerId, accountId], map: "accounts_provider_account_key")`
- Configuração de modelo: `@@index([userId], map: "accounts_user_idx")`
- Configuração de modelo: `@@map("accounts")`

#### model `Verification`

- Campo `id`: tipo `String`.
- Campo `identifier`: tipo `String`.
- Campo `value`: tipo `String`.
- Campo `expiresAt`: tipo `DateTime`.
- Campo `createdAt`: tipo `DateTime`.
- Campo `updatedAt`: tipo `DateTime`.
- Configuração de modelo: `@@index([identifier], map: "verifications_identifier_idx")`
- Configuração de modelo: `@@index([expiresAt], map: "verifications_expires_at_idx")`
- Configuração de modelo: `@@map("verifications")`

#### enum `WorkspaceStatus`

- Valor: `ACTIVE   @map("active")`
- Valor: `INACTIVE @map("inactive")`
- Configuração de modelo: `@@map("workspace_status")`

#### enum `ConsultantRole`

- Valor: `CONSULTANT @map("consultant")`
- Valor: `MANAGER    @map("manager")`
- Valor: `ADMIN      @map("admin")`
- Configuração de modelo: `@@map("consultant_role")`

#### enum `ConsultantStatus`

- Valor: `ACTIVE   @map("active")`
- Valor: `INACTIVE @map("inactive")`
- Valor: `ON_LEAVE @map("on_leave")`
- Configuração de modelo: `@@map("consultant_status")`

#### enum `ConsortiumType`

- Valor: `REAL_ESTATE   @map("real_estate")`
- Valor: `VEHICLE       @map("vehicle")`
- Valor: `HEAVY_VEHICLE @map("heavy_vehicle")`
- Valor: `SERVICES      @map("services")`
- Valor: `OTHER         @map("other")`
- Configuração de modelo: `@@map("consortium_type")`

#### enum `ConsortiumStatus`

- Valor: `FORMING @map("forming")`
- Valor: `ACTIVE  @map("active")`
- Valor: `CLOSED  @map("closed")`
- Configuração de modelo: `@@map("consortium_status")`

#### enum `PipelineStageType`

- Valor: `LEAD @map("lead")`
- Valor: `DEAL @map("deal")`
- Configuração de modelo: `@@map("pipeline_stage_type")`

#### enum `LeadSource`

- Valor: `REFERRAL     @map("referral")`
- Valor: `WEBSITE      @map("website")`
- Valor: `SOCIAL_MEDIA @map("social_media")`
- Valor: `COLD_CALL    @map("cold_call")`
- Valor: `EVENT        @map("event")`
- Valor: `PARTNER      @map("partner")`
- Valor: `WALK_IN      @map("walk_in")`
- Valor: `OTHER        @map("other")`
- Configuração de modelo: `@@map("lead_source")`

#### enum `LeadApproachType`

- Valor: `NEW          @map("new")`
- Valor: `REACTIVATION @map("reactivation")`
- Configuração de modelo: `@@map("lead_approach_type")`

#### enum `LeadStatus`

- Valor: `NEW         @map("new")`
- Valor: `CONTACTED   @map("contacted")`
- Valor: `QUALIFIED   @map("qualified")`
- Valor: `NEGOTIATING @map("negotiating")`
- Valor: `CONVERTED   @map("converted")`
- Valor: `LOST        @map("lost")`
- Configuração de modelo: `@@map("lead_status")`

#### enum `PersonType`

- Valor: `INDIVIDUAL @map("individual")`
- Valor: `COMPANY    @map("company")`
- Configuração de modelo: `@@map("person_type")`

#### enum `ClientStatus`

- Valor: `ACTIVE   @map("active")`
- Valor: `INACTIVE @map("inactive")`
- Valor: `BLOCKED  @map("blocked")`
- Configuração de modelo: `@@map("client_status")`

#### enum `ProposalStatus`

- Valor: `DRAFT    @map("draft")`
- Valor: `SENT     @map("sent")`
- Valor: `ACCEPTED @map("accepted")`
- Valor: `REJECTED @map("rejected")`
- Valor: `EXPIRED  @map("expired")`
- Configuração de modelo: `@@map("proposal_status")`

#### enum `MeetingType`

- Valor: `IN_PERSON @map("in_person")`
- Valor: `ONLINE    @map("online")`
- Valor: `PHONE     @map("phone")`
- Configuração de modelo: `@@map("meeting_type")`

#### enum `MeetingStatus`

- Valor: `SCHEDULED @map("scheduled")`
- Valor: `COMPLETED @map("completed")`
- Valor: `CANCELLED @map("cancelled")`
- Valor: `NO_SHOW   @map("no_show")`
- Configuração de modelo: `@@map("meeting_status")`

#### enum `MeetingOutcome`

- Valor: `PROPOSAL_SENT       @map("proposal_sent")`
- Valor: `FOLLOW_UP_SCHEDULED @map("follow_up_scheduled")`
- Valor: `NOT_INTERESTED      @map("not_interested")`
- Valor: `CONVERTED           @map("converted")`
- Valor: `NO_ANSWER           @map("no_answer")`
- Valor: `OTHER               @map("other")`
- Configuração de modelo: `@@map("meeting_outcome")`

#### enum `SaleStatus`

- Valor: `PENDING_SIGNATURE @map("pending_signature")`
- Valor: `ACTIVE            @map("active")`
- Valor: `CANCELLED         @map("cancelled")`
- Configuração de modelo: `@@map("sale_status")`

#### enum `QuotaStatus`

- Valor: `NOT_CONTEMPLATED @map("not_contemplated")`
- Valor: `CONTEMPLATED     @map("contemplated")`
- Valor: `PAID_OFF         @map("paid_off")`
- Valor: `CANCELLED        @map("cancelled")`
- Configuração de modelo: `@@map("quota_status")`

#### enum `PaymentMethod`

- Valor: `BANK_SLIP    @map("bank_slip")`
- Valor: `DIRECT_DEBIT @map("direct_debit")`
- Valor: `CREDIT_CARD  @map("credit_card")`
- Valor: `PIX          @map("pix")`
- Configuração de modelo: `@@map("payment_method")`

#### enum `TaskPriority`

- Valor: `HIGH   @map("high")`
- Valor: `MEDIUM @map("medium")`
- Valor: `LOW    @map("low")`
- Configuração de modelo: `@@map("task_priority")`

#### enum `TaskStatus`

- Valor: `PENDING     @map("pending")`
- Valor: `IN_PROGRESS @map("in_progress")`
- Valor: `COMPLETED   @map("completed")`
- Valor: `CANCELLED   @map("cancelled")`
- Configuração de modelo: `@@map("task_status")`

#### enum `TaskType`

- Valor: `CALL            @map("call")`
- Valor: `EMAIL           @map("email")`
- Valor: `FOLLOW_UP       @map("follow_up")`
- Valor: `DOCUMENT        @map("document")`
- Valor: `MEETING_PREP    @map("meeting_prep")`
- Valor: `PROPOSAL_REVIEW @map("proposal_review")`
- Valor: `OTHER           @map("other")`
- Configuração de modelo: `@@map("task_type")`

#### enum `CommercialJourneyPriority`

- Valor: `LOW    @map("low")`
- Valor: `NORMAL @map("normal")`
- Valor: `HIGH   @map("high")`
- Valor: `URGENT @map("urgent")`
- Configuração de modelo: `@@map("commercial_journey_priority")`

#### enum `CommercialJourneyOutcome`

- Valor: `WON                     @map("won")`
- Valor: `LOST_TO_COMPETITOR      @map("lost_to_competitor")`
- Valor: `NO_FINANCIAL_CAPACITY   @map("no_financial_capacity")`
- Valor: `NO_RESPONSE             @map("no_response")`
- Valor: `POSTPONED               @map("postponed")`
- Valor: `PRODUCT_NOT_SUITABLE    @map("product_not_suitable")`
- Valor: `TRUST_CONCERN           @map("trust_concern")`
- Valor: `CLIENT_WITHDREW         @map("client_withdrew")`
- Valor: `CANCELLED_BY_CONSULTANT @map("cancelled_by_consultant")`
- Valor: `OTHER                   @map("other")`
- Configuração de modelo: `@@map("commercial_journey_outcome")`

#### enum `CommercialActorType`

- Valor: `LEAD          @map("lead")`
- Valor: `CLIENT        @map("client")`
- Valor: `CONSULTANT    @map("consultant")`
- Valor: `AI            @map("ai")`
- Valor: `SYSTEM        @map("system")`
- Valor: `AUTOMATION    @map("automation")`
- Valor: `ADMINISTRATOR @map("administrator")`
- Configuração de modelo: `@@map("commercial_actor_type")`

#### enum `CommercialEventType`

- Valor: `LEAD_CREATED        @map("lead_created")`
- Valor: `OPPORTUNITY_CREATED @map("opportunity_created")`
- Valor: `LEAD_REPLIED        @map("lead_replied")`
- Valor: `MEETING_SCHEDULED   @map("meeting_scheduled")`
- Valor: `MEETING_COMPLETED   @map("meeting_completed")`
- Valor: `PROPOSAL_SENT       @map("proposal_sent")`
- Valor: `PROPOSAL_ACCEPTED   @map("proposal_accepted")`
- Valor: `DOCUMENT_REQUESTED  @map("document_requested")`
- Valor: `DOCUMENT_RECEIVED   @map("document_received")`
- Valor: `PAYMENT_CONFIRMED   @map("payment_confirmed")`
- Valor: `SALE_COMPLETED      @map("sale_completed")`
- Valor: `STATE_CHANGED       @map("state_changed")`
- Valor: `NOTE_ADDED          @map("note_added")`
- Valor: `TASK_CREATED        @map("task_created")`
- Valor: `TASK_COMPLETED      @map("task_completed")`
- Configuração de modelo: `@@map("commercial_event_type")`

#### enum `CommercialActionType`

- Valor: `CHANGE_STATE       @map("change_state")`
- Valor: `CREATE_TASK        @map("create_task")`
- Valor: `COMPLETE_TASK      @map("complete_task")`
- Valor: `ADD_NOTE           @map("add_note")`
- Valor: `UPDATE_PRIORITY    @map("update_priority")`
- Valor: `UPDATE_SCORE       @map("update_score")`
- Valor: `ASSIGN_CONSULTANT  @map("assign_consultant")`
- Valor: `SEND_NOTIFICATION  @map("send_notification")`
- Valor: `SEND_MESSAGE       @map("send_message")`
- Valor: `REQUEST_DOCUMENT   @map("request_document")`
- Valor: `CREATE_PROPOSAL    @map("create_proposal")`
- Valor: `TRIGGER_AUTOMATION @map("trigger_automation")`
- Configuração de modelo: `@@map("commercial_action_type")`

#### enum `CommercialActionStatus`

- Valor: `PENDING     @map("pending")`
- Valor: `IN_PROGRESS @map("in_progress")`
- Valor: `COMPLETED   @map("completed")`
- Valor: `FAILED      @map("failed")`
- Valor: `CANCELLED   @map("cancelled")`
- Configuração de modelo: `@@map("commercial_action_status")`

#### enum `CommercialActionOrigin`

- Valor: `MANUAL           @map("manual")`
- Valor: `WORKFLOW_RULE    @map("workflow_rule")`
- Valor: `NEXT_BEST_ACTION @map("next_best_action")`
- Valor: `AI               @map("ai")`
- Valor: `SYSTEM           @map("system")`
- Configuração de modelo: `@@map("commercial_action_origin")`

#### enum `NextBestActionSource`

- Valor: `RULE_ENGINE @map("rule_engine")`
- Valor: `AI          @map("ai")`
- Valor: `SYSTEM      @map("system")`
- Valor: `CONSULTANT  @map("consultant")`
- Configuração de modelo: `@@map("next_best_action_source")`

#### enum `NextBestActionPriority`

- Valor: `LOW    @map("low")`
- Valor: `NORMAL @map("normal")`
- Valor: `HIGH   @map("high")`
- Valor: `URGENT @map("urgent")`
- Configuração de modelo: `@@map("next_best_action_priority")`


## 5. Estado do código (seja honesto)

### Gambiarra, TODO e código temporário

- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_BUILD.ps1:15` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_BUILD.ps1:17` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_BUILD.ps1:20` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_BUILD.ps1:23` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:17` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:19` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:22` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:25` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:30` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:31` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:32` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:35` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1:38` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:21` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:23` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:26` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:29` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:34` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:35` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:36` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:39` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1:42` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py:54` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py:55` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py:58` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_AUDIT_MATERIAL_BRANDING_GLB_ROUNDTRIP.py:46` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_AUDIT_MATERIAL_BRANDING_GLB_ROUNDTRIP.py:47` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_AUDIT_MATERIAL_BRANDING_GLB_ROUNDTRIP.py:50` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_COLOR_READABILITY_V2.py:63` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_COLOR_READABILITY_V2.py:64` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_COLOR_READABILITY_V2.py:67` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_FULL_CHARACTER_RUNTIME.py:71` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_FULL_CHARACTER_RUNTIME.py:72` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_FULL_CHARACTER_RUNTIME.py:75` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_MATERIAL_BRANDING.py:76` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_MATERIAL_BRANDING.py:77` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_BUILD_MATERIAL_BRANDING.py:80` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_EVENT_TO_RUNTIME_MAPPING.json:98` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_EXPORT_FULL_CHARACTER_GLB.py:42` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_EXPORT_FULL_CHARACTER_GLB.py:43` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_EXPORT_FULL_CHARACTER_GLB.py:46` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_EXPORT_MATERIAL_BRANDING_GLB.py:41` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_EXPORT_MATERIAL_BRANDING_GLB.py:42` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_EXPORT_MATERIAL_BRANDING_GLB.py:45` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1:36` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1:37` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1:38` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1:47` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1:48` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1:49` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ANATOMY_BLOCKED.ps1:11` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ANATOMY_BLOCKED.ps1:12` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ANATOMY_BLOCKED.ps1:13` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ANATOMY_BLOCKED.ps1:18` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ANATOMY_BLOCKED.ps1:19` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ANATOMY_BLOCKED.ps1:20` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ASSETS.ps1:14` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ASSETS.ps1:15` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ASSETS.ps1:16` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ASSETS.ps1:20` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ASSETS.ps1:21` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_FACIAL_ASSETS.ps1:22` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:16` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:17` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:18` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:21` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:22` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:23` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:59` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FINALIZE_HEAD_RIG_MISSION.ps1:229` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_FULL_CHARACTER_WEB_COMPATIBILITY_REPORT.md:28` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_HEAD_CONSOLIDATION_FINAL_REPORT.md:35` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_HEAD_CONSOLIDATION_RUNBOOK.md:38` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_HEAD_INDEPENDENT_AUDIT_REPORT.md:10` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_HEAD_RIG_RUNTIME_LOGS.md:9` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_HEAD_WEB_COMPATIBILITY_REPORT.md:9` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_FACIAL_ASSET_AUTHORING.ps1:11` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_FACIAL_ASSET_AUTHORING.ps1:12` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_FACIAL_ASSET_AUTHORING.ps1:13` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_FULL_CHARACTER_INTEGRATION.ps1:30` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_FULL_CHARACTER_INTEGRATION.ps1:32` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_FULL_CHARACTER_INTEGRATION.ps1:35` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_FULL_CHARACTER_INTEGRATION.ps1:38` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_HEAD_RIGGING.ps1:10` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_HEAD_RIGGING.ps1:11` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INIT_HEAD_RIGGING.ps1:12` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INTELLIGENCE_ORCHESTRATION_FINAL_REPORT.md:81` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INTELLIGENCE_ORCHESTRATION_RUNBOOK.md:30` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_INTELLIGENCE_ORCHESTRATION_STATE.json:180` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_FACIAL_ASSETS.ps1:17` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_FACIAL_ASSETS.ps1:18` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_FACIAL_ASSETS.ps1:19` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_FACIAL_ASSETS.ps1:23` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_FACIAL_ASSETS.ps1:24` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_FACIAL_ASSETS.ps1:25` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_HEAD_RIG.ps1:13` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_HEAD_RIG.ps1:14` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_HEAD_RIG.ps1:15` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_HEAD_RIG.ps1:18` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_HEAD_RIG.ps1:19` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_HEAD_RIG.ps1:20` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_MATERIAL_BRANDING_ATOMIC.ps1:56` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_PUBLISH_MATERIAL_BRANDING_ATOMIC.ps1:59` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py:39` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py:40` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py:43` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_TEST_FULL_CHARACTER_RUNTIME.py:63` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_TEST_FULL_CHARACTER_RUNTIME.py:64` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_TEST_FULL_CHARACTER_RUNTIME.py:67` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_V2_INSPECT_SOURCE.py:174` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_V2_INSPECT_SOURCE.py:175` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_V2_INSPECT_SOURCE.py:178` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_VALIDATE_MATERIAL_BRANDING_WEB_RUNTIME.ts:335` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_VALIDATE_MATERIAL_BRANDING_WEB_RUNTIME.ts:336` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_VALIDATE_MATERIAL_BRANDING_WEB_RUNTIME.ts:337` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_VALIDATE_MATERIAL_BRANDING.py:48` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_VALIDATE_MATERIAL_BRANDING.py:49` — marcador `TEMPORARY`.
- `blender/r2-rig/R2_VALIDATE_MATERIAL_BRANDING.py:52` — marcador `TEMPORARY`.
- `blender/r2-rig/r2-head-consolidated-rig-ready-v1/final_integrity.py:64` — marcador `TEMPORARY`.
- `blender/r2-rig/r2-head-consolidated-rig-ready-v1/final_integrity.py:65` — marcador `TEMPORARY`.
- `blender/r2-rig/r2-head-consolidated-rig-ready-v1/final_integrity.py:78` — marcador `TEMPORARY`.
- `blender/r2-rig/r2-head-consolidated-rig-ready-v1/final_integrity.py:79` — marcador `TEMPORARY`.
- `blender/r2-rig/r2-v26-semantic-atlas-technical-v1/r2-v26-semantic-atlas-technical-v1.md:29` — marcador `TODO`.
- `components/dashboard/upcoming-tasks.test.tsx:145` — marcador `TODO`.
- `public/brand/README.md:15` — marcador `TEMPORÁRIO`.
- `repositories/commercial/mock-commercial-repository.ts:222` — marcador `TODO`.

### Marcadores de tipagem/qualidade que merecem revisão

- `blender/r2-rig/R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.py:99` — `: any`.
- `blender/r2-rig/R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.py:226` — `: any`.
- `blender/r2-rig/R2_HEAD_RIG_DISCOVERY.py:94` — `: any`.
- `blender/r2-rig/r2-head-consolidated-rig-ready-v1/inventory_v57.py:153` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/browser.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/browser.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/client.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/client.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/commonInputTypes.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/commonInputTypes.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/enums.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/enums.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:132` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:144` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:155` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:167` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts:183` — `<any>`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:132` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:133` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:137` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:138` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:210` — `<any>`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1697` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1700` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1701` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1704` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1705` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1708` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1709` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1712` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts:1713` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespaceBrowser.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespaceBrowser.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:2955` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts:2961` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts:1731` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts:1737` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialEvent.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialEvent.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialEvent.ts:1223` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialEvent.ts:1229` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialJourney.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialJourney.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialJourney.ts:2916` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialJourney.ts:2922` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consortium.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consortium.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consortium.ts:1707` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consortium.ts:1713` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consultant.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consultant.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consultant.ts:2408` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consultant.ts:2414` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyPhase.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyPhase.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyPhase.ts:1332` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyPhase.ts:1338` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyState.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyState.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyState.ts:2031` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyState.ts:2037` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Lead.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Lead.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Lead.ts:2826` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Lead.ts:2832` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Meeting.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Meeting.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Meeting.ts:2330` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Meeting.ts:2336` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/NextBestAction.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/NextBestAction.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/NextBestAction.ts:1648` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/NextBestAction.ts:1654` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/PipelineStage.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/PipelineStage.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/PipelineStage.ts:1345` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/PipelineStage.ts:1351` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Proposal.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Proposal.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Proposal.ts:2936` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Proposal.ts:2942` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Sale.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Sale.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Sale.ts:2752` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Sale.ts:2758` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Task.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Task.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Task.ts:2217` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Task.ts:2223` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/WorkflowRule.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/WorkflowRule.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/WorkflowRule.ts:1587` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/WorkflowRule.ts:1593` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Workspace.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Workspace.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Workspace.ts:3167` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Workspace.ts:3173` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/browser.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/browser.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/client.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/client.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/commonInputTypes.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/commonInputTypes.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/enums.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/enums.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:132` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:144` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:155` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:167` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts:183` — `<any>`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:132` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:133` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:137` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:138` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:210` — `<any>`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1697` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1700` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1701` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1704` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1705` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1708` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1709` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1712` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts:1713` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespaceBrowser.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespaceBrowser.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Client.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Client.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Client.ts:2955` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Client.ts:2961` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialAction.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialAction.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialAction.ts:1731` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialAction.ts:1737` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialEvent.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialEvent.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialEvent.ts:1223` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialEvent.ts:1229` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialJourney.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialJourney.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialJourney.ts:2916` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/CommercialJourney.ts:2922` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consortium.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consortium.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consortium.ts:1707` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consortium.ts:1713` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consultant.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consultant.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consultant.ts:2408` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Consultant.ts:2414` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyPhase.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyPhase.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyPhase.ts:1332` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyPhase.ts:1338` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyState.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyState.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyState.ts:2031` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/JourneyState.ts:2037` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Lead.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Lead.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Lead.ts:2826` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Lead.ts:2832` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Meeting.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Meeting.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Meeting.ts:2330` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Meeting.ts:2336` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/NextBestAction.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/NextBestAction.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/NextBestAction.ts:1648` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/NextBestAction.ts:1654` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/PipelineStage.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/PipelineStage.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/PipelineStage.ts:1345` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/PipelineStage.ts:1351` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Proposal.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Proposal.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Proposal.ts:2936` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Proposal.ts:2942` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Sale.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Sale.ts:5` — `@ts-nocheck`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Sale.ts:2752` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Sale.ts:2758` — `: any`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Task.ts:3` — `eslint-disable`.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/models/Task.ts:5` — `@ts-nocheck`.
- A lista foi limitada a 200 ocorrências; total: **313**.

### Decisões técnicas observadas

- Uso do Next.js App Router: páginas e APIs ficam sob `app`. Isso unifica frontend e backend HTTP no mesmo projeto.
- Uso do Prisma para schema/migrations e acesso tipado ao banco; fonte de verdade em `prisma/schema.prisma`.
- Uso do Vitest para testes automatizados, confirmado em `package.json`.
- Autenticação isolada em arquivos próprios, com referência em `app/api/auth/[...all]/route.test.ts`.
- Motivos históricos além do que está documentado em código/commits: **não sei**.

### Dívida técnica conhecida

- Falta de ambiente Docker reproduzível.
- Marcadores de trabalho pendente espalhados por **40 arquivo(s).
- Existem **313** ocorrências de supressão/afrouxamento de tipagem ou lint detectadas.
- Dívidas não expressas por comentários/testes: **não sei**.

### Bugs conhecidos

- A suíte de testes falha atualmente; detalhes na seção 3.

### Partes de baixa confiança

`blender/r2-rig/R2_FACIAL_ANATOMICAL_AXES_AND_CANDIDATE_PROBE.py` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/R2_FACIAL_SEMANTIC_SUFFICIENCY_AUDIT.py` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/R2_HEAD_RIG_DISCOVERY.py` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-head-consolidated-rig-ready-v1/inventory_v57.py` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/browser.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/client.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/commonInputTypes.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/enums.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespaceBrowser.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialEvent.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialJourney.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consortium.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consultant.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyPhase.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyState.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Lead.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Meeting.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/NextBestAction.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/PipelineStage.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Proposal.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Sale.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Task.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/WorkflowRule.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Workspace.ts` — contém supressão ou tipagem ampla; revisar.
`blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/browser.ts` — contém supressão ou tipagem ampla; revisar.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/browser.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/commonInputTypes.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/enums.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/class.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespace.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/internal/prismaNamespaceBrowser.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Client.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialAction.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialEvent.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/CommercialJourney.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consortium.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Consultant.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyPhase.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/JourneyState.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Lead.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Meeting.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/NextBestAction.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/PipelineStage.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Proposal.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Sale.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Task.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/WorkflowRule.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v3/generated-client.before-v3/models/Workspace.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/browser.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/commonInputTypes.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/enums.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/class.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespace.ts` — integração externa; validar com teste de contrato/homologação.
- `blender/r2-rig/r2-runtime-intelligence-integration-v1/r2-real-event-dispatch-integration-v1/r2-opportunity-lead-nullability-migration-v4/generated-client.before-v4/internal/prismaNamespaceBrowser.ts` — integração externa; validar com teste de contrato/homologação.

## 6. Próximos passos

1. **Corrigir qualquer falha de build ou testes** — arquivos: os citados nos erros da seção 3; dificuldade: **média a alta**, conforme a causa.
2. **Confirmar manualmente a ausência de segredos** — revisar o resultado automático e usar uma ferramenta dedicada como Gitleaks/TruffleHog; dificuldade: **baixa a média**.
3. **Criar ambiente Docker reproduzível** — criar `Dockerfile`, `.dockerignore` e `docker-compose.yml`; incluir app e banco; dificuldade: **média**.
4. **Resolver TODOs/FIXMEs prioritários** — arquivos: `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_BUILD.ps1`, `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_GLB.ps1`, `blender/r2-rig/R2_APPROVE_FULL_CHARACTER_RUNTIME_TESTS.ps1`, `blender/r2-rig/R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py`, `blender/r2-rig/R2_AUDIT_MATERIAL_BRANDING_GLB_ROUNDTRIP.py`, `blender/r2-rig/R2_BUILD_COLOR_READABILITY_V2.py`, `blender/r2-rig/R2_BUILD_FULL_CHARACTER_RUNTIME.py`, `blender/r2-rig/R2_BUILD_MATERIAL_BRANDING.py`, `blender/r2-rig/R2_EVENT_TO_RUNTIME_MAPPING.json`, `blender/r2-rig/R2_EXPORT_FULL_CHARACTER_GLB.py`, `blender/r2-rig/R2_EXPORT_MATERIAL_BRANDING_GLB.py`, `blender/r2-rig/R2_FINALIZE_COLOR_READABILITY_V2.ps1`; dificuldade: **variável**.
5. **Homologar integrações externas com testes de contrato** — arquivos representativos: `application/opportunity/analyze-manual-whatsapp-message.test.ts`, não sei, não sei; dificuldade: **alta**.
6. **Revisar ocorrências de `any`, supressões de TypeScript e lint** — usar a lista da seção 5; dificuldade: **média**.
7. **Executar piloto completo do fluxo comercial** — autenticação → lead → oportunidade → reunião/proposta → venda → automações/R2; arquivos representativos nas seções 1 e 2; dificuldade: **alta** por envolver domínio e dados reais.

### Bloqueios

- WhatsApp/Meta: pode depender de app Meta, número homologado, token, webhook e permissões. Estado do acesso: **não sei**.
- Configuração local: é necessário preencher `.env` a partir de `.env.example` sem commitar credenciais.
- Decisões de produto e critérios de aceite ainda não documentados no repositório: **não sei**; validar com a diretoria.

## 7. Convenções

### Nomes e estilo

- Arquivos React/TypeScript usam predominantemente extensões `.tsx`/`.ts`.
- Rotas Next.js seguem `app/**/page.tsx` e `app/api/**/route.ts`.
- Preserve o padrão de nomes já usado no diretório do módulo; não renomeie em massa sem necessidade.
- Ferramentas exatas de lint/format: consultar os scripts e arquivos de configuração na raiz; regra adicional não comprovada: **não sei**.

### Commits

- A maioria dos commits recentes segue Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Exemplos recentes:
  - `chore: checkpoint before lead approach and Seals updates`
  - `feat: integrar avatar inteligente do R2 ao controller`
  - `feat: adicionar sistema de personalidade e relacionamento do R2`
  - `feat: adicionar sistema de expressão emocional do R2`
  - `feat: criar sistema de diálogo inicial do R2`
  - `feat: adicionar sistema de reveal da primeira entrada do R2`
  - `feat: criar animação de despertar do primeiro login do R2`
  - `feat: conectar atenção inteligente aos olhos do R2`
  - `feat: adicionar sistema de olhos e rig do R2`
  - `feat: conectar controlador facial ao avatar real do R2`

### Regras que o próximo desenvolvedor deve manter

- Não commitar `.env`, credenciais, tokens, certificados ou bancos locais.
- Alterar o schema somente com migration versionada e revisar o impacto nos dados.
- Manter ou ampliar testes dos módulos alterados.
- Executar build, testes e `git status` antes de entregar.
- Não declarar uma integração externa pronta sem teste de contrato ou homologação real.
- Registrar decisões que não estejam óbvias no código.

## Apêndice A — resultado do histórico de `.env`

Comando executado:

```powershell
git log --all --full-history --name-only -- .env
```

```text
(sem saída)
```

## Apêndice B — varredura de possíveis segredos

A varredura imprime apenas caminho, linha e categoria; nunca copia o valor.

- Nenhuma ocorrência de alta confiança encontrada pelos padrões automáticos.

> Limitação: regex não substitui Gitleaks/TruffleHog nem revisão humana. Um resultado vazio não prova ausência absoluta de segredo.
