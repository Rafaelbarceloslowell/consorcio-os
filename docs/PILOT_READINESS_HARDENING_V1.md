# GorillaOS — Pilot Readiness Hardening V1

Registro operacional dos três bloqueadores tratados antes do piloto: recuperação da base Data Crazy, integridade do Market Pulse e entrega persistente das notificações R2. Escopo exclusivo de staging; produção e `main` permanecem fora desta missão.

## Data Crazy

### Fonte e auditoria

- Fonte comprovada: PostgreSQL local `localhost:5432`, banco `consorcio_os`, tabelas `public.leads` e `public.pipeline_stages`.
- Critério de proveniência: stage legado `Reativação Data Crazy` ou marcador de importação Data Crazy preservado nas notas.
- Linhas encontradas: 310.
- Contatos legítimos recuperáveis: 309.
- Fixture conhecida excluída: 1 (`Janaina Rodrigues`).
- Linha que exige revisão: 1, com apenas nove dígitos de telefone e sem DDI/DDD inferível com segurança.
- Linhas seguras importadas: 308, com 308 telefones normalizados únicos e 230 e-mails utilizáveis únicos.
- Duplicatas detectadas no dry-run inicial: 0.

### Importação

O comando `npm run data-crazy:import` é dry-run por padrão. A escrita exige `--execute` e três vínculos explícitos: origem, destino e e-mail do usuário alvo. O importador resolve o usuário verificado, o workspace ativo e o consultor ativo no próprio destino; nenhum ID de QA é hardcoded.

O processo usa lock transacional, normalização conservadora de telefone, deduplicação por Data Crazy ID/telefone/e-mail e não sobrescreve contatos existentes. O reprocessamento é idempotente. A execução no Neon staging criou 308 leads; a repetição manteve as contagens inalteradas.

Os leads entram em `Backlog Data Crazy`, sem jornada, tarefa ou Active Workset. `approachType = null` representa a triagem pendente já suportada pelo domínio. Na tela de Leads, o consultor escolhe explicitamente `Novo` ou `Reativação`; somente então nasce a jornada. A opção de reativação continua passando pelo `REACTIVATION_ALWAYS_CONTEXT_GATE`.

Contagens validadas após a importação: 311 leads totais no staging, 308 no backlog Data Crazy, 308 sem classificação, zero jornadas e zero tarefas para a base importada. Os três registros QA preexistentes foram preservados.

## Market Pulse

Cada indicador conserva nome da fonte, URL oficial, data de referência, instante de coleta e estado `stale`, usando a estrutura de proveniência já existente. Os dados continuam vindo das APIs oficiais do Banco Central; os CTAs apontam para páginas oficiais humanas específicas de cada série, em nova aba, com `noopener noreferrer`, nome acessível e foco visível.

Uma URL ausente não é inventada: o card mostra a indisponibilidade da referência e não renderiza link falso. A data de referência `YYYY-MM-DD` é uma data civil e agora é formatada por rearranjo dos componentes, sem conversão para `Date`/UTC. Foram cobertos `01/06/2026`, `31/05/2026` e `01/01/2026`.

O comportamento seguro foi preservado: valor antigo permanece identificado como último valor conhecido; falha sem LKG resulta em indisponibilidade; valores futuros são rejeitados. No smoke real de 9 de agosto de 2026, o indicador de consórcios respondeu como stale com referência de dezembro de 2025. A série Selic retornou uma observação futura e foi corretamente recusada; as séries de crédito não responderam dentro do limite, portanto nenhum valor foi inventado.

## Notificações R2

### Fonte de verdade e ciclo de vida

A atividade persistida em PostgreSQL continua sendo a fonte de verdade. `r2_notifications` registra prioridade, destino, vencimento comercial original, vencimento da entrega, snooze, leitura, resolução, cancelamento, entrega nativa e versão de entrega. A migration é pequena, forward-only e preserva notificações anteriores.

Ao carregar a Daily Mission, tarefas vencidas geram notificações idempotentes por `task_id`. Reload, restart e cold start voltam a consultar o banco. Tarefa concluída resolve a notificação; tarefa cancelada/supersedida cancela a notificação; uma oportunidade encerrada por venda também cancela alertas incompatíveis. O guardrail `DO_NOT_CONTACT` já cancela as tarefas abertas e, por consequência, suas notificações.

### Entrega e deduplicação

O cliente consulta a API a cada 30 segundos e também em `focus` e `visibilitychange`. Um alerta nativo só é tentado com permissão concedida quando `document.hidden` é verdadeiro ou a janela não tem foco. Com GorillaOS em foco, a central in-app é priorizada.

Antes de abrir o popup, cada aba precisa adquirir um `CLAIM` atômico no PostgreSQL para a versão da entrega. Apenas uma atualização de `native_delivered_at IS NULL` vence, eliminando popup duplicado entre abas e persistindo a deduplicação após reload.

O conteúdo nativo é deliberadamente genérico e não expõe CPF, documento, detalhes financeiros ou conversa. O deep link aponta para a oportunidade e para `#r2-action-controls`; o gate de reativação não é contornado.

### Permissão, central e snooze

A permissão nunca é solicitada no primeiro paint. O usuário aciona `Ativar notificações do R2`; a interface diferencia concedida, bloqueada, não configurada e navegador sem suporte. Negar permissão não afeta a central in-app.

A central mostra não lidas relevantes, prioridade, horário e destino, com ações para abrir, marcar como lida e adiar por 10 ou 30 minutos. Snooze altera somente `delivery_due_at`/`snoozed_until`, incrementa a versão e libera nova entrega; `original_due_at` e o `Task.dueAt` permanecem imutáveis.

## Validação local

- Baseline estabilizado: `1d09d1c`.
- Data Crazy: `955f0ee`.
- Market Pulse: `e74ea74`.
- Notificações R2: `b886755`.
- Testes finais: 239 arquivos, 2.132 testes, zero falhas.
- TypeScript e lint focado: aprovados.
- Build Next.js de produção: aprovado.
- Migration PostgreSQL local: aplicada com `prisma migrate deploy`.

## Operação e rollback

No staging, aplicar migrations com `npx prisma migrate deploy` antes de servir o novo runtime. Não usar reset ou force-reset. Depois validar liveness, readiness, login Google, workspace, paginação/triagem dos leads, fontes do Market Pulse e notificações somente com registros QA isolados.

Rollback de código: selecionar o deployment staging anterior. A migration apenas adiciona colunas e índice, por isso pode permanecer durante o rollback sem afetar o runtime antigo. Não apagar a base importada no rollback automático; qualquer reversão de dados exige auditoria separada por proveniência e aprovação explícita.

## Limitações explícitas

- `NO_WHATSAPP_CLOUD_API`.
- `NO_AUTOMATIC_INBOUND_MESSAGE_CAPTURE`.
- `NO_AUTOMATIC_OUTBOUND_WHATSAPP`.
- `NO_LIVE_GOOGLE_CALENDAR_PROVIDER`, enquanto não houver provider confirmado.
- `BACKGROUND_PUSH_WHEN_BROWSER_CLOSED=PENDENTE`: não há Push API, Service Worker, subscription persistente e backend push. O piloto cobre GorillaOS aberto em outra aba, minimizado ou sem foco.
- `NO_LIVE_ADMINISTRATOR_API`.
- `NO_ASSEMBLY_HISTORY_PROVIDER`.
