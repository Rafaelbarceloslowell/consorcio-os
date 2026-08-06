import {
  MOCK_MAESTRO_SCENARIO_IDS,
  MockMaestroConnector,
} from "@/application/integration/external-crm"

import type {
  MockMaestroScenarioId,
} from "@/application/integration/external-crm"

import type {
  ExternalCrmPilotView,
} from "@/types/external-crm-pilot"

import {
  buildExternalCrmPilotView,
} from "./build-external-crm-pilot-view"

export type MockMaestroScenarioSearchParam =
  | string
  | string[]
  | undefined

function firstSearchParamValue(
  value: MockMaestroScenarioSearchParam,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function resolveMockMaestroScenarioId({
  scenario,
  nodeEnvironment,
}: {
  scenario:
    MockMaestroScenarioSearchParam
  nodeEnvironment:
    string | undefined
}): MockMaestroScenarioId | null {
  if (
    nodeEnvironment ===
    "production"
  ) {
    return null
  }

  const normalizedScenario =
    firstSearchParamValue(
      scenario,
    )
      ?.trim()
      .toUpperCase()

  if (!normalizedScenario) {
    return null
  }

  return MOCK_MAESTRO_SCENARIO_IDS.find(
    (candidate) =>
      candidate ===
      normalizedScenario,
  ) ?? null
}

export async function loadMockMaestroPilotView({
  scenario,
  nodeEnvironment,
}: {
  scenario:
    MockMaestroScenarioSearchParam
  nodeEnvironment:
    string | undefined
}): Promise<ExternalCrmPilotView | undefined> {
  const scenarioId =
    resolveMockMaestroScenarioId({
      scenario,
      nodeEnvironment,
    })

  if (!scenarioId) {
    return undefined
  }

  return buildExternalCrmPilotView({
    connector:
      new MockMaestroConnector(
        scenarioId,
      ),
    scenarioId,
  })
}
