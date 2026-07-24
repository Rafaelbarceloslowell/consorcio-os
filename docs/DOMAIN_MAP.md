# ConsórcioOS — Domain Map

## Objetivo

Este documento mostra como as principais entidades do ConsórcioOS se relacionam.

O ConsórcioOS não é apenas um CRM.

Ele é um Commercial Engine responsável por acompanhar oportunidades, registrar acontecimentos, aplicar regras e recomendar a próxima melhor ação.

---

## Conceitos centrais

### Lead

Representa uma pessoa que entrou no processo comercial.

Um Lead pode ter várias oportunidades ao longo do tempo.

Exemplo:

- imóvel
- automóvel
- investimento
- caminhão

---

### Client

Representa uma pessoa que já possui pelo menos uma venda ativada.

O Lead só se torna Client após a ativação da venda.

---

### CommercialJourney

Representa uma oportunidade comercial específica.

Exemplo:

- compra de imóvel
- troca de automóvel
- aquisição de caminhão
- planejamento de investimento

A CommercialJourney é o centro do Commercial Engine.

---

### JourneyPhase

Representa uma etapa macro do processo comercial.

Exemplos:

- aquisição
- qualificação
- diagnóstico
- proposta
- negociação
- fechamento
- pós-venda

---

### JourneyState

Representa a situação exata da oportunidade naquele momento.

Exemplos:

- aguardando resposta
- em diagnóstico
- aguardando documentos
- aguardando pagamento
- cliente ativo

---

### CommercialEvent

Representa algo que aconteceu.

Exemplos:

- lead respondeu
- proposta foi enviada
- documento foi recebido
- pagamento foi confirmado

Eventos registram fatos.

---

### CommercialAction

Representa algo que precisa ser feito ou que foi executado.

Exemplos:

- ligar para o lead
- enviar proposta
- solicitar documentos
- fazer follow-up

---

### WorkflowRule

Representa uma regra que decide o que acontece após um evento.

Exemplo:

Se o estado atual for `WAITING_LEAD_RESPONSE`
e o evento for `LEAD_REPLIED`,
então o novo estado será `ENGAGED`.

---

### NextBestAction

Representa a próxima melhor ação recomendada pelo Commercial Engine.

Exemplos:

- ligar agora
- enviar uma nova simulação
- agendar reunião
- solicitar documentos
- pausar a oportunidade

---

### CommercialDiagnosis

Representa o diagnóstico comercial do lead.

Inclui informações como:

- objetivo
- renda
- crédito desejado
- data de nascimento
- lance disponível
- quem participa da decisão

---

### CommercialStrategy

Representa a estratégia comercial criada a partir do diagnóstico.

Pode conter:

- tipo de consórcio recomendado
- valor de crédito
- prazo
- estratégia de lance
- riscos
- objeções previstas
- abordagem sugerida

---

### Proposal

Representa uma proposta comercial apresentada ao lead.

Uma jornada pode possuir várias propostas ao longo do tempo.

---

### Sale

Representa a contratação.

A venda só é considerada concluída quando estiver ativa.

---

## Mapa principal do domínio

```text
Workspace
   │
   ├── Consultant
   │
   ├── Lead
   │      │
   │      └── CommercialJourney
   │              │
   │              ├── JourneyPhase
   │              ├── JourneyState
   │              ├── CommercialEvent
   │              ├── CommercialAction
   │              ├── WorkflowRule
   │              ├── NextBestAction
   │              ├── CommercialDiagnosis
   │              ├── CommercialStrategy
   │              ├── Proposal
   │              └── Sale
   │
   └── Client
          │
          └── CommercialJourney