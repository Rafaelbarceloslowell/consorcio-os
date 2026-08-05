"use client"

import {
  normalizeCommercialEvent,
} from "@/application/r2"
import {
  subscribeCommercialEvent,
} from "@/application/use-cases/common/commercial-event-dispatcher"

import {
  startR2PersistentCommercialEventPolling,
} from "./r2-persistent-commercial-event-poller"

/* R2_PROCESS_LOCAL_COMMERCIAL_EVENT_BRIDGE_V1_IMPORT */


import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react"
import type {
  ReactNode,
} from "react"

import {
  R2DeterministicIntelligence,
  R2Orchestrator,
  resolveR2EventContext,
} from "@/application/r2"
import type {
  R2DomainEvent,
  R2ExecutionReceipt,
  R2OrchestrationDecision,
  R2OrchestrationState,
  R2RuntimeCommand,
} from "@/types/r2-intelligence-orchestration"

type R2OrchestrationSnapshot = Readonly<{
  command: R2RuntimeCommand | null
  decision: R2OrchestrationDecision | null
  state: R2OrchestrationState
}>

class R2OrchestrationStore {
  private readonly orchestrator: R2Orchestrator
  private readonly listeners = new Set<() => void>()
  private snapshot: R2OrchestrationSnapshot
  private timer: ReturnType<typeof setTimeout> | null = null
  private timerCommandId: string | null = null
  private generation = 0
  private disposed = false

  constructor(
    readonly workspaceId: string,
    private readonly userId: string | null,
  ) {
    this.orchestrator = new R2Orchestrator({
      workspaceId,
      intelligence: new R2DeterministicIntelligence(),
    })
    this.snapshot = {
      command: null,
      decision: null,
      state: this.orchestrator.getState(),
    }
  }

  getSnapshot = () => this.snapshot

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  activate() {
    this.generation += 1
    const generation = this.generation
    return () => {
      queueMicrotask(() => {
        if (this.generation === generation) this.dispose()
      })
    }
  }

  async dispatch(event: R2DomainEvent) {
    if (this.disposed) return null
    const state = this.orchestrator.getState()
    const context = resolveR2EventContext(event, {
      workspaceId: this.workspaceId,
      userId: this.userId,
      currentRuntimeState: state.current?.command.runtimeState ?? state.lastStableState,
      lastStableRuntimeState: state.lastStableState,
    })
    const decision = await this.orchestrator.dispatch(event, context)
    this.publish(decision)
    return decision
  }

  recordReceipt(receipt: R2ExecutionReceipt) {
    if (this.orchestrator.recordExecutionReceipt(receipt)) {
      this.snapshot = { ...this.snapshot, state: this.orchestrator.getState() }
      this.emit()
    }
  }

  private publish(decision: R2OrchestrationDecision) {
    const presentsCommand =
      decision.decision === "EXECUTE" ||
      decision.decision === "INTERRUPT" ||
      decision.decision === "FALLBACK" ||
      decision.decision === "FAIL"
    this.snapshot = {
      command: presentsCommand && decision.command
        ? decision.command
        : this.snapshot.command,
      decision,
      state: this.orchestrator.getState(),
    }
    this.emit()
    this.syncAdvanceTimer()
  }

  private syncAdvanceTimer() {
    const current =
      this.orchestrator
        .getState()
        .current

    if (!current) {
      this.clearAdvanceTimer()
      return
    }

    const completesAt =
      new Date(
        current.completesAt,
      ).getTime()
    const remainingMs =
      Number.isFinite(
        completesAt,
      )
        ? Math.max(
            0,
            completesAt -
              Date.now(),
          )
        : Math.max(
            0,
            current.command
              .durationMs,
          )

    if (
      this.timer &&
      this.timerCommandId ===
        current.command
          .commandId &&
      remainingMs > 0
    ) {
      return
    }

    this.clearAdvanceTimer()
    this.timerCommandId =
      current.command
        .commandId
    this.timer = setTimeout(
      () => {
        this.timer = null
        this.timerCommandId =
          null
        const next =
          this.orchestrator
            .advance()
        if (next) {
          this.publish(
            next,
          )
          return
        }
        this.syncAdvanceTimer()
      },
      remainingMs,
    )
  }

  private clearAdvanceTimer() {
    if (this.timer) {
      clearTimeout(
        this.timer,
      )
    }
    this.timer = null
    this.timerCommandId =
      null
  }

  private emit() {
    for (const listener of this.listeners) listener()
  }

  private dispose() {
    if (this.disposed) return
    this.disposed = true
    this.clearAdvanceTimer()
    this.orchestrator.dispose()
    this.listeners.clear()
  }
}

type R2OrchestrationContextValue = Readonly<{
  store: R2OrchestrationStore
  snapshot: R2OrchestrationSnapshot
}>

const R2OrchestrationContext = createContext<R2OrchestrationContextValue | null>(null)

function R2OrchestrationProviderScope({
  workspaceId,
  userId,
  initialEvent,
  persistentEventsEnabled,
  children,
}: Readonly<{
  workspaceId: string
  userId?: string | null
  initialEvent?: R2DomainEvent | null
  persistentEventsEnabled: boolean
  children: ReactNode
}>) {
  const [store] = useState(() => new R2OrchestrationStore(workspaceId, userId ?? null))

  /* R2_PROCESS_LOCAL_COMMERCIAL_EVENT_BRIDGE_V1_SUBSCRIPTION */
  useEffect(() => {
    return subscribeCommercialEvent(
      (event) => {
        if (
          event.workspaceId !==
          workspaceId
        ) {
          return
        }

        void store
          .dispatch(
            normalizeCommercialEvent(
              event,
            ),
          )
          .catch(() => undefined)
      },
    )
  }, [
    workspaceId,
    store,
  ])

  useEffect(() => {
    if (
      !persistentEventsEnabled ||
      !userId
    ) {
      return
    }

    return startR2PersistentCommercialEventPolling({
      workspaceId,
      userId,
      onEvent: async (event) => {
        await store.dispatch(
          normalizeCommercialEvent(
            event,
            {
              userId,
            },
          ),
        )
      },
    })
  }, [
    persistentEventsEnabled,
    store,
    userId,
    workspaceId,
  ])

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  useEffect(() => store.activate(), [store])

  useEffect(() => {
    if (initialEvent) void store.dispatch(initialEvent)
  }, [initialEvent, store])

  return (
    <R2OrchestrationContext.Provider value={{ store, snapshot }}>
      {children}
    </R2OrchestrationContext.Provider>
  )
}

export function R2OrchestrationProvider(props: Readonly<{
  workspaceId: string
  userId?: string | null
  initialEvent?: R2DomainEvent | null
  persistentEventsEnabled?: boolean
  children: ReactNode
}>) {
  const persistentEventsEnabled =
    props.persistentEventsEnabled ??
    process.env.NODE_ENV !== "test"

  return (
    <R2OrchestrationProviderScope
      key={`${props.workspaceId}:${props.userId ?? "anonymous"}`}
      {...props}
      persistentEventsEnabled={persistentEventsEnabled}
    />
  )
}

export function useR2Orchestration() {
  const value = useContext(R2OrchestrationContext)
  if (!value) throw new Error("useR2Orchestration must be used inside R2OrchestrationProvider.")
  return {
    ...value.snapshot,
    dispatch: (event: R2DomainEvent) => value.store.dispatch(event),
    recordReceipt: (receipt: R2ExecutionReceipt) => value.store.recordReceipt(receipt),
  }
}
