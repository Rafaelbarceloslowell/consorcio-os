"use client"

import Link from "next/link"
import {
  useRouter,
} from "next/navigation"
import {
  useState,
  useTransition,
} from "react"

import type {
  GorilaR2PilotAction,
} from "@/types/dashboard"

type R2PilotDecision =
  | "ACCEPT"
  | "POSTPONE"
  | "REJECT"

type R2PilotActionsProps = Readonly<{
  workspaceId: string
  consultantId: string
  action: GorilaR2PilotAction
}>

type DecisionResponse = Readonly<{
  message?: string
  error?: string
}>

const decisionLabels: Record<
  R2PilotDecision,
  string
> = {
  ACCEPT: "Aceitar recomendação",
  POSTPONE: "Fazer amanhã",
  REJECT: "Descartar",
}

export function R2PilotActions({
  workspaceId,
  consultantId,
  action,
}: R2PilotActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] =
    useTransition()
  const [activeDecision, setActiveDecision] =
    useState<R2PilotDecision | null>(null)
  const [feedback, setFeedback] =
    useState<string | null>(null)
  const [error, setError] =
    useState<string | null>(null)

  function decide(
    decision: R2PilotDecision,
  ): void {
    setActiveDecision(decision)
    setFeedback(null)
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/r2/recommendations/${encodeURIComponent(
            action.recommendationId,
          )}/decision`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              workspaceId,
              consultantId,
              decision,
              postponeMinutes:
                decision === "POSTPONE"
                  ? 24 * 60
                  : undefined,
            }),
          },
        )

        const payload =
          await response.json() as DecisionResponse

        if (!response.ok) {
          throw new Error(
            payload.error ??
              "Não foi possível registrar sua decisão.",
          )
        }

        setFeedback(
          payload.message ??
            "Decisão registrada pelo R2.",
        )
        router.refresh()
      }
      catch (decisionError) {
        setError(
          decisionError instanceof Error
            ? decisionError.message
            : "Não foi possível registrar sua decisão.",
        )
      }
      finally {
        setActiveDecision(null)
      }
    })
  }

  const buttonBase =
    "inline-flex min-h-10 items-center justify-center rounded-xl border px-3.5 text-xs font-semibold transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"

  return (
    <div
      data-testid="r2-pilot-actions"
      className="mt-5 max-w-3xl rounded-2xl border border-white/[0.07] bg-black/[0.14] p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={action.opportunityHref}
          className={`${buttonBase} border-white/[0.10] bg-white/[0.035] text-[#D6DBE3] hover:border-white/[0.18] hover:bg-white/[0.06]`}
        >
          Abrir oportunidade
        </Link>

        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("ACCEPT")}
          className={`${buttonBase} border-[#2F8F5B]/35 bg-[#2F8F5B]/15 text-[#6FD39B] hover:border-[#43A972]/55 hover:bg-[#2F8F5B]/22`}
        >
          {isPending && activeDecision === "ACCEPT"
            ? "Registrando..."
            : decisionLabels.ACCEPT}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("POSTPONE")}
          className={`${buttonBase} border-white/[0.10] bg-white/[0.025] text-[#B8C0CC] hover:border-white/[0.18] hover:bg-white/[0.05]`}
        >
          {isPending && activeDecision === "POSTPONE"
            ? "Agendando..."
            : decisionLabels.POSTPONE}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("REJECT")}
          className={`${buttonBase} border-[#E16A6A]/20 bg-[#E16A6A]/[0.055] text-[#E98A8A] hover:border-[#E16A6A]/35 hover:bg-[#E16A6A]/[0.09]`}
        >
          {isPending && activeDecision === "REJECT"
            ? "Descartando..."
            : decisionLabels.REJECT}
        </button>
      </div>

      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-xs leading-5"
      >
        {error ? (
          <span className="text-[#E98A8A]">
            {error}
          </span>
        ) : feedback ? (
          <span className="text-[#6FD39B]">
            {feedback}
          </span>
        ) : (
          <span className="text-[#697384]">
            Você decide. O R2 registra e reorganiza a próxima prioridade.
          </span>
        )}
      </p>
    </div>
  )
}
