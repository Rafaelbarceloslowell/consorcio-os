# R2 Intelligence Core V1 — auditoria inicial

Data da auditoria: 2026-08-08  
Branch: `feature/lead-approach-and-seals`  
Baseline: `3795c1e45f97ea80926951832a185db1a7155d6b`  
Validação inicial: 223 arquivos de teste, 2015 testes e build aprovados.

## Escopo e critério

Esta auditoria descreve o estado anterior à implementação do R2 Intelligence Core V1. Os status usados são `EXISTING`, `PARTIAL`, `MISSING`, `DUPLICATED`, `DEAD_CODE` e `NOT_RUNTIME_INTEGRATED`.

Foram inspecionados os fluxos de oportunidade, WhatsApp manual, aprendizado, decisão, dashboard, eventos comerciais, reunião, proposta, venda, repositórios Prisma, schema, APIs, Settings, Market Intelligence e documentação existente.

## COMMERCIAL_ENGINE_CURRENT_STATE

Status geral: **PARTIAL**.

- **EXISTING / runtime manual:** `application/opportunity/build-r2-commercial-playbook-recommendation.ts` contém a fundação `seals_commercial_script`, 21 técnicas, seleção determinística por estágio/intenção e guardrails explícitos. É consumido por `components/opportunity/opportunity-manual-whatsapp-intake.tsx`.
- **EXISTING:** `application/opportunity/analyze-manual-whatsapp-message.ts` classifica intenção, estágio, objeções e sinais de reativação. `application/opportunity/build-manual-whatsapp-reply.ts` produz uma resposta editável, sem envio automático.
- **EXISTING:** prova social é bloqueada até confirmação de caso real, semelhante e autorizado. FOMO ético proíbe urgência, escassez, prazo e contemplação inventados.
- **PARTIAL:** os metadados centralizados das técnicas possuem apenas `id`, `label`, `purpose` e `guardrail`; não registram de forma estruturada estágios, intenções, pré-requisitos, sinais, contraindicações, risco e objetivos.
- **PARTIAL:** o output atual expõe fundação, técnica principal, apoio, fechamento, objetivo, justificativa, orientação, CTA, itens a evitar e prova social. Faltam campos explícitos para estágio, intenção, pergunta, argumento, próximo passo, riscos e um resumo de explicação com contrato estável.
- **PARTIAL:** a reativação depende de texto informado na UI, mas ainda não existe um resultado estruturado que bloqueie toda sugestão quando o texto não contém histórico recente suficiente.
- **NOT_RUNTIME_INTEGRATED:** o playbook não enriquece o Decision Engine nem o Next Best Action; ele existe somente no fluxo manual da oportunidade.
- **EXISTING:** `docs/R2_COMMERCIAL_PLAYBOOK_V1.md` documenta a V1, mas não cobre aprendizado, consórcio ou orquestração unificada.

## LEARNING_ENGINE_CURRENT_STATE

Status geral: **PARTIAL / NOT_RUNTIME_INTEGRATED**.

- **EXISTING:** `application/learning/build-r2-learning-observation.ts` normaliza sugestão, mensagem enviada, resposta, outcome, intenção, estágio, objetivo e sinal. O registro mantém revisão humana obrigatória e proíbe atualização automática do modelo.
- **EXISTING / persistent:** `app/api/opportunities/[opportunityId]/learning-observations/route.ts` autentica usuário, restringe workspace e consultor e persiste a observação como `CommercialEvent` append-only com categoria `r2_learning_observation_recorded`.
- **EXISTING / runtime capture:** `components/opportunity/opportunity-r2-learning-cycle.tsx` permite registrar o que foi sugerido, enviado e observado. `app/opportunities/[opportunityId]/learning/page.tsx` recupera a memória comercial persistida.
- **PARTIAL:** a taxonomia V1 não representa de forma uniforme todos os eventos do domínio (`MEETING_COMPLETED`, `PROPOSAL_ACCEPTED`, perda de venda etc.) e ainda usa nomes próximos, mas não idênticos, aos `CommercialEventType` de `prisma/schema.prisma`.
- **MISSING:** não há agregador de evidência, amostra mínima, smoothing/prior, segmentação por contexto, clamp, ajuste de ranking, confidence ou explicação de evidência insuficiente.
- **MISSING:** não há captura automática/idempotente dos eventos reais já emitidos por `application/use-cases/meeting/`, `application/use-cases/proposal/`, `application/use-cases/sale/`, `app/agenda/` e `app/proposals/actions.ts`.
- **NOT_RUNTIME_INTEGRATED:** nenhum consumidor consulta eventos de aprendizado para alterar conservadoramente uma recomendação comercial.
- **EXISTING:** `docs/R2_LEARNING_CYCLE_V1.md` descreve corretamente a coleta V1 como revisão, não treinamento autônomo.

## BEST_SELLER_LEARNING_CURRENT_STATE

Status geral: **MISSING**.

- Não existe read model que responda quais técnicas ou sequências performam melhor em contexto comparável.
- Não existe proteção por tamanho de amostra, conversão por etapa, isolamento agregado por workspace ou comparação entre volume e eficiência.
- Não existe ranking nominal de vendedores; isso evita leaderboard indevido, mas também não há ainda aprendizado agregado com padrões dos melhores resultados.
- Os dados necessários estão parcialmente disponíveis em `CommercialEvent.payload`, `CommercialJourney`, `Meeting`, `Proposal`, `Sale` e na observação V1, mas não são agregados.

## CONSORTIUM_ENGINE_CURRENT_STATE

Status geral: **PARTIAL / NOT_RUNTIME_INTEGRATED**.

- **EXISTING:** `types/domain/consortium.ts` e o model `Consortium` em `prisma/schema.prisma` representam administradora, grupo, tipo, faixas de crédito, prazo, taxas, cotas e status operacional.
- **EXISTING / workspace scoped:** `infrastructure/prisma/repositories/prisma-consortium-repository.ts` e `infrastructure/prisma/mappers/consortium-mapper.ts` fazem leitura e escrita isoladas por workspace. `repositories/crm/async-crm-repositories.ts` expõe o catálogo pelo boundary genérico de CRM.
- **EXISTING / operational:** `app/proposals/new/page.tsx`, `app/proposals/new/actions.ts`, `app/proposals/actions.ts` e `application/sale/close-sale.ts` usam o catálogo para criar proposta e venda e validam faixa, status e disponibilidade operacional.
- **PARTIAL:** o model atual mistura grupo/cota operacional com catálogo inteligente; não há entidade/contrato de regra versionada.
- **MISSING:** não existem `source`, `verifiedAt`, `effectiveFrom`, `effectiveUntil` nem status `VERIFIED`, `STALE` ou `UNVERIFIED` no catálogo.
- **MISSING:** não existe `ConsortiumCatalogProvider` dedicado, evaluator de elegibilidade, score de encaixe, `missingData`, warnings de freshness ou separação formal entre dado, inferência, estratégia e hipótese.
- **MISSING:** não existe manutenção segura do catálogo por master/admin no Settings. O `app/settings/page.tsx` atual resolve workspace e consultor por valores fixos e não oferece catálogo.
- **NOT_RUNTIME_INTEGRATED:** oportunidade, WhatsApp manual, briefing e Decision Engine não consultam o catálogo.
- **SAFETY FINDING:** `data/mock-crm.ts` contém números fictícios para testes/mock. `prisma/seed.ts` não semeia consórcios. Esses mocks não podem ser promovidos a regras verificadas nem usados como catálogo real do R2.

## R2_ORCHESTRATION_CURRENT_STATE

Status geral: **MISSING / NOT_RUNTIME_INTEGRATED**.

- **EXISTING:** `engine/decision/` implementa contexto, validação, diagnóstico, estratégia, recomendação e automação. `application/decision/run-decision-engine.ts`, `refresh-next-best-actions.ts`, `run-commercial-decision-cycle.ts` e `get-next-best-actions.ts` preservam prioridade operacional e persistência de NBA.
- **EXISTING / dashboard runtime:** `application/dashboard/get-async-dashboard-data.ts` carrega as ações operacionais. O dashboard Standalone não depende do Maestro.
- **MISSING:** não existe DTO ou serviço central que combine contexto, playbook, catálogo de consórcio, evidência de aprendizado, best pattern, warnings, missing data, confidence e explicação.
- **NOT_RUNTIME_INTEGRATED:** `application/opportunity/get-opportunity-details-async.ts` carrega contexto, memória, timeline, perguntas e briefing, mas não carrega NBA ou inteligência unificada.
- **PARTIAL:** `components/opportunity/opportunity-details.tsx` mostra o fluxo manual e o link de aprendizado, porém não recebe uma recomendação R2 unificada.
- **DUPLICATED:** existem camadas de domínio legadas em `application/meeting/`, `application/proposal/` e `application/sale/` e casos de uso orquestrados em `application/use-cases/meeting/`, `application/use-cases/proposal/` e `application/use-cases/sale/`. O runtime usa combinações dessas camadas; elas não devem ser reescritas nesta missão.
- **DEAD_CODE / historical artifacts:** relatórios em `blender/r2-rig/` são evidência histórica de integração, não código de runtime.

## Segurança, isolamento e observabilidade

- **EXISTING:** `lib/auth/get-authenticated-commercial-context.ts` fornece identidade autenticada e APIs do R2 usam workspace/consultant scoping.
- **PARTIAL:** algumas páginas operacionais, inclusive detalhe da oportunidade e Settings, ainda resolvem o workspace por slug fixo. Novas rotas do Core não podem repetir esse padrão.
- **EXISTING:** as tabelas comerciais têm `workspaceId` e índices de isolamento.
- **MISSING:** não há persistência de `recommendationId`, técnicas, evidência aplicada, candidato de consórcio, confidence e warnings como um contexto unificado auditável.
- **EXISTING boundary:** Market Intelligence em `application/market-intelligence/` é macroeconômica e já declara que Selic não é taxa final nem regra de produto. Deve permanecer separada das regras de administradora.

## Gaps que bloqueiam a definição de pronto

1. Completar contrato e metadados determinísticos do Commercial Engine e bloquear reativação sem contexto.
2. Agregar observações por workspace e contexto, com amostra mínima, smoothing, clamp e guardrails.
3. Criar read model de padrões com métricas de conversão e proteção de amostra.
4. Estender o catálogo de forma aditiva com proveniência, versionamento e freshness; nunca converter mocks em dados reais.
5. Criar provider e evaluator de consórcio que aceitem somente regras verificadas atuais para elegibilidade/ranking.
6. Criar orquestrador central e integrá-lo ao detalhe da oportunidade e ao WhatsApp manual sem substituir o NBA existente.
7. Consumir outcomes reais de forma idempotente e registrar contexto de recomendação sem conteúdo sensível integral.
8. Expor manutenção mínima do catálogo somente a ADMIN, preservando workspace isolation.

## Limitações externas reconhecidas desde o início

- `NO_LIVE_ADMINISTRATOR_API`
- `NO_ASSEMBLY_HISTORY_PROVIDER`
- `NO_WHATSAPP_CLOUD_API`
- `NO_VERIFIED_PRODUCTION_CATALOG_SEEDED_BY_THIS_MISSION`

Essas limitações não autorizam preenchimento por conhecimento geral, scraping, pseudo-probabilidade ou promessa de contemplação.

## Estado depois da implementação

Status geral: **RUNTIME_INTEGRATED**, condicionado à validação final de suíte, build e staging registrada na missão.

- **COMMERCIAL ENGINE COMPLETED:** metadados e output foram estruturados; a reativação sem contexto recente bloqueia a mensagem ao cliente.
- **LEARNING V2 COMPLETED:** o read model aplica segmentação, amostra mínima 10, smoothing, clamp, confidence, deduplicação e guardrails sobre eventos persistidos e outcomes reais.
- **BEST PATTERN COMPLETED:** padrões comparáveis exigem amostra mínima e conversão observável, sem leaderboard nominal.
- **CONSORTIUM ENGINE COMPLETED:** catálogo aditivo com fonte, versão e freshness; provider dedicado; elegibilidade antes do fit; manutenção somente por ADMIN; mocks permanecem não verificados.
- **ORCHESTRATOR COMPLETED:** o DTO unificado combina contexto comercial, aprendizagem, catálogo, warnings, missing data, confidence e explicação, preservando a NBA operacional existente.
- **OPPORTUNITY RUNTIME INTEGRATED:** a análise manual autenticada usa o orquestrador, apresenta a inteligência ao consultor e grava somente observabilidade segura.
- **AUTH IMPROVED:** o detalhe da oportunidade usa o workspace da identidade autenticada em vez do slug fixo legado.
- **MARKET BOUNDARY PRESERVED:** inteligência macroeconômica continua separada das regras de administradora.

A arquitetura final e os contratos operacionais estão documentados em `docs/R2_INTELLIGENCE_CORE_V1.md`.
