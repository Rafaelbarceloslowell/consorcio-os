import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  DashboardIntelligence,
} from "@/types/dashboard"

import {
  buildGorilaR2Briefing,
} from "./build-gorilar2-briefing"

function createIntelligence(
  overrides:
    Partial<DashboardIntelligence> = {},
): DashboardIntelligence {
  return {
    criticalCount: 0,
    importantCount: 1,
    monitoringCount: 0,
    unpreparedMeetings: 0,
    staleOpportunities: 0,
    pipelineValue: 0,
    ...overrides,
  }
}

describe(
  "buildGorilaR2Briefing",
  () => {
    it(
      "reconhece um retorno futuro em vez de declarar operação estável",
      () => {
        const result =
          buildGorilaR2Briefing({
            intelligence:
              createIntelligence({
                nextAction:
                  "Retornar contato com Rosecleia",
                scheduledFollowUp: {
                  taskId: "task-1",
                  title:
                    "Retornar contato com Rosecleia",
                  contactName:
                    "Rosecleia",
                  dueAt:
                    "2026-08-04T16:10:00.000Z",
                  dateLabel:
                    "amanhã",
                  time: "13:10",
                },
              }),
          })

        expect(result).toMatchObject({
          greeting:
            "Retorno agendado. O R2 está acompanhando o horário.",
          analysis:
            "Próximo contato com Rosecleia marcado para amanhã às 13:10.",
          recommendation:
            "Retornar contato com Rosecleia",
        })

        expect(result.reason).toContain(
          "Retorno: amanhã às 13:10",
        )
      },
    )

    it(
      "mantém uma ação crítica acima de um retorno futuro",
      () => {
        const result =
          buildGorilaR2Briefing({
            intelligence:
              createIntelligence({
                criticalCount: 1,
                nextAction:
                  "Resolver pendência crítica",
                scheduledFollowUp: {
                  taskId: "task-1",
                  title:
                    "Retornar contato com Rosecleia",
                  contactName:
                    "Rosecleia",
                  dueAt:
                    "2026-08-04T16:10:00.000Z",
                  dateLabel:
                    "amanhã",
                  time: "13:10",
                },
              }),
          })

        expect(result.greeting).toBe(
          "Atenção. Identifiquei pontos que precisam de decisão hoje.",
        )
        expect(result.recommendation).toBe(
          "Resolver pendência crítica",
        )
      },
    )
  },
)
