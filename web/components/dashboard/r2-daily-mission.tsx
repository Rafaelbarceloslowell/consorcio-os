"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

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
  notifications: ReadonlyArray<{
    id: string
    title: string
    body: string
  }>
}>

export function R2DailyMission() {
  const [mission, setMission] = useState<DailyMission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [browserPermission, setBrowserPermission] = useState<string>(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  )

  useEffect(() => {
    let active = true
    void fetch("/api/r2/daily-mission", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as DailyMission & { error?: string }
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar sua missão.")
        if (active) setMission(body)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar sua missão.")
      })
    return () => { active = false }
  }, [])

  async function enableBrowserNotifications() {
    if (typeof Notification === "undefined") return
    const permission = await Notification.requestPermission()
    setBrowserPermission(permission)
    if (permission === "granted" && mission?.notifications[0]) {
      new Notification(mission.notifications[0].title, { body: mission.notifications[0].body })
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
        {browserPermission === "default" ? (
          <button onClick={() => void enableBrowserNotifications()} className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold">Ativar alertas do navegador</button>
        ) : null}
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
                <Link href={`/opportunities/${encodeURIComponent(first.opportunityId)}`} className="rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white">Abrir ação</Link>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--gorila-text-muted)]">Nenhuma ação operacional pendente.</p>
          )}
        </>
      ) : null}
    </section>
  )
}

function Metric({ label, value }: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] p-3">
      <p className="text-[var(--gorila-text-muted)]">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  )
}
