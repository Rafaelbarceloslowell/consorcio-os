"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  browserNotificationTag,
  getBrowserNotificationPermission,
  shouldAttemptNativeNotification,
  type BrowserNotificationPermission,
} from "./r2-browser-notifications"

type MissionNotification = Readonly<{
  id: string
  kind: string
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  title: string
  body: string
  href: string
  originalDueAt: string
  deliveryDueAt: string
  snoozedUntil: string | null
  nativeDeliveredAt: string | null
  deliveryVersion: number
}>

type DailyMission = Readonly<{
  target: number
  totalActive: number
  commitments: number
  meetings: number
  newLeads: number
  checks: number
  recoveries: number
  followUps: number
  now: ReadonlyArray<{
    id: string
    opportunityId: string | null
    title: string
    reason: string | null
    dueAt: string
  }>
  next: ReadonlyArray<{
    id: string
    opportunityId: string | null
    title: string
    reason: string | null
    dueAt: string
  }>
  notifications: ReadonlyArray<MissionNotification>
}>

async function changeNotification(
  notificationId: string,
  action: Readonly<Record<string, unknown>>,
): Promise<{ claimed?: boolean }> {
  const response = await fetch(`/api/r2/notifications/${encodeURIComponent(notificationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  })
  if (!response.ok) throw new Error("Não foi possível atualizar a notificação.")
  return response.json() as Promise<{ claimed?: boolean }>
}

export function R2DailyMission() {
  const [mission, setMission] = useState<DailyMission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationPermission>("unsupported")
  const mounted = useRef(true)

  const deliverNativeNotifications = useCallback(async (notifications: ReadonlyArray<MissionNotification>) => {
    if (!shouldAttemptNativeNotification({
      permission: getBrowserNotificationPermission(),
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus(),
    })) return

    for (const notification of notifications.filter((item) => item.nativeDeliveredAt === null)) {
      const claim = await changeNotification(notification.id, {
        type: "CLAIM",
        deliveryVersion: notification.deliveryVersion,
      }).catch(() => ({ claimed: false }))

      if (!claim.claimed || typeof Notification === "undefined") continue
      const native = new Notification(notification.title, {
        body: notification.body,
        tag: browserNotificationTag(notification.id, notification.deliveryVersion),
      })
      native.onclick = () => {
        window.focus()
        window.location.assign(notification.href)
        native.close()
      }
    }
  }, [])

  const loadMission = useCallback(async () => {
    try {
      const response = await fetch("/api/r2/daily-mission", { cache: "no-store" })
      const body = await response.json() as DailyMission & { error?: string }
      if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar sua missão.")
      if (mounted.current) {
        setMission(body)
        setError(null)
      }
      await deliverNativeNotifications(body.notifications)
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "Não foi possível carregar sua missão.")
      }
    }
  }, [deliverNativeNotifications])

  useEffect(() => {
    mounted.current = true
    queueMicrotask(() => {
      if (mounted.current) setBrowserPermission(getBrowserNotificationPermission())
      void loadMission()
    })
    const interval = window.setInterval(() => void loadMission(), 30_000)
    const refresh = () => void loadMission()
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      mounted.current = false
      window.clearInterval(interval)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [loadMission])

  async function enableBrowserNotifications() {
    if (typeof Notification === "undefined") return
    const permission = await Notification.requestPermission()
    setBrowserPermission(permission)
  }

  async function applyNotificationAction(
    notificationId: string,
    action: Readonly<Record<string, unknown>>,
  ) {
    try {
      await changeNotification(notificationId, action)
      await loadMission()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a notificação.")
    }
  }

  const first = mission?.now[0] ?? mission?.next[0]

  return (
    <section aria-labelledby="daily-mission-title" className="gorila-material rounded-[22px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D0B96C]">Missão diária R2</p>
          <h2 id="daily-mission-title" className="mt-1 text-lg font-semibold">Sua operação agora</h2>
        </div>
        <BrowserPermissionControl permission={browserPermission} onEnable={() => void enableBrowserNotifications()} />
      </div>

      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
      {!mission && !error ? <p role="status" className="mt-3 text-sm text-[var(--gorila-text-muted)]">Organizando carteira…</p> : null}

      {mission ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-6">
            <Metric label="Em trabalho" value={`${mission.totalActive}/${mission.target}`} />
            <Metric label="Leads novos" value={mission.newLeads} />
            <Metric label="Checks" value={mission.checks} />
            <Metric label="Compromissos" value={mission.commitments} />
            <Metric label="Reuniões" value={mission.meetings} />
            <Metric label="Recoveries" value={mission.recoveries} />
          </div>

          {first ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#697842]/30 bg-[#697842]/8 p-4">
              <div>
                <p className="text-xs font-semibold text-[#D0B96C]">Comece por</p>
                <p className="mt-1 text-sm font-semibold">{first.title}</p>
                <p className="mt-1 text-xs text-[var(--gorila-text-muted)]">{first.reason}</p>
              </div>
              {first.opportunityId ? (
                <Link href={`/opportunities/${encodeURIComponent(first.opportunityId)}#r2-action-controls`} className="rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white">Abrir ação</Link>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--gorila-text-muted)]">Nenhuma ação operacional pendente.</p>
          )}

          <NotificationCenter
            notifications={mission.notifications}
            onAction={(notificationId, action) => void applyNotificationAction(notificationId, action)}
          />
        </>
      ) : null}
    </section>
  )
}

function BrowserPermissionControl({
  permission,
  onEnable,
}: Readonly<{ permission: BrowserNotificationPermission; onEnable: () => void }>) {
  if (permission === "default") {
    return <button onClick={onEnable} className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D0B96C]">Ativar notificações do R2</button>
  }
  if (permission === "granted") return <p className="text-xs text-[var(--gorila-text-muted)]">Alertas do navegador ativos</p>
  if (permission === "denied") return <p className="max-w-64 text-xs text-[var(--gorila-text-muted)]">Alertas bloqueados pelo navegador. Libere a permissão nas configurações do site.</p>
  return <p className="text-xs text-[var(--gorila-text-muted)]">Alertas nativos indisponíveis neste navegador.</p>
}

function NotificationCenter({
  notifications,
  onAction,
}: Readonly<{
  notifications: ReadonlyArray<MissionNotification>
  onAction: (notificationId: string, action: Readonly<Record<string, unknown>>) => void
}>) {
  if (notifications.length === 0) return null

  return (
    <div className="mt-4 border-t border-[var(--gorila-line)] pt-4" aria-labelledby="r2-notification-center-title">
      <div className="flex items-center gap-2">
        <h3 id="r2-notification-center-title" className="text-sm font-semibold">Central de notificações</h3>
        <span aria-label={`${notifications.length} notificações pendentes`} className="rounded-full bg-[#697842] px-2 py-0.5 text-[10px] font-bold text-white">{notifications.length}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {notifications.map((notification) => (
          <li key={notification.id} className="rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="mt-1 text-xs text-[var(--gorila-text-muted)]">{notification.body}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-[#D0B96C]">
                  {priorityLabel(notification.priority)} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(notification.deliveryDueAt))}
                </p>
              </div>
              <Link
                href={notification.href}
                onClick={() => onAction(notification.id, { type: "READ" })}
                className="rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D0B96C]"
              >
                Abrir destino
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => onAction(notification.id, { type: "SNOOZE", minutes: 10 })} className="rounded-lg border border-[var(--gorila-line)] px-2 py-1 text-xs">Adiar 10 min</button>
              <button onClick={() => onAction(notification.id, { type: "SNOOZE", minutes: 30 })} className="rounded-lg border border-[var(--gorila-line)] px-2 py-1 text-xs">Adiar 30 min</button>
              <button onClick={() => onAction(notification.id, { type: "READ" })} className="rounded-lg border border-[var(--gorila-line)] px-2 py-1 text-xs">Marcar como lida</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function priorityLabel(priority: MissionNotification["priority"]): string {
  if (priority === "URGENT") return "Urgente"
  if (priority === "HIGH") return "Alta"
  if (priority === "LOW") return "Baixa"
  return "Normal"
}

function Metric({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] p-3">
      <p className="text-[var(--gorila-text-muted)]">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  )
}
