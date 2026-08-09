# R2 Commercial Execution Engine V1

## Arquitetura

```text
Decision Engine / R2 Intelligence Core
                ↓
R2 Activity Orchestrator
                ↓
Task persistente + Commitment opcional
                ↓
resultado mínimo registrado pelo consultor
                ↓
Commercial Event + memória + telemetria
                ↓
supersession + próxima atividade
```

`Task` é a fonte de verdade operacional. `dueAt` fica no PostgreSQL; notificações e UI são projeções. Reload, cold start e restart não apagam a fila.

## Ciclo da atividade

Estados operacionais: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` e `SUPERSEDED`. O schema legado mantém `CANCELLED`; `supersededAt` distingue cancelamento por perda de sentido. `idempotencyKey` é único por workspace e impede duplicidade em clique duplo, evento repetido, check, callback e recovery.

## Active Workset

O alvo inicial é 50, não um limite rígido. O resolver preserva oportunidades já trabalhadas ou com compromisso ativo, mesmo acima do alvo, e preenche vagas pela prioridade. Workspace e consultor são filtros obrigatórios.

## Cadência NEW de 7 impactos

Policy central: `application/execution/commercial-execution-policy.ts`.

1. WhatsApp manual, imediato.
2. Ligação após check de 5 minutos sem resposta.
3. WhatsApp em janela comercial posterior.
4. Ligação.
5. WhatsApp.
6. Ligação.
7. WhatsApp e encerramento do ciclo com `NO_RESPONSE_AFTER_CADENCE` se o check não detectar resposta.

Checks não contam como impacto. O clique “Mensagem enviada” conclui o impacto e cria o check; não pergunta imediatamente se houve resposta. Offsets ficam centralizados e passam por cálculo de horas comerciais com proteção de fim de semana.

## Modo manual e reativação

`MANUAL_MESSAGING_MODE`: o R2 não envia WhatsApp e não presume resposta.

Cada novo `reactivationCycleId` exige `ReactivationContext`. Memória antiga não libera o ciclo. Antes do contexto, a única atividade é `REACTIVATION_CONTEXT_REQUIRED` e nenhuma mensagem específica é autorizada. O consultor pode colar contexto, confirmar “Nunca respondeu” ou “Não houve conversa anterior”. O mesmo ciclo não pergunta novamente. Um ciclo futuro volta a exigir contexto. A boundary aceita futuramente `conversationContextSynchronized=true` de provider oficial, sem implementar esse provider agora.

## Compromissos e callbacks

O ledger registra quem prometeu, tipo, data, descrição, status e evento de origem. Compromisso explícito supersede cadência genérica. Callback vencendo tem prioridade urgente. Callback não atendido gera `CALLBACK_RECOVERY`, nunca retorna ao impacto NEW. A mensagem continua manual e o check seguinte pode produzir follow-up estratégico.

## Reuniões e briefing vivo

Reuniões continuam no domínio existente, com `opportunityId` aditivo. O agendamento gera:

- `MEETING_PREP` em T-30 min;
- `MEETING_START` em T-5 min;
- `MEETING_OUTCOME_CHECK` após 10 minutos de tolerância.

O detalhe da oportunidade continua reconstruindo briefing e memória atuais; snapshots não são fonte exclusiva. `NO_SHOW` só pode ser registrado depois da tolerância e gera `NO_SHOW_RECOVERY`. Remarcação supersede preparação antiga e cria nova geração idempotente, mantendo eventos/histórico.

## Memória

Além da memória conversacional existente, o schema aceita `structuredFacts`, `narrativeSummary`, `factProvenance` e `observedAt`. Origens suportadas incluem `manual_context`, `consultant_confirmed`, `system_event`, `meeting_result`, `proposal` e futura sincronização. Inferência não deve ser gravada como fato; conflito ambíguo exige confirmação humana.

## Supersession, stale e compliance

Resposta, callback, reunião e outros compromissos cancelam tarefas genéricas incompatíveis. Venda e do-not-contact cancelam outreach aberto. `DO_NOT_CONTACT` sempre vence Learning e bloqueia novas abordagens.

Uma jornada aberta sem atividade pendente, compromisso futuro ou espera explícita válida é `STALE_OPPORTUNITY`; o refresh da missão diária cria `R2_REVIEW` deduplicado. Jornadas fechadas/terminais não entram no detector.

## Missão diária e notificações

`/api/r2/daily-mission` carrega em consultas agrupadas as tarefas, compromissos, reuniões e contagens necessárias, limitado ao workset. O card mostra agora, próximas, atrasadas e a primeira ação explicada.

`R2Notification` é criada por tarefa vencida com chave única no `taskId`. Negar Web Notifications não afeta a central in-app. Permissão de navegador é solicitada somente por clique explícito.

## Learning telemetry

Eventos e metadados persistem `activityType`, `channel`, `impactNumber`, timestamps e resultados operacionais. Callback, meeting e no-show têm categorias próprias. O Learning Engine V2 continua aplicando isolamento, amostra mínima, smoothing e limites aprovados; este engine registra evidência e não inventa conclusão estatística.

## Futuro WhatsApp/Calendar

Boundaries permanecem abertas para captura inbound, envio outbound e sincronização oficial do contexto. Não existe WhatsApp Cloud API nem Google Calendar provider ativo nesta versão. URL manual de Meet é suportada.

## Limitações

```text
NO_WHATSAPP_CLOUD_API
NO_AUTOMATIC_INBOUND_MESSAGE_CAPTURE
NO_AUTOMATIC_OUTBOUND_WHATSAPP
NO_LIVE_GOOGLE_CALENDAR_PROVIDER
BACKGROUND_PUSH_WHEN_BROWSER_CLOSED=PENDENTE
```
