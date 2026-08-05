// @vitest-environment jsdom
/// <reference types="vitest/globals" />

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { StrictMode } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"

import type { R2DomainEvent } from "@/types/r2-intelligence-orchestration"
import { R2OrchestrationProvider, useR2Orchestration } from "./r2-orchestration-provider"

function event(eventType: R2DomainEvent["eventType"], eventId: string): R2DomainEvent {
  return {
    eventId,
    eventType,
    occurredAt: "2026-08-01T15:00:00.000Z",
    workspaceId: "workspace-a",
    actorId: "test",
    userId: "user-a",
    entityType: "system",
    entityId: eventId,
    correlationId: eventId,
    causationId: null,
    source: "system",
    payload: {},
    metadata: {},
    urgency: "normal",
    expiresAt: null,
    schemaVersion: 1,
  }
}


afterEach(() => {
  vi.useRealTimers()
})

async function flushAsyncWork() {
  await act(async () => {
    for (
      let index = 0;
      index < 10;
      index += 1
    ) {
      await Promise.resolve()
    }
  })
}

function Probe() {
  const { command, decision, dispatch } = useR2Orchestration()
  return (
    <div>
      <output data-testid="command-state">{command?.runtimeState ?? "none"}</output>
      <output data-testid="decision">{decision?.decision ?? "none"}</output>
      <button type="button" onClick={() => void dispatch(event("lead.created", "provider-working"))}>working</button>
      <button type="button" onClick={() => void dispatch(event("task.created", "provider-queued"))}>queue</button>
    </div>
  )
}

describe("R2OrchestrationProvider", () => {
  it("does not present a queued command before the active presentation completes", async () => {
    render(
      <R2OrchestrationProvider workspaceId="workspace-a" userId="user-a">
        <Probe />
      </R2OrchestrationProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "working" }))
    await waitFor(() => expect(screen.getByTestId("command-state").textContent).toBe("working"))
    fireEvent.click(screen.getByRole("button", { name: "queue" }))
    await waitFor(() => expect(screen.getByTestId("decision").textContent).toBe("QUEUE"))
    expect(screen.getByTestId("command-state").textContent).toBe("working")
  })

  it("keeps the active presentation timer through StrictMode duplicate decisions and later presents the queued command", async () => {
    vi.useFakeTimers()

    render(
      <StrictMode>
        <R2OrchestrationProvider
          workspaceId="workspace-a"
          userId="user-a"
          initialEvent={event(
            "intelligence.recommendation_ready",
            "provider-initial",
          )}
          persistentEventsEnabled={false}
        >
          <Probe />
        </R2OrchestrationProvider>
      </StrictMode>,
    )

    await flushAsyncWork()

    expect(
      screen
        .getByTestId("command-state")
        .textContent,
    ).toBe("awaiting_action")

    fireEvent.click(
      screen.getByRole("button", {
        name: "queue",
      }),
    )

    await flushAsyncWork()

    expect(
      screen
        .getByTestId("decision")
        .textContent,
    ).toBe("QUEUE")
    expect(
      screen
        .getByTestId("command-state")
        .textContent,
    ).toBe("awaiting_action")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        8_000,
      )
    })

    expect(
      screen
        .getByTestId("command-state")
        .textContent,
    ).toBe("working")
  })
})
