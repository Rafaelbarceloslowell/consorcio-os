import {
  describe,
  expect,
  it,
} from "vitest"

import {
  analyzeManualWhatsAppMessage,
} from "./analyze-manual-whatsapp-message"

import {
  resolveManualWhatsAppCommercialGoal,
} from "./resolve-manual-whatsapp-commercial-goal"

describe(
  "resolveManualWhatsAppCommercialGoal",
  () => {
    it(
      "não transforma falta de interesse em objetivo de reunião",
      () => {
        const analysis =
          analyzeManualWhatsAppMessage(
            "Nao tenho interesse agora, obrigado.",
            {
              approachType:
                "new",
            },
          )

        expect(
          analysis,
        ).not.toBeNull()

        if (!analysis) {
          throw new Error(
            "Análise esperada para o teste.",
          )
        }

        expect(
          analysis.intent,
        ).toBe(
          "not_interested",
        )

        const goal =
          resolveManualWhatsAppCommercialGoal({
            approachType:
              "new",
            analysis,

            // reproduz o mapeamento atual:
            // call_to_action -> meeting
            stage:
              "meeting",
          })

        expect(
          goal,
        ).toMatchObject({
          goal:
            "understand_objection",
          label:
            "Entender o motivo da decisão",
          explanation:
            "Distinguir adiamento de encerramento definitivo e registrar o desfecho correto sem pressionar o cliente.",
        })

        expect(
          goal.goal,
        ).not.toBe(
          "schedule_meeting",
        )

        expect(
          goal.label,
        ).not.toBe(
          "Confirmar a conversa",
        )
      },
    )

    it(
      "preserva objetivo de reunião quando cliente realmente abre espaço para conversar",
      () => {
        const analysis =
          analyzeManualWhatsAppMessage(
            "Podemos conversar?",
            {
              approachType:
                "new",
            },
          )

        expect(
          analysis,
        ).not.toBeNull()

        if (!analysis) {
          throw new Error(
            "Análise esperada para o teste.",
          )
        }

        expect(
          analysis.intent,
        ).toBe(
          "meeting_interest",
        )

        const goal =
          resolveManualWhatsAppCommercialGoal({
            approachType:
              "new",
            analysis,
            stage:
              "meeting",
          })

        expect(
          goal,
        ).toMatchObject({
          goal:
            "schedule_meeting",
          label:
            "Confirmar a conversa",
        })
      },
    )
  },
)