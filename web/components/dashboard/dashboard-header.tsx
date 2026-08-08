import {
  ArrowUpRight,
  Bot,
  CircleDot,
} from "lucide-react"
import Link from "next/link"

import type {
  R2Behavior,
} from "@/components/dashboard/3d/r2-behavior"
import {
  GorilaR2Avatar3D,
  type R2VisualState,
} from "@/components/dashboard/gorila-r2-avatar-3d"
import {
  R2PendingActionControls,
} from "@/components/dashboard/r2-pending-action-controls"
import {
  R2PilotActions,
} from "@/components/dashboard/r2-pilot-actions"
import {
  formatGreeting,
} from "@/lib/formatters"
import type {
  GorilaR2Briefing,
  User,
} from "@/types/dashboard"

type DashboardHeaderProps = Readonly<{
  workspaceId?: string
  user: User
  summary: string
  priorityCount?: number
  gorilaR2?: GorilaR2Briefing
  behavior?: R2Behavior
}>

function resolveR2State(
  gorilaR2?: GorilaR2Briefing,
  behavior?: R2Behavior,
): R2VisualState {
  if (behavior?.mood === "success") return "celebrating"
  if (behavior?.mood === "alert" || gorilaR2?.confidence === "low") return "alert"
  if (gorilaR2?.pendingAction || behavior?.mood === "thinking") return "working"
  if (gorilaR2?.pilotAction) return "waiting"
  return "neutral"
}

export function DashboardHeader({
  workspaceId,
  user,
  summary,
  priorityCount = 0,
  gorilaR2,
  behavior,
}: DashboardHeaderProps) {
  const r2State = resolveR2State(gorilaR2, behavior)
  const action = gorilaR2?.pendingAction ?? gorilaR2?.pilotAction
  const actionTitle = action?.title ?? gorilaR2?.nextAction?.title ?? gorilaR2?.recommendation
  const actionContext = action?.description ?? gorilaR2?.reason ?? gorilaR2?.analysis ?? summary
  const actionHref = action?.opportunityHref
  const contactName = action?.journeyTitle
  const status = r2State === "alert"
    ? "alert"
    : r2State === "working" || r2State === "waiting"
      ? "thinking"
      : "online"

  return (
    <header
      id="r2-command"
      className="gorilla-panel gorilla-hero-environment relative isolate overflow-hidden rounded-[30px]"
    >
      <div className="relative z-10 grid min-h-[500px] items-end lg:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] xl:min-h-[530px]">
        <div className="relative flex min-h-[330px] items-end justify-center self-stretch lg:min-h-full">
          <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-[var(--gorila-line)] bg-black/25 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--gorila-text-soft)] backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--gorila-green-bright)] opacity-25" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--gorila-green-bright)]" />
            </span>
            R2 monitorando
          </div>

          <GorilaR2Avatar3D
            size="hero"
            workspaceId={workspaceId}
            userId={user.id}
            briefing={gorilaR2}
            status={status}
            state={r2State}
          />
        </div>

        <div className="relative flex min-w-0 flex-col justify-center px-5 pb-7 pt-2 sm:px-8 lg:min-h-full lg:px-10 lg:py-10 xl:px-12">
          <p className="text-sm font-medium text-[var(--gorila-text)] sm:text-base">
            {gorilaR2?.greeting ?? formatGreeting(user.name)}
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--gorila-text-muted)] sm:text-sm">
            R2 está monitorando sua operação e identificou sua melhor ação agora.
          </p>

          <section
            aria-labelledby="next-best-action-title"
            className="mt-7 max-w-2xl rounded-[22px] border border-[var(--gorila-material-border-strong)] bg-[rgba(24,24,20,0.82)] p-5 shadow-[inset_0_1px_0_rgba(255,247,229,0.06),0_20px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.17em] text-[var(--gorila-bronze)]">
                <CircleDot className="size-3.5" />
                Melhor ação agora
              </p>
              <span
                data-testid="r2-visual-state"
                data-state={r2State}
                className="rounded-full border border-[var(--gorila-line)] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--gorila-text-muted)]"
              >
                {r2State}
              </span>
            </div>

            <h1
              id="next-best-action-title"
              className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.045em] text-[var(--gorila-text)] sm:text-3xl"
            >
              {contactName ?? actionTitle ?? "Operação acompanhada pelo R2"}
            </h1>

            {contactName && actionTitle ? (
              <p className="mt-2 text-sm font-medium text-[var(--gorila-green-bright)]">
                {actionTitle}
              </p>
            ) : null}

            <p className="mt-3 max-w-xl text-xs leading-5 text-[var(--gorila-text-soft)] sm:text-sm sm:leading-6">
              {actionContext || (
                priorityCount > 0
                  ? `${priorityCount} ações prioritárias aguardam decisão.`
                  : "Sua operação está estável. O R2 seguirá buscando o próximo avanço comercial."
              )}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {actionHref ? (
                <>
                  <Link
                    href={actionHref}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--gorila-green)] bg-[var(--gorila-green-soft)] px-4 text-xs font-semibold text-[var(--gorila-text)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--gorila-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
                  >
                    <Bot className="size-3.5" />
                    Atender agora
                  </Link>
                  <Link
                    href={actionHref}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--gorila-line)] px-4 text-xs font-medium text-[var(--gorila-text-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--gorila-material-border-strong)] hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
                  >
                    Ver detalhes
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </>
              ) : (
                <Link
                  href="#pipeline"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--gorila-line)] px-4 text-xs font-medium text-[var(--gorila-text-soft)] transition hover:border-[var(--gorila-green)] hover:bg-[var(--gorila-green-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
                >
                  Ver pipeline
                  <ArrowUpRight className="size-3.5" />
                </Link>
              )}
            </div>
          </section>

          <div id="r2-action-controls">
            {workspaceId && gorilaR2?.pendingAction ? (
              <R2PendingActionControls
                workspaceId={workspaceId}
                consultantId={user.id}
                action={gorilaR2.pendingAction}
              />
            ) : workspaceId && gorilaR2?.pilotAction ? (
              <R2PilotActions
                workspaceId={workspaceId}
                consultantId={user.id}
                action={gorilaR2.pilotAction}
              />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
