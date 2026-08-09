# R2 Commercial Execution — Audit V1

Baseline auditada em `4dbe9cf`, antes da implementação do Execution Engine V1.

## Classificação

| Capacidade | Estado inicial | Evidência real |
|---|---|---|
| ACTIVE_WORKSET | PARTIAL | `application/dashboard/get-async-dashboard-data.ts` lista oportunidades e tarefas, mas não havia alvo, proteção de compromissos ou preenchimento de capacidade. |
| ACTIVITY_MODEL | PARTIAL | `prisma/schema.prisma` já possuía `Task` com workspace, responsável, status, prioridade e `dueAt`; faltavam oportunidade, cadência, impacto, origem, idempotência e supersession. |
| CADENCE_MODEL | NOT_RUNTIME_INTEGRATED | `engine/decision/automation/cadence.ts`, `scheduler.ts` e `queue.ts` são determinísticos, porém a fila não era a fonte persistente do runtime. |
| CHECK_MODEL | MISSING | Não existia `RESPONSE_CHECK` persistente separado de impacto. |
| FOLLOW_UP_MODEL | PARTIAL | `TaskType.FOLLOW_UP` existia, sem reason/context/objective operacionais. |
| CALLBACK_MODEL | MISSING | Ligações existiam como `TaskType.CALL`, mas sem ledger, prioridade por promessa ou recovery próprio. |
| MEETING_MODEL | EXISTING | `Meeting`, agenda, tipos, status e outcomes já estavam persistidos em `prisma/schema.prisma`, `application/meeting/` e `app/agenda/`. |
| NO_SHOW_MODEL | PARTIAL | `MeetingStatus.NO_SHOW` existia, mas a agenda concluía `NO_ANSWER` como `COMPLETED` e não gerava recovery. |
| COMMERCIAL_MEMORY | PARTIAL | `CommercialConversationMemory` guardava estágio, objetivo, última mensagem e resposta; faltavam fatos estruturados, narrativa, provenance e `observedAt`. |
| NOTIFICATIONS | MISSING | Não havia centro persistente de notificações derivado das atividades. |
| STALE_OPPORTUNITY_DETECTION | PARTIAL | Dashboard contava leads sem contato há 48h; não verificava o invariant ação/compromisso/espera válida por jornada. |
| LEARNING_TELEMETRY | PARTIAL | Learning V2 e eventos existiam, mas sem taxonomia de activity/channel/impact/callback/no-show do execution runtime. |
| REACTIVATION_CONTEXT_GATE | PARTIAL | Commercial Engine bloqueava recomendação sem contexto recente; não havia validade por `reactivationCycleId` persistido. |

## Decisão arquitetural

`Task` foi estendida como atividade operacional. Não foi criada uma entidade `Activity` paralela. A automação existente permanece responsável pela mecânica determinística; o novo orquestrador transforma decisões em `Task` persistente, recebe o resultado mínimo do consultor, emite eventos e recalcula a próxima ação.

Conceitos realmente ausentes foram adicionados de forma aditiva:

- `CommercialCommitment`: promessas de cliente, consultor ou ambos.
- `ReactivationContext`: contexto válido exclusivamente para um ciclo de reativação.
- `R2Notification`: delivery deduplicado derivado da atividade persistida.

## Limites encontrados

- O modo de mensagens é manual; não existe captura inbound ou envio outbound por WhatsApp.
- Não foi encontrada integração Google Calendar/Meet autorizada. Reuniões internas e URL manual continuam válidas.
- Web Notifications funcionam apenas com permissão explícita e navegador aberto. Não existe background push/service worker.
- Premium Earth OS, autenticação e R2 Intelligence Core são preservados.
