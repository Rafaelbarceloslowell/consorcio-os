// @vitest-environment jsdom

import {
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
  vi,
} from "vitest"

import {
  R2OrchestrationProvider,
  useR2Orchestration,
} from "./r2-orchestration-provider"

function Probe() {
  const {
    command,
  } = useR2Orchestration()

  return (
    <output data-testid="runtime-state">
      {command?.runtimeState ?? "none"}
    </output>
  )
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe(
  "R2 persistent commercial event provider",
  () => {
    it(
      "busca evento persistido e o entrega ao orquestrador do navegador",
      async () => {
        const fetchImpl = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            Response.json({
              events: [
                {
                  id:
                    "event-opportunity-created",
                  workspaceId:
                    "workspace-a",
                  journeyId:
                    "opportunity-1",
                  type:
                    "OPPORTUNITY_CREATED",
                  actorType:
                    "CONSULTANT",
                  actorId:
                    "user-a",
                  payload: {
                    opportunityId:
                      "opportunity-1",
                  },
                  occurredAt:
                    "2026-08-02T22:30:00.000Z",
                  createdAt:
                    "2026-08-02T22:30:00.000Z",
                  updatedAt:
                    "2026-08-02T22:30:00.000Z",
                },
              ],
              nextCursor: {
                createdAt:
                  "2026-08-02T22:30:00.000Z",
                eventId:
                  "event-opportunity-created",
              },
              hasMore: false,
            }),
          )

        vi.stubGlobal(
          "fetch",
          fetchImpl,
        )

        render(
          <R2OrchestrationProvider
            workspaceId="workspace-a"
            userId="user-a"
            persistentEventsEnabled
          >
            <Probe />
          </R2OrchestrationProvider>,
        )

        await waitFor(() => {
          expect(
            screen
              .getByTestId(
                "runtime-state",
              )
              .textContent,
          ).toBe("working")
        })

        expect(fetchImpl).toHaveBeenCalledTimes(1)
      },
    )
  },
)
