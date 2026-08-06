# External CRM Dashboard Pilot V1

## Objetivo

Ligar o `MockMaestroConnector` ao dashboard do GorillaOS sem acessar o Maestro real e sem criar uma segunda cadência.

## Ativação local

A simulação só é carregada fora de produção e exige o parâmetro explícito `crmMock`.

Exemplo:

```text
http://localhost:3000/?crmMock=OVERDUE_ACTIONS
```

Cenários disponíveis:

- `NEW_LEAD_CHECK_1`
- `NO_RESPONSE_CHECK_3`
- `OVERDUE_ACTIONS`
- `CADENCE_PAUSED_NEXT_ACTION`
- `MEETING_SCHEDULED`
- `CADENCE_COMPLETED`
- `REACTIVATION_POSITIVE_RESPONSE`

## Comportamento do dashboard

Quando um cenário é selecionado, o GorillaOS sincroniza o briefing principal do R2 com o mesmo lead apresentado no card externo:

- resumo operacional;
- análise do R2;
- recomendação;
- próxima ação;
- primeira tarefa priorizada.

A sincronização é apenas visual e operacional para o piloto. Nenhum dado do Maestro real é acessado ou alterado.

## Regras de segurança

- cadência `PAUSED` não expõe ligação ou mensagem do Check como ação executável;
- reunião agendada substitui a tentativa de contato como compromisso oficial;
- cadência `COMPLETED` não libera nova tentativa;
- resposta positiva durante a reativação encerra a sequência e devolve o lead ao atendimento ativo;
- os Checks só podem retornar após nova ausência de resposta e autorização oficial do Maestro;
- motivos técnicos, como `NEXT_ACTION_DEFINED`, são apresentados em linguagem humana;
- o título informa explicitamente que o Maestro é simulado;
- o mock é bloqueado automaticamente em `NODE_ENV=production`.

## Garantias

- nenhum acesso ao Maestro real;
- somente leitura;
- nenhuma escrita no banco;
- nenhuma alteração da cadência local ou externa;
- nenhum envio de mensagem;
- o R2 interpreta o estado recebido, mas não cria uma regra paralela.

## Fluxo

```text
Query param de desenvolvimento
        ↓
MockMaestroConnector
        ↓
Contrato universal External CRM
        ↓
buildExternalCrmPilotView
        ↓
applyExternalCrmPilotToDashboard
        ↓
Card externo + briefing principal sincronizado
```

## Substituição futura

Quando a API oficial do Maestro estiver disponível, o mock será substituído por um conector HTTP que implemente `ExternalCrmConnector`. A apresentação do dashboard, o modelo universal e a sincronização do briefing permanecem os mesmos.

## Regra de resposta positiva na reativação

```text
Reativação ativa
        ↓
Cliente responde com interesse
        ↓
Encerrar a sequência de reativação
        ↓
Voltar ao atendimento ativo
        ↓
Responder, qualificar e definir o próximo passo
        ↓
Checks bloqueados
        ↓
Nova ausência + autorização do Maestro
        ↓
Nova cadência permitida
```

O GorillaOS não reinicia os Checks apenas porque o cliente respondeu. A resposta positiva cria uma conversa ativa. Uma nova cadência exige uma nova ausência de resposta e autorização explícita da fonte oficial.
