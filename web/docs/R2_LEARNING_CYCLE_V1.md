# R2 Learning Cycle V1

## Objetivo

Registrar evidências reais para que o GorillaOS consiga revisar e aprimorar a inteligência comercial do R2 sem permitir que o modelo altere suas próprias regras automaticamente.

## Dados registrados

Cada observação relaciona:

1. contexto ou mensagem que originou a sugestão;
2. sugestão original produzida pelo R2;
3. mensagem realmente enviada pelo consultor;
4. resposta real do cliente, quando existir;
5. resultado comercial;
6. intenção, estágio e objetivo comercial disponíveis;
7. observações do consultor.

## Regra de segurança

A V1 é um ciclo de coleta e revisão, não um mecanismo de treinamento automático.

Todo registro possui:

- `reviewStatus = PENDING_HUMAN_REVIEW`;
- `humanReviewRequired = true`;
- `automaticModelUpdateApplied = false`.

O sistema nunca:

- envia WhatsApp por esta tela;
- inventa resposta do cliente;
- altera a cadência do Maestro;
- atualiza pesos, prompts ou regras automaticamente;
- acessa o Maestro real;
- grava dados no Maestro.

## Persistência

A observação é armazenada como evento append-only na tabela já existente de eventos comerciais, com a categoria:

`r2_learning_observation_recorded`

Não existe migration nesta versão.

## Fluxo do piloto

1. O R2 analisa a conversa e prepara uma sugestão.
2. O consultor revisa e envia manualmente.
3. Na oportunidade, o consultor abre **Registrar aprendizado R2**.
4. O GorillaOS recupera a última sugestão salva na memória comercial.
5. O consultor informa a mensagem realmente enviada.
6. O consultor registra a resposta e o resultado.
7. O sistema cria uma observação pendente de revisão humana.

## Próximas versões

- painel de revisão das observações;
- métricas por tipo de lead e origem;
- comparação de mensagens com melhor resposta;
- aprovação explícita de novos playbooks;
- integração com timestamps do WhatsApp;
- associação com reunião, proposta e venda reais;
- anonimização para aprendizado organizacional.
