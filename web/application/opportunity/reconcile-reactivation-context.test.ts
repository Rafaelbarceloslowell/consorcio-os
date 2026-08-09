import {
  describe,
  expect,
  it,
} from "vitest"

import {
  reconcileReactivationContext,
} from "./reconcile-reactivation-context"

describe(
  "reconcileReactivationContext",
  () => {
    it(
      "bloqueia conflito entre conversa interrompida e nunca respondeu",
      () => {
        const result =
          reconcileReactivationContext({
            savedContext:
              "Já apresentei o produto e fiz duas propostas. Depois disso ele não me respondeu mais.",
            currentObservation:
              "Ele não me respondeu.",
          })

        expect(
          result.status,
        ).toBe("CONFLICT")

        expect(
          result.effectiveContext,
        ).toBeNull()

        expect(
          result.proposedContext,
        ).toContain(
          "Correção do consultor:",
        )
      },
    )

    it(
      "mantem fatos anteriores quando a nova observacao nao contradiz o contexto",
      () => {
        const result =
          reconcileReactivationContext({
            savedContext:
              "Apresentei uma proposta e depois ele parou de responder.",
            currentObservation:
              "Quero retomar hoje.",
          })

        expect(
          result.status,
        ).toBe("CONSISTENT")

        expect(
          result.effectiveContext,
        ).toContain(
          "Apresentei uma proposta",
        )
      },
    )

    it(
      "pede mais contexto quando nao existe base suficiente",
      () => {
        const result =
          reconcileReactivationContext({
            savedContext:
              null,
            currentObservation:
              "Oi",
          })

        expect(
          result.status,
        ).toBe("INSUFFICIENT")
      },
    )

    it(
      "da prioridade ao contexto confirmado pelo consultor",
      () => {
        const result =
          reconcileReactivationContext({
            savedContext:
              "Cliente nunca respondeu.",
            currentObservation:
              "Já conversei com ele, apresentei a estratégia e depois ele parou de responder.",
            consultantConfirmed:
              true,
          })

        expect(
          result.status,
        ).toBe("CONSISTENT")

        expect(
          result.effectiveContext,
        ).toContain(
          "apresentei a estratégia",
        )
      },
    )
  },
)
