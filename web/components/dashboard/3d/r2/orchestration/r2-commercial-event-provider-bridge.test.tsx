// @vitest-environment jsdom

import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react"

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest"

import type {
  CommercialEvent,
} from "@/types/domain"

import {
  publishCommercialEvent,
} from "@/application/use-cases/common/commercial-event-dispatcher"

import {
  R2OrchestrationProvider,
  useR2Orchestration,
} from "./r2-orchestration-provider"

function event(
  workspaceId: string,
  id: string,
): CommercialEvent {
  const now =
    "2026-08-02T17:30:00.000Z"

  return {
    id,
    workspaceId,
    journeyId:
      "journey-test",
    type:
      "LEAD_REPLIED",
    actorType:
      "LEAD",
    actorId:
      "lead-test",
    payload: {
      channel:
        "WHATSAPP",
    },
    occurredAt:
      now,
    createdAt:
      now,
    updatedAt:
      now,
  }
}

function Probe() {
  const {
    command,
    decision,
  } = useR2Orchestration()

  return (
    <>
      <output data-testid="runtime-state">
        {command?.runtimeState ?? "none"}
      </output>

      <output data-testid="decision">
        {decision?.decision ?? "none"}
      </output>
    </>
  )
}

afterEach(() => {
  cleanup()
})

describe(
  "R2 commercial event provider bridge",
  () => {
    it(
      "normaliza e apresenta um evento comercial real do mesmo workspace",
      async () => {
        render(
          <R2OrchestrationProvider
            workspaceId="workspace-a"
            userId="user-a"
          >
            <Probe />
          </R2OrchestrationProvider>,
        )

        act(() => {
          publishCommercialEvent(
            event(
              "workspace-a",
              "event-lead-replied",
            ),
          )
        })

        await waitFor(() => {
          expect(
            screen
              .getByTestId(
                "runtime-state",
              )
              .textContent,
          ).toBe(
            "listening",
          )
        })

        expect(
          screen
            .getByTestId(
              "decision",
            )
            .textContent,
        ).toBe(
          "EXECUTE",
        )
      },
    )

    it(
      "ignora eventos pertencentes a outro workspace",
      async () => {
        render(
          <R2OrchestrationProvider
            workspaceId="workspace-a"
            userId="user-a"
          >
            <Probe />
          </R2OrchestrationProvider>,
        )

        await act(async () => {
          publishCommercialEvent(
            event(
              "workspace-b",
              "event-foreign-workspace",
            ),
          )

          await Promise.resolve()
          await Promise.resolve()
        })

        expect(
          screen
            .getByTestId(
              "runtime-state",
            )
            .textContent,
        ).toBe(
          "none",
        )

        expect(
          screen
            .getByTestId(
              "decision",
            )
            .textContent,
        ).toBe(
          "none",
        )
      },
    )
  },
)