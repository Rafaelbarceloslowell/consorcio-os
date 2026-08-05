import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  CommercialActorType,
  CommercialEventType,
} from "@/types/domain"

import {
  getCommercialActorTypeLabel,
  getCommercialEventDescription,
  getCommercialEventTypeLabel,
  presentCommercialEvent,
} from "./commercial-event-presenter"

describe(
  "getCommercialEventTypeLabel",
  () => {
    const cases: Array<
      [CommercialEventType, string]
    > = [
      ["LEAD_CREATED", "Lead criado"],
      ["OPPORTUNITY_CREATED", "Oportunidade criada"],
      ["LEAD_REPLIED", "Lead respondeu"],
      ["MEETING_SCHEDULED", "Reunião agendada"],
      ["MEETING_COMPLETED", "Reunião concluída"],
      ["PROPOSAL_SENT", "Proposta enviada"],
      ["PROPOSAL_ACCEPTED", "Proposta aceita"],
      ["DOCUMENT_REQUESTED", "Documento solicitado"],
      ["DOCUMENT_RECEIVED", "Documento recebido"],
      ["PAYMENT_CONFIRMED", "Pagamento confirmado"],
      ["SALE_COMPLETED", "Venda concluída"],
      ["STATE_CHANGED", "Estado alterado"],
      ["NOTE_ADDED", "Nota adicionada"],
      ["TASK_CREATED", "Tarefa criada"],
      ["TASK_COMPLETED", "Tarefa concluída"],
    ]

    it.each(cases)(
      "deve traduzir %s",
      (
        type,
        expectedLabel,
      ) => {
        expect(
          getCommercialEventTypeLabel(
            type,
          ),
        ).toBe(
          expectedLabel,
        )
      },
    )
  },
)

describe(
  "getCommercialActorTypeLabel",
  () => {
    const cases: Array<
      [CommercialActorType, string]
    > = [
      ["LEAD", "Lead"],
      ["CLIENT", "Cliente"],
      ["CONSULTANT", "Consultor"],
      ["AI", "GorilaR2"],
      ["SYSTEM", "Sistema"],
      ["AUTOMATION", "Automação"],
      ["ADMINISTRATOR", "Administrador"],
    ]

    it.each(cases)(
      "deve traduzir %s",
      (
        actorType,
        expectedLabel,
      ) => {
        expect(
          getCommercialActorTypeLabel(
            actorType,
          ),
        ).toBe(
          expectedLabel,
        )
      },
    )
  },
)

describe(
  "getCommercialEventDescription",
  () => {
    it(
      "deve descrever uma mudança de estado usando os nomes",
      () => {
        expect(
          getCommercialEventDescription({
            type: "STATE_CHANGED",
            payload: {
              previousStateName:
                "Negociação",
              targetStateName:
                "Proposta enviada",
            },
          }),
        ).toBe(
          "Negociação → Proposta enviada",
        )
      },
    )

    it(
      "deve descrever uma mudança de estado usando os códigos",
      () => {
        expect(
          getCommercialEventDescription({
            type: "STATE_CHANGED",
            payload: {
              previousStateCode:
                "NEGOTIATION",
              targetStateCode:
                "PROPOSAL_SENT",
            },
          }),
        ).toBe(
          "Negotiation → Proposal sent",
        )
      },
    )

    it(
      "deve descrever uma mudança quando somente o novo estado estiver disponível",
      () => {
        expect(
          getCommercialEventDescription({
            type: "STATE_CHANGED",
            payload: {
              targetStateCode:
                "SALE_COMPLETED",
            },
          }),
        ).toBe(
          "Novo estado: Sale completed",
        )
      },
    )

    it(
      "deve usar a descrição genérica quando não houver estados",
      () => {
        expect(
          getCommercialEventDescription({
            type: "STATE_CHANGED",
            payload: {
              reason:
                "Alteração registrada manualmente.",
            },
          }),
        ).toBe(
          "Alteração registrada manualmente.",
        )
      },
    )

    it(
      "deve utilizar a descrição de um evento genérico",
      () => {
        expect(
          getCommercialEventDescription({
            type: "NOTE_ADDED",
            payload: {
              content:
                "Cliente pediu retorno amanhã.",
            },
          }),
        ).toBe(
          "Cliente pediu retorno amanhã.",
        )
      },
    )

    it(
      "deve ignorar valores vazios e utilizar o próximo campo disponível",
      () => {
        expect(
          getCommercialEventDescription({
            type: "TASK_CREATED",
            payload: {
              description: "   ",
              title:
                "Entrar em contato",
            },
          }),
        ).toBe(
          "Entrar em contato",
        )
      },
    )

    it(
      "deve retornar nulo quando não houver dados descritivos",
      () => {
        expect(
          getCommercialEventDescription({
            type:
              "PAYMENT_CONFIRMED",
            payload: {},
          }),
        ).toBeNull()
      },
    )
  },
)

describe(
  "presentCommercialEvent",
  () => {
    it(
      "deve criar uma apresentação completa do evento",
      () => {
        expect(
          presentCommercialEvent({
            type: "STATE_CHANGED",
            actorType: "AI",
            payload: {
              previousStateName:
                "Proposta enviada",
              targetStateName:
                "Venda concluída",
            },
          }),
        ).toEqual({
          title:
            "Estado alterado",
          description:
            "Proposta enviada → Venda concluída",
          actorLabel:
            "GorilaR2",
        })
      },
    )

    it(
      "deve criar uma apresentação sem descrição",
      () => {
        expect(
          presentCommercialEvent({
            type: "LEAD_CREATED",
            actorType: "SYSTEM",
            payload: {},
          }),
        ).toEqual({
          title: "Lead criado",
          description: null,
          actorLabel: "Sistema",
        })
      },
    )
  },
)
