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
  user: {
    id:
      "consultant-1",
    name:
      "Rafael",
  },
  summary:
    "Resumo anterior",
  metrics: {
    newLeads: 0,
    meetingsToday: 0,
    monthlySales: 0,
    pendingTasks: 0,
  },
  meetings: [],
  tasks: [],
  pipeline: [],
  intelligence: {
    criticalCount: 0,
    importantCount: 0,
    monitoringCount: 0,
    unpreparedMeetings: 0,
    staleOpportunities: 0,
    pipelineValue: 0,
  },
}

describe(
  "piloto de resposta positiva na reativação",
  () => {
    it(
      "encerra a reativação, bloqueia Checks e sincroniza o briefing principal",
      async () => {
        const view =
          await buildExternalCrmPilotView({
            connector:
              new MockMaestroConnector(
                "REACTIVATION_POSITIVE_RESPONSE",
              ),
            scenarioId:
              "REACTIVATION_POSITIVE_RESPONSE",
          })

        expect(view).toMatchObject({
          nextAction:
            null,
          reactivation: {
            positiveResponseHandled:
              true,
            sequenceStopped:
              true,
            serviceState:
              "ACTIVE_CONVERSATION",
            checksBlocked:
              true,
            resumeRequiresNewNoResponse:
              true,
            resumeRequiresMaestroAuthorization:
              true,
          },
          r2: {
            headline:
              "Resposta positiva na reativação",
          },
        })

        const result =
          applyExternalCrmPilotToDashboard({
            dashboardData,
            externalCrmPilot:
              view,
          })

        expect(result.summary).toContain(
          "respondeu com interesse durante a reativação",
        )
        expect(result.tasks[0]).toMatchObject({
          title:
            "Responder e qualificar Lead reativado com interesse",
          priority:
            "high",
        })
        expect(
          result.gorilaR2
            ?.recommendation,
        ).toContain(
          "definir o próximo passo",
        )
      },
    )
  },
)
