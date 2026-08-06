import {
  describe,
  expect,
  it,
} from "vitest"

import {
  MockMaestroConnector,
} from "@/application/integration/external-crm"

import type {
  DashboardData,
} from "@/types/dashboard"

import {
  applyExternalCrmPilotToDashboard,
} from "./apply-external-crm-pilot-to-dashboard"

import {
  buildExternalCrmPilotView,
} from "./build-external-crm-pilot-view"

const dashboardData: DashboardData = {
  workspaceId:
    "workspace-1",
  user: {
    id:
      "consultant-1",
    name:
      "Rafael",
  },
  summary:
    "Entre em contato com Alex Lima.",
  metrics: {
    newLeads:
      1,
    meetingsToday:
      0,
    monthlySales:
      0,
    pendingTasks:
      1,
  },
  meetings: [],
  tasks: [
    {
      id:
        "task-alex",
      title:
        "Entrar em contato com Alex Lima",
      time:
        "09:00",
      priority:
        "high",
    },
  ],
  pipeline: [],
  opportunities: [],
  intelligence: {
    criticalCount:
      1,
    importantCount:
      0,
    monitoringCount:
      0,
    unpreparedMeetings:
      0,
    staleOpportunities:
      0,
    pipelineValue:
      500000,
    nextAction:
      "Entrar em contato com Alex Lima",
    topOpportunity: {
      id:
        "lead-alex",
      name:
        "Alex Lima",
      value:
        500000,
      score:
        90,
    },
  },
  gorilaR2: {
    greeting:
      "R2 em atividade",
    analysis:
      "Análise anterior.",
    recommendation:
      "Falar com Alex Lima.",
    reason:
      "Motivo anterior.",
    confidence:
      "medium",
    generatedAt:
      "2026-08-05T20:00:00.000Z",
  },
}

async function buildScenario(
  scenarioId:
    | "NEW_LEAD_CHECK_1"
    | "NO_RESPONSE_CHECK_3"
    | "OVERDUE_ACTIONS"
    | "CADENCE_PAUSED_NEXT_ACTION"
    | "MEETING_SCHEDULED"
    | "CADENCE_COMPLETED",
) {
  return buildExternalCrmPilotView({
    connector:
      new MockMaestroConnector(
        scenarioId,
      ),
    scenarioId,
  })
}

describe(
  "applyExternalCrmPilotToDashboard",
  () => {
    it(
      "preserva o dashboard quando não existe simulação",
      () => {
        expect(
          applyExternalCrmPilotToDashboard({
            dashboardData,
            externalCrmPilot:
              undefined,
          }),
        ).toBe(
          dashboardData,
        )
      },
    )

    it(
      "substitui o briefing antigo pelo lead com ações atrasadas",
      async () => {
        const externalCrmPilot =
          await buildScenario(
            "OVERDUE_ACTIONS",
          )

        const result =
          applyExternalCrmPilotToDashboard({
            dashboardData,
            externalCrmPilot,
          })

        expect(
          result.summary,
        ).toContain(
          "5 ações do Check 2 estão atrasadas para Lead com ações atrasadas",
        )
        expect(
          result.summary,
        ).not.toContain(
          "Alex Lima",
        )
        expect(
          result.tasks[0]?.title,
        ).toBe(
          "Concluir 5 ações atrasadas de Lead com ações atrasadas",
        )
        expect(
          result.gorilaR2,
        ).toMatchObject({
          greeting:
            "R2 alinhado ao Maestro simulado",
          confidence:
            "high",
          nextAction: {
            title:
              "Concluir 5 ações atrasadas de Lead com ações atrasadas",
            priority:
              "high",
          },
        })
        expect(
          result.intelligence
            ?.topOpportunity,
        ).toBeUndefined()
      },
    )

    it(
      "prioriza o próximo passo sem mandar executar ligação pausada",
      async () => {
        const externalCrmPilot =
          await buildScenario(
            "CADENCE_PAUSED_NEXT_ACTION",
          )

        const result =
          applyExternalCrmPilotToDashboard({
            dashboardData,
            externalCrmPilot,
          })

        expect(
          externalCrmPilot.nextAction,
        ).toBeNull()
        expect(
          result.summary,
        ).toContain(
          "Execute o próximo passo oficial antes de qualquer nova tentativa",
        )
        expect(
          result.tasks[0],
        ).toMatchObject({
          title:
            "Cumprir próximo passo de Lead com próximo passo",
          time:
            "15:00",
          priority:
            "medium",
        })
        expect(
          result.gorilaR2
            ?.recommendation,
        ).not.toContain(
          "ligação",
        )
      },
    )

    it(
      "coloca a preparação da reunião como próxima ação principal",
      async () => {
        const externalCrmPilot =
          await buildScenario(
            "MEETING_SCHEDULED",
          )

        const result =
          applyExternalCrmPilotToDashboard({
            dashboardData,
            externalCrmPilot,
          })

        expect(
          externalCrmPilot.nextAction,
        ).toBeNull()
        expect(
          result.summary,
        ).toContain(
          "reunião com Lead com reunião",
        )
        expect(
          result.tasks[0],
        ).toMatchObject({
          title:
            "Preparar reunião com Lead com reunião",
          time:
            "15:00",
          priority:
            "high",
        })
      },
    )

    it(
      "não recomenda novo contato quando a cadência terminou",
      async () => {
        const externalCrmPilot =
          await buildScenario(
            "CADENCE_COMPLETED",
          )

        const result =
          applyExternalCrmPilotToDashboard({
            dashboardData,
            externalCrmPilot,
          })

        expect(
          result.summary,
        ).toContain(
          "não recomenda novos contatos",
        )
        expect(
          result.tasks[0],
        ).toMatchObject({
          title:
            "Revisar conclusão da cadência de Lead com cadência concluída",
          priority:
            "low",
        })
      },
    )

    it(
      "não altera o objeto original do dashboard",
      async () => {
        const originalSummary =
          dashboardData.summary
        const originalTaskCount =
          dashboardData.tasks.length

        const externalCrmPilot =
          await buildScenario(
            "NEW_LEAD_CHECK_1",
          )

        applyExternalCrmPilotToDashboard({
          dashboardData,
          externalCrmPilot,
        })

        expect(
          dashboardData.summary,
        ).toBe(
          originalSummary,
        )
        expect(
          dashboardData.tasks,
        ).toHaveLength(
          originalTaskCount,
        )
      },
    )
  },
)
