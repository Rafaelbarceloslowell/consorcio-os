"use client"

import Link from "next/link"

import {
  FormEvent,
  useState,
  useTransition,
} from "react"

import {
  R2_LEARNING_OUTCOMES,
} from "@/application/learning/build-r2-learning-observation"

import type {
  R2LearningOutcome,
} from "@/application/learning/build-r2-learning-observation"

type OpportunityR2LearningCycleProps =
  Readonly<{
    opportunityId: string
    consultantId: string
    contactName: string
    initialSuggestion:
      string | null
    sourceIncomingMessage:
      string | null
    intent:
      string | null
    stage:
      string | null
    goal:
      string | null
  }>

type LearningResponse =
  Readonly<{
    message?: string
    error?: string
    learning?: {
      consultantEdited:
        boolean
      signal:
        string
      automaticModelUpdateApplied:
        boolean
      humanReviewRequired:
        boolean
    }
  }>

const outcomeLabels:
  Record<
    R2LearningOutcome,
    string
  > = {
  NO_RESPONSE:
    "Cliente não respondeu",
  POSITIVE_RESPONSE:
    "Cliente respondeu positivamente",
  NEGATIVE_RESPONSE:
    "Cliente respondeu negativamente",
  FOLLOW_UP_SCHEDULED:
    "Retorno combinado",
  MEETING_SCHEDULED:
    "Reunião marcada",
  PROPOSAL_SENT:
    "Proposta enviada",
  SALE_COMPLETED:
    "Venda concluída",
  LOST:
    "Oportunidade perdida",
  OTHER:
    "Outro resultado",
}

export function OpportunityR2LearningCycle({
  opportunityId,
  consultantId,
  contactName,
  initialSuggestion,
  sourceIncomingMessage,
  intent,
  stage,
  goal,
}: OpportunityR2LearningCycleProps) {
  const [isPending, startTransition] =
    useTransition()

  const [originalSuggestion, setOriginalSuggestion] =
    useState(
      initialSuggestion ?? "",
    )

  const [finalSentMessage, setFinalSentMessage] =
    useState(
      initialSuggestion ?? "",
    )

  const [customerResponse, setCustomerResponse] =
    useState("")

  const [outcome, setOutcome] =
    useState<R2LearningOutcome>(
      "POSITIVE_RESPONSE",
    )

  const [notes, setNotes] =
    useState("")

  const [confirmedManualSend, setConfirmedManualSend] =
    useState(false)

  const [feedback, setFeedback] =
    useState<string | null>(
      null,
    )

  const [error, setError] =
    useState<string | null>(
      null,
    )

  const [learningSummary, setLearningSummary] =
    useState<
      LearningResponse["learning"] |
      null
    >(null)

  const noResponse =
    outcome ===
    "NO_RESPONSE"

  const lostOutcome =
    outcome === "LOST"

  function changeOutcome(
    value: R2LearningOutcome,
  ): void {
    setOutcome(value)
    setError(null)
    setFeedback(null)
    setLearningSummary(null)

    if (
      value ===
      "NO_RESPONSE"
    ) {
      setCustomerResponse("")
    }
  }

  function submit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()
    setError(null)
    setFeedback(null)
    setLearningSummary(null)

    if (
      !confirmedManualSend
    ) {
      setError(
        "Confirme que a mensagem foi enviada manualmente.",
      )
      return
    }

    if (
      !originalSuggestion.trim()
    ) {
      setError(
        "Informe a sugestão original do R2.",
      )
      return
    }

    if (
      !finalSentMessage.trim()
    ) {
      setError(
        "Informe a mensagem realmente enviada.",
      )
      return
    }

    if (
      !noResponse &&
      !customerResponse.trim()
    ) {
      setError(
        "Informe a resposta do cliente.",
      )
      return
    }

    if (
      lostOutcome &&
      !notes.trim()
    ) {
      setError(
        "Informe o motivo da perda.",
      )
      return
    }

    startTransition(
      async () => {
        try {
          const response =
            await fetch(
              `/api/opportunities/${encodeURIComponent(
                opportunityId,
              )}/learning-observations`,
              {
                method:
                  "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    consultantId,
                    contactName,
                    sourceIncomingMessage,
                    originalSuggestion,
                    finalSentMessage,
                    customerResponse:
                      noResponse
                        ? null
                        : customerResponse,
                    outcome,
                    intent,
                    stage,
                    goal,
                    notes:
                      notes.trim() ||
                      null,
                  }),
              },
            )

          const body =
            await response.json() as
              LearningResponse

          if (!response.ok) {
            throw new Error(
              body.error ??
                "Não foi possível registrar a observação.",
            )
          }

          setFeedback(
            body.message ??
              "Observação registrada para revisão.",
          )
          setLearningSummary(
            body.learning ??
              null,
          )
        }
        catch (
          submitError
        ) {
          setError(
            submitError instanceof
            Error
              ? submitError.message
              : "Não foi possível registrar a observação.",
          )
        }
      },
    )
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-white/[0.10] bg-[#0F1412] px-3 py-3 text-sm leading-6 text-[#F5F7FA] outline-none transition focus:border-[#43A972]/55 focus:ring-4 focus:ring-[#2F8F5B]/10"

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/opportunities/${encodeURIComponent(
            opportunityId,
          )}`}
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Voltar para a oportunidade
        </Link>

        <section
          aria-labelledby="r2-learning-cycle-title"
          className="gorila-material mt-6 overflow-hidden rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)]"
        >
          <header className="border-b border-[var(--gorila-line)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
                  R2 · aprendizado controlado
                </p>

                <h1
                  id="r2-learning-cycle-title"
                  className="mt-2 text-3xl font-semibold tracking-[-0.045em]"
                >
                  Registrar resultado com {contactName}
                </h1>
              </div>

              <span className="rounded-full border border-[#43A972]/30 bg-[#2F8F5B]/12 px-3 py-1 text-xs font-semibold text-[#6FD39B]">
                Revisão humana obrigatória
              </span>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--gorila-text-soft)]">
              O registro compara a sugestão do R2 com a mensagem realmente enviada e relaciona essa decisão à resposta e ao resultado comercial. Nenhuma mensagem é enviada por esta tela e o modelo não se altera sozinho.
            </p>
          </header>

          <form
            noValidate
            onSubmit={submit}
            className="space-y-6 px-6 py-6 sm:px-8"
          >
            {sourceIncomingMessage ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gorila-text-muted)]">
                  Contexto que originou a sugestão
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {sourceIncomingMessage}
                </p>
              </div>
            ) : null}

            <label className="block text-sm font-medium text-[#D6DBE3]">
              Sugestão original do R2
              <textarea
                aria-label="Sugestão original do R2"
                rows={4}
                value={originalSuggestion}
                readOnly={
                  Boolean(
                    initialSuggestion
                      ?.trim(),
                  )
                }
                onChange={(event) =>
                  setOriginalSuggestion(
                    event.target.value,
                  )
                }
                placeholder="Cole aqui a sugestão original produzida pelo R2."
                className={`${fieldClass} read-only:cursor-default read-only:bg-[#121713] read-only:text-[#B8C0CA]`}
              />
              <span className="mt-1 block text-xs leading-5 text-[#697384]">
                Quando a memória comercial possui a sugestão, este campo fica protegido para preservar a comparação.
              </span>
            </label>

            <label className="block text-sm font-medium text-[#D6DBE3]">
              Mensagem realmente enviada
              <textarea
                aria-label="Mensagem realmente enviada"
                rows={4}
                value={finalSentMessage}
                onChange={(event) => {
                  setFinalSentMessage(
                    event.target.value,
                  )
                  setError(null)
                }}
                placeholder="Cole exatamente o texto que você enviou ao cliente."
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-medium text-[#D6DBE3]">
              Resultado comercial
              <select
                aria-label="Resultado comercial"
                value={outcome}
                onChange={(event) =>
                  changeOutcome(
                    event.target.value as
                      R2LearningOutcome,
                  )
                }
                className={fieldClass}
              >
                {R2_LEARNING_OUTCOMES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {
                        outcomeLabels[
                          value
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            {!noResponse ? (
              <label className="block text-sm font-medium text-[#D6DBE3]">
                Resposta recebida do cliente
                <textarea
                  aria-label="Resposta recebida do cliente"
                  rows={4}
                  value={customerResponse}
                  onChange={(event) => {
                    setCustomerResponse(
                      event.target.value,
                    )
                    setError(null)
                  }}
                  placeholder="Cole a resposta real do cliente, sem completar ou interpretar por conta própria."
                  className={fieldClass}
                />
              </label>
            ) : (
              <div
                data-testid="r2-learning-no-response"
                className="rounded-2xl border border-[#D7A54A]/20 bg-[#D7A54A]/[0.06] p-4"
              >
                <p className="text-sm font-medium text-[#E4BE70]">
                  Sem resposta registrada
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96A0AF]">
                  O GorillaOS registra a ausência de resposta sem inventar uma fala do cliente.
                </p>
              </div>
            )}

            <label className="block text-sm font-medium text-[#D6DBE3]">
              {lostOutcome
                ? "Motivo da perda"
                : "Observações para revisão"}
              <textarea
                aria-label={
                  lostOutcome
                    ? "Motivo da perda"
                    : "Observações para revisão"
                }
                rows={3}
                maxLength={2000}
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                placeholder={
                  lostOutcome
                    ? "Descreva o motivo comercial que encerrou esta oportunidade."
                    : "Ex.: reduzi a mensagem porque o cliente costuma responder melhor a perguntas curtas."
                }
                className={fieldClass}
              />
              <span className="mt-1 block text-right text-[11px] text-[#697384]">
                {notes.length}/2000
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm leading-6 text-[#D6DBE3]">
              <input
                type="checkbox"
                checked={confirmedManualSend}
                onChange={(event) => {
                  setConfirmedManualSend(
                    event.target.checked,
                  )
                  setError(null)
                }}
                className="mt-1"
              />
              <span>
                Confirmo que a mensagem foi enviada manualmente pelo consultor. Esta tela não envia WhatsApp e não executa nenhuma ação automática.
              </span>
            </label>

            <p
              aria-live="assertive"
              className="min-h-5 text-sm text-[#E98A8A]"
            >
              {error}
            </p>

            {feedback ? (
              <div
                data-testid="r2-learning-success"
                className="rounded-2xl border border-[#43A972]/25 bg-[#2F8F5B]/10 p-4"
              >
                <p className="text-sm font-medium text-[#7BE0A7]">
                  {feedback}
                </p>

                {learningSummary ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <SummaryItem
                      label="Mensagem editada"
                      value={
                        learningSummary
                          .consultantEdited
                          ? "Sim"
                          : "Não"
                      }
                    />
                    <SummaryItem
                      label="Aprendizado automático"
                      value={
                        learningSummary
                          .automaticModelUpdateApplied
                          ? "Aplicado"
                          : "Não aplicado"
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#43A972]/45 bg-[#2F8F5B]/20 px-5 text-sm font-semibold text-[#7BE0A7] transition hover:-translate-y-0.5 hover:border-[#43A972]/70 hover:bg-[#2F8F5B]/30 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                {isPending
                  ? "Registrando..."
                  : "Registrar observação para revisão"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

function SummaryItem({
  label,
  value,
}: Readonly<{
  label: string
  value: string
}>) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/[0.12] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697384]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#D6DBE3]">
        {value}
      </p>
    </div>
  )
}
