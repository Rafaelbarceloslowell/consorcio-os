"use client"

import {
  useRef,
  useState,
} from "react"

import type {
  R2IntelligenceResult,
} from "@/application/r2/resolve-r2-intelligence"

import type {
  R2ConsultantFeedbackErrorCategory,
} from "@/application/r2/feedback"

import type {
  R2DecisionSafetyResult,
  R2EvidenceDecisionContext,
} from "@/application/r2/evidence"

import type {
  ManualWhatsAppAnalysis,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

import {
  Select,
} from "@/components/ui/select"

import {
  Textarea,
} from "@/components/ui/textarea"

const ERROR_CATEGORIES: readonly Readonly<{
  value: R2ConsultantFeedbackErrorCategory
  label: string
}>[] = [
  { value: "MISREAD_CONTEXT", label: "Entendeu o cliente errado" },
  { value: "MISSED_MEMORY", label: "Ignorou informação anterior" },
  { value: "WRONG_FACT", label: "Informação/fato errado" },
  { value: "WRONG_COMMERCIAL_STRATEGY", label: "Estratégia comercial errada" },
  { value: "WRONG_NEXT_ACTION", label: "Próximo passo errado" },
  { value: "OUTDATED_INFORMATION", label: "Informação desatualizada" },
  { value: "BAD_RESPONSE", label: "Resposta inadequada" },
  { value: "UNSUPPORTED_ASSUMPTION", label: "Fez uma suposição incorreta" },
  { value: "PRODUCT_RULE_ERROR", label: "Regra de produto/consórcio incorreta" },
  { value: "EVIDENCE_INTERPRETATION_ERROR", label: "Avaliou a evidência errado" },
  { value: "CONSULTANT_PREFERENCE", label: "Preferência/experiência do consultor" },
  { value: "OTHER", label: "Outro" },
]

type FeedbackResponse = Readonly<{
  status?: string
  error?: string
  message?: string
  feedbackPersisted?: boolean
  feedbackId?: string
  intelligence?: R2IntelligenceResult
  analysis?: ManualWhatsAppAnalysis
  reply?: string | null
  evidence?: R2EvidenceDecisionContext
  safetyCheck?: R2DecisionSafetyResult
}>

export type R2ConsultantFeedbackRevision = Readonly<{
  intelligence: R2IntelligenceResult
  analysis: ManualWhatsAppAnalysis | null
  reply: string | null
  evidence: R2EvidenceDecisionContext | null
  safetyCheck: R2DecisionSafetyResult | null
}>

function nextIdempotencyKey(): string {
  return globalThis.crypto.randomUUID()
}

export function OpportunityR2ConsultantFeedback({
  opportunityId,
  intelligence,
  onRevision,
}: Readonly<{
  opportunityId: string
  intelligence: R2IntelligenceResult
  onRevision?: (
    revision: R2ConsultantFeedbackRevision,
  ) => void
}>) {
  const [dialogOpen, setDialogOpen] =
    useState(false)
  const [errorCategory, setErrorCategory] =
    useState<R2ConsultantFeedbackErrorCategory | "">("")
  const [disagreementReason, setDisagreementReason] =
    useState("")
  const [correctPath, setCorrectPath] =
    useState("")
  const [status, setStatus] =
    useState<"idle" | "sending" | "success" | "error">("idle")
  const [message, setMessage] =
    useState("")
  const [feedbackId, setFeedbackId] =
    useState<string | null>(null)
  const [outcomeSent, setOutcomeSent] =
    useState(false)
  const [canRecordOutcome, setCanRecordOutcome] =
    useState(false)
  const acceptanceKey = useRef<string | null>(null)
  const disagreementKey = useRef<string | null>(null)
  const outcomeKey = useRef<string | null>(null)

  async function postFeedback(
    body: Record<string, unknown>,
  ): Promise<{
    response: Response
    data: FeedbackResponse
  }> {
    const response = await fetch(
      `/api/opportunities/${encodeURIComponent(opportunityId)}/r2-intelligence/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    )
    const data = await response.json() as FeedbackResponse

    return { response, data }
  }

  async function handleAccept(): Promise<void> {
    if (status === "sending") return

    acceptanceKey.current ??= nextIdempotencyKey()
    setStatus("sending")
    setMessage("")

    try {
      const { response, data } = await postFeedback({
        action: "ACCEPT",
        recommendationId: intelligence.recommendationId,
        idempotencyKey: acceptanceKey.current,
      })

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível registrar sua avaliação.")
      }

      setFeedbackId(data.feedbackId ?? null)
      setCanRecordOutcome(true)
      setStatus("success")
      setMessage("Feedback registrado.")
    } catch (error) {
      setStatus("error")
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar sua avaliação.",
      )
    }
  }

  function openDisagreement(): void {
    disagreementKey.current ??= nextIdempotencyKey()
    setStatus("idle")
    setMessage("")
    setDialogOpen(true)
  }

  async function handleDisagree(): Promise<void> {
    if (
      status === "sending" ||
      !errorCategory ||
      !disagreementReason.trim() ||
      !correctPath.trim()
    ) {
      return
    }

    disagreementKey.current ??= nextIdempotencyKey()
    setStatus("sending")
    setMessage("")

    try {
      const { response, data } = await postFeedback({
        action: "DISAGREE",
        recommendationId: intelligence.recommendationId,
        idempotencyKey: disagreementKey.current,
        errorCategory,
        disagreementReason,
        correctPath,
      })

      if (!response.ok && !data.feedbackPersisted) {
        throw new Error(data.error ?? "Não foi possível registrar a correção.")
      }

      if (!response.ok && data.status !== "BLOCKED_BY_SAFETY") {
        throw new Error(data.error ?? "A correção foi salva, mas não pôde ser regenerada.")
      }

      setFeedbackId(data.feedbackId ?? null)
      setCanRecordOutcome(
        data.status === "CORRECTION_APPLIED",
      )
      setStatus("success")
      setMessage(
        data.message ??
          "Correção aplicada neste caso e registrada para avaliação de aprendizado.",
      )
      setDialogOpen(false)
      disagreementKey.current = null
      setErrorCategory("")
      setDisagreementReason("")
      setCorrectPath("")

      if (data.intelligence) {
        onRevision?.({
          intelligence: data.intelligence,
          analysis: data.analysis ?? null,
          reply: data.reply ?? null,
          evidence: data.evidence ?? null,
          safetyCheck: data.safetyCheck ?? null,
        })
      }
    } catch (error) {
      setStatus("error")
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a correção.",
      )
    }
  }

  async function handleOutcome(
    outcome: "WORKED" | "PARTIALLY_WORKED" | "DID_NOT_WORK",
  ): Promise<void> {
    if (!feedbackId || status === "sending") return

    outcomeKey.current ??= nextIdempotencyKey()
    setStatus("sending")
    setMessage("")

    try {
      const { response, data } = await postFeedback({
        action: "OUTCOME",
        recommendationId: intelligence.recommendationId,
        idempotencyKey: outcomeKey.current,
        feedbackId,
        outcome,
      })

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível registrar o resultado.")
      }

      setOutcomeSent(true)
      setStatus("success")
      setMessage("Resultado registrado.")
    } catch (error) {
      setStatus("error")
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o resultado.",
      )
    }
  }

  const isSending = status === "sending"

  return (
    <div className="mt-5 border-t border-[var(--gorila-line)] pt-4">
      <p className="text-xs font-semibold text-[var(--gorila-text-soft)]">
        Esta recomendação faz sentido para o caso?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isSending}
          onClick={() => void handleAccept()}
          className="min-h-9 rounded-xl border border-[#43A972]/30 bg-[#2F8F5B]/15 px-3 text-xs font-semibold text-[#6FD39B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Faz sentido
        </button>
        <button
          type="button"
          disabled={isSending}
          onClick={openDisagreement}
          className="min-h-9 rounded-xl border border-white/[0.12] bg-white/[0.035] px-3 text-xs font-semibold text-[#D6DBE3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Discordo
        </button>
      </div>

      {message ? (
        <p
          aria-live="polite"
          role={status === "error" ? "alert" : undefined}
          className={`mt-3 text-xs leading-5 ${
            status === "error"
              ? "text-[#F08A8A]"
              : "text-[#6FD39B]"
          }`}
        >
          {message}
        </p>
      ) : null}

      {feedbackId && canRecordOutcome && !outcomeSent ? (
        <div className="mt-4">
          <p className="text-xs text-[var(--gorila-text-muted)]">
            Essa orientação funcionou?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ["WORKED", "Funcionou"],
              ["PARTIALLY_WORKED", "Parcialmente"],
              ["DID_NOT_WORK", "Não funcionou"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={isSending}
                onClick={() => void handleOutcome(value)}
                className="rounded-lg border border-white/[0.10] px-2.5 py-1.5 text-[11px] text-[var(--gorila-text-soft)] disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isSending) setDialogOpen(open)
        }}
      >
        <DialogContent
          title="Onde o R2 errou?"
          description="Explique rapidamente o erro e o caminho correto para este caso."
          size="md"
          onClose={() => setDialogOpen(false)}
          footer={(
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSending}
                onClick={() => setDialogOpen(false)}
                className="min-h-10 rounded-xl border border-white/[0.10] px-4 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isSending ||
                  !errorCategory ||
                  !disagreementReason.trim() ||
                  !correctPath.trim()
                }
                onClick={() => void handleDisagree()}
                className="min-h-10 rounded-xl border border-[#43A972]/30 bg-[#2F8F5B]/15 px-4 text-xs font-semibold text-[#6FD39B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? "Corrigindo..." : "Corrigir R2"}
              </button>
            </div>
          )}
        >
          <div className="space-y-4">
            <label className="block text-xs font-semibold">
              Tipo do erro
              <Select
                className="mt-2"
                value={errorCategory}
                onChange={(event) => setErrorCategory(
                  event.target.value as R2ConsultantFeedbackErrorCategory,
                )}
                disabled={isSending}
                placeholder="Selecione"
              >
                {ERROR_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-xs font-semibold">
              O que o R2 entendeu errado?
              <Textarea
                className="mt-2 min-h-28"
                maxLength={3000}
                value={disagreementReason}
                onChange={(event) => setDisagreementReason(event.target.value)}
                disabled={isSending}
              />
            </label>
            <label className="block text-xs font-semibold">
              Qual seria o caminho correto?
              <Textarea
                className="mt-2 min-h-28"
                maxLength={3000}
                value={correctPath}
                onChange={(event) => setCorrectPath(event.target.value)}
                disabled={isSending}
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
