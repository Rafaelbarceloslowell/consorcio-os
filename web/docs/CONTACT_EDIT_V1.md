# Contact Edit V1

## Objetivo

Permitir que o consultor corrija os dados reais do contato sem editar apenas o texto sugerido pelo R2.

## Fluxos

- Oportunidade originada de lead: abre `/leads/[leadId]/edit` e retorna para a oportunidade após salvar.
- Oportunidade originada de cliente: reutiliza a edição completa já existente em `/clients/[clientId]/edit`.
- Lista de leads: oferece acesso direto a `Editar dados`.

## Campos editáveis do lead

- nome;
- empresa;
- e-mail;
- documento;
- telefone e código do país;
- origem;
- tipo de consórcio;
- crédito e prazo desejados;
- consultor responsável;
- observações.

## Preservações

A atualização do lead não altera status, etapa do funil, score, conversão, memória da conversa, eventos comerciais, Learning Cycle, cadência, Maestro ou WhatsApp.
