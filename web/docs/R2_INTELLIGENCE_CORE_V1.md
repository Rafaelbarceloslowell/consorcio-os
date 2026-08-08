# R2 Intelligence Core V1

Data: 2026-08-08
Escopo: piloto standalone do GorillaOS, sem envio automático de mensagens e sem catálogo real sem fonte verificada.

## Objetivo

O R2 Intelligence Core V1 combina quatro capacidades determinísticas para orientar o consultor dentro de uma oportunidade:

1. Commercial Engine: seleciona estratégia, técnicas e próximo passo pelo estágio, intenção, abordagem e sinais observados.
2. Learning Engine V2: agrega evidência persistida e outcomes reais, sempre isolada por workspace e contexto comparável.
3. Best Pattern Engine: identifica padrões com volume mínimo e conversão observável, sem criar ranking nominal de vendedores.
4. Consortium Intelligence Engine: avalia elegibilidade e encaixe apenas com regras verificadas e vigentes.

O orquestrador central está em `application/r2/resolve-r2-intelligence.ts`. Ele não substitui o Decision Engine: uma Next Best Action operacional aberta e vigente continua sendo a ação principal; a inteligência comercial, o aprendizado e o consórcio enriquecem a explicação e a execução.

## Ordem de decisão e guardrails

A precedência é fixa:

1. guardrail;
2. regra comercial rígida;
3. regra de consórcio verificada e vigente;
4. playbook comercial;
5. evidência de aprendizado;
6. apresentação na interface.

O histórico nunca pode liberar uma técnica bloqueada. Prova social exige caso real, semelhante e autorizado. FOMO e custo da inação exigem consequência verdadeira e verificável. Reativação sem contexto recente resulta em `INSUFFICIENT_DATA` e não gera mensagem ao cliente.

## Commercial Engine

`application/opportunity/build-r2-commercial-playbook-recommendation.ts` mantém a fundação do Script Comercial da Seal's e metadados estruturados por técnica: estágios, intenções, pré-requisitos, sinais, contraindicações, risco e objetivos.

O contrato retorna estágio, intenção, estratégia, ação recomendada, pergunta, argumento, próximo passo, riscos, regra de prova social, necessidade de contexto recente e explicação resumida. A seleção é determinística e testável; não há chamada a modelo externo nem alteração automática de prompt.

## Learning Engine V2 e Best Pattern

`application/learning/build-r2-learning-evidence.ts` lê eventos comerciais append-only e aplica:

- isolamento obrigatório por `workspaceId`;
- segmentação por abordagem, estágio, intenção, categoria de ativo e categoria do lead;
- deduplicação por identidade do evento;
- amostra mínima de 10 observações;
- smoothing com prior conservador;
- pesos diferentes para resposta, reunião, proposta, venda e perda;
- ajuste limitado a `[-0.20, +0.20]`;
- confidence e explicação explícitas;
- bloqueio absoluto por guardrail.

Os outcomes já emitidos pelo domínio (`MEETING_COMPLETED`, `PROPOSAL_ACCEPTED`, `SALE_COMPLETED` e estados finais/perdas) são consumidos como evidência automática. O Core não regrava esses outcomes, não treina modelo e não reescreve prompts. O Best Pattern exige contexto comparável e proteção de amostra, privilegiando conversão observada em vez de volume bruto.

## Consortium Intelligence Engine

O catálogo persistido recebeu, de forma aditiva, status, fonte, referência, datas de verificação/vigência, versão, limites de parcela e regra de lance embutido. A migration é `prisma/migrations/20260808193000_add_verified_consortium_catalog_rules/migration.sql`.

O boundary `application/consortium/consortium-catalog-provider.ts` separa obtenção de dados da avaliação. `application/consortium/evaluate-consortium-options.ts` aplica primeiro elegibilidade rígida e somente depois calcula fit. Regras `UNVERIFIED`, `STALE`, fora de vigência ou sem proveniência nunca entram no ranking.

O resultado diferencia dado ausente, regra não verificada e ausência de opção elegível. No máximo três alternativas são apresentadas. O fit não é probabilidade de contemplação, não estima sorteio e não promete prazo. O cadastro em Settings é restrito a `ADMIN`, isolado pelo workspace autenticado, e uma regra `VERIFIED` exige fonte, referência, data de verificação e início de vigência.

## Integração de runtime

`POST /api/opportunities/[opportunityId]/r2-intelligence`:

- exige sessão e workspace válidos;
- restringe a oportunidade ao consultor autenticado;
- ignora Next Best Actions encerradas ou expiradas;
- carrega catálogo e eventos somente do workspace;
- preserva a NBA do Decision Engine quando disponível;
- resolve a inteligência unificada;
- grava memória comercial e observabilidade na mesma transação;
- persiste apenas metadados auditáveis da recomendação, sem copiar a conversa integral;
- retorna análise, mensagem manual opcional e o DTO unificado.

`components/opportunity/opportunity-manual-whatsapp-intake.tsx` consome essa rota e mantém revisão e envio humanos. `components/opportunity/opportunity-r2-intelligence.tsx` exibe ação, técnica, evidência de aprendizado, consórcio, dados faltantes, confiança e alertas. A página de detalhe deixou de usar slug fixo e passou a resolver o workspace pela identidade autenticada.

## Observabilidade

Cada resolução persistida registra `recommendationId`, oportunidade, IDs das técnicas, candidato de consórcio selecionado quando houver, quantidade de evidências, uso efetivo de aprendizado, confiança, warnings e horário. Mensagem recebida e resposta completa permanecem fora desse evento de observabilidade.

## Operação do banco

A alteração de schema é aditiva. O fluxo seguro é:

```powershell
npm exec prisma migrate status
npm exec prisma migrate deploy
```

Não usar `migrate reset`, `db push --force-reset`, drop ou truncate. Catálogos sintéticos ou mocks devem continuar `UNVERIFIED`.

## Limitações declaradas

- `NO_LIVE_ADMINISTRATOR_API`
- `NO_ASSEMBLY_HISTORY_PROVIDER`
- `NO_WHATSAPP_CLOUD_API`
- `NO_VERIFIED_PRODUCTION_CATALOG_SEEDED_BY_THIS_MISSION`

Essas limitações são fronteiras funcionais: não podem ser substituídas por scraping, conhecimento geral, números inventados ou pseudo-probabilidade.
