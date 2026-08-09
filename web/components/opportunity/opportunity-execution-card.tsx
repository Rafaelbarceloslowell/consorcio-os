"use client"

import { useCallback, useEffect, useState } from "react"

type ExecutionView = Readonly<{
  mode: "MANUAL_MESSAGING_MODE"
  activity: null | Readonly<{
    id: string
    title: string
    description: string | null
    executionType: string | null
    channel: string | null
    dueAt: string
    due: boolean
    impactNumber: number | null
    cadenceInstanceId: string | null
    reason: string | null
  }>
  commitments: ReadonlyArray<{
    id: string
    promisedBy: string
    type: string
    dueAt: string
    description: string
  }>
  reactivation: Readonly<{
    contextRequired: boolean
    canRecommendMessage: boolean
  }>
}>

export function OpportunityExecutionCard({ opportunityId }: Readonly<{ opportunityId: string }>) {
  const [view, setView] = useState<ExecutionView | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState("")
  const [contextMode, setContextMode] = useState<"reply" | "call" | "callback" | null>(null)
  const [callbackAt, setCallbackAt] = useState("")
  const [callbackDescription, setCallbackDescription] = useState("")

  const endpoint = `/api/opportunities/${encodeURIComponent(opportunityId)}/execution`

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(endpoint, { cache: "no-store" })
      const body = await response.json() as ExecutionView & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? "Não foi possível carregar a execução comercial.")
      }
      setView(body)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar a execução comercial.")
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    void load()
  }, [load])

  async function command(payload: Record<string, unknown>) {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await response.json() as ExecutionView & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? "Não foi possível registrar a ação.")
      }
      setView(body)
      setContext("")
      setContextMode(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar a ação.")
    } finally {
      setSubmitting(false)
    }
  }

  const activity = view?.activity
  const executionType = activity?.executionType

  return (
    <section aria-labelledby="r2-execution-title" className="rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D0B96C]">R2 Commercial Execution</p>
          <h2 id="r2-execution-title" className="mt-2 text-lg font-semibold">Faça isso agora</h2>
        </div>
        <span className="rounded-full border border-[var(--gorila-line)] px-2.5 py-1 text-[10px] font-semibold text-[var(--gorila-text-muted)]">
          Mensagens manuais
        </span>
      </div>

      {loading ? <p role="status" className="mt-4 text-sm text-[var(--gorila-text-muted)]">Organizando próxima ação…</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-red-300">{error}</p> : null}

      {!loading && activity ? (
        <div className="mt-4">
          <p className="text-base font-semibold">{activity.title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--gorila-text-muted)]">{activity.reason ?? activity.description}</p>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div><dt className="text-[var(--gorila-text-muted)]">Quando</dt><dd className="mt-1 font-medium">{activity.due ? "Agora" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(activity.dueAt))}</dd></div>
            <div><dt className="text-[var(--gorila-text-muted)]">Canal</dt><dd className="mt-1 font-medium">{activity.channel ?? "Sistema"}</dd></div>
            <div><dt className="text-[var(--gorila-text-muted)]">Cadência</dt><dd className="mt-1 font-medium">{activity.impactNumber ? `Impacto ${activity.impactNumber}/7` : "Contextual"}</dd></div>
          </dl>

          {executionType === "REACTIVATION_CONTEXT_REQUIRED" ? (
            <div className="mt-4 rounded-xl border border-[#D0B96C]/25 bg-[#D0B96C]/5 p-4">
              <p className="text-sm font-medium">Antes de reativar este contato, preciso saber onde a conversa parou.</p>
              <textarea
                aria-label="Contexto atual da reativação"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="Cole as últimas mensagens ou adicione um resumo curto"
                rows={4}
                maxLength={5000}
                className="mt-3 w-full rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-3 py-2 text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={submitting || !context.trim()} onClick={() => void command({ type: "REACTIVATION_CONTEXT", activityId: activity.id, cycleId: activity.cadenceInstanceId, context })} className="rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Analisar contexto</button>
                <button disabled={submitting} onClick={() => void command({ type: "NEVER_REPLIED", activityId: activity.id, cycleId: activity.cadenceInstanceId })} className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold">Nunca respondeu</button>
                <button disabled={submitting} onClick={() => void command({ type: "NO_PREVIOUS_CONVERSATION", activityId: activity.id, cycleId: activity.cadenceInstanceId })} className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold">Não houve conversa anterior</button>
              </div>
            </div>
          ) : null}

          {(executionType === "NEW_LEAD_FIRST_CONTACT" || executionType === "CADENCE_WHATSAPP" || executionType === "REACTIVATION_CONTACT" || executionType === "CALLBACK_RECOVERY" || executionType === "NO_SHOW_RECOVERY" || executionType === "STRATEGIC_FOLLOW_UP") ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={submitting} onClick={() => void command({ type: "MESSAGE_SENT", activityId: activity.id })} className="rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Mensagem enviada</button>
              <span className="self-center text-xs text-[var(--gorila-text-muted)]">O R2 não envia WhatsApp.</span>
            </div>
          ) : null}

          {executionType === "CADENCE_CALL" ? (
            <div className="mt-4">
              <p className="text-sm font-medium">Registrar resultado da ligação</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button disabled={submitting} onClick={() => setContextMode("call") } className="rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white">Atendeu</button>
                <button disabled={submitting} onClick={() => void command({ type: "CALL_NO_ANSWER", activityId: activity.id })} className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold">Não atendeu</button>
              </div>
              {contextMode === "call" ? (
                <div className="mt-3">
                  <textarea aria-label="Contexto da ligação" value={context} onChange={(event) => setContext(event.target.value)} rows={3} className="w-full rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-3 py-2 text-sm" />
                  <button disabled={submitting || !context.trim()} onClick={() => void command({ type: "CALL_ANSWERED", activityId: activity.id, context })} className="mt-2 rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Salvar ligação e recalcular</button>
                </div>
              ) : null}
            </div>
          ) : null}

          {executionType === "RESPONSE_CHECK" && activity.due ? (
            <div className="mt-4">
              <p className="text-sm font-medium">O cliente respondeu?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button disabled={submitting} onClick={() => setContextMode("reply") } className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold">Respondeu</button>
                <button disabled={submitting} onClick={() => void command({ type: "NO_RESPONSE", activityId: activity.id })} className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold">Não respondeu</button>
              </div>
              {contextMode === "reply" ? (
                <div className="mt-3">
                  <textarea aria-label="Resposta atual do cliente" value={context} onChange={(event) => setContext(event.target.value)} rows={3} className="w-full rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-3 py-2 text-sm" />
                  <button disabled={submitting || !context.trim()} onClick={() => void command({ type: "REPLIED", activityId: activity.id, context })} className="mt-2 rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Salvar resposta e recalcular</button>
                </div>
              ) : null}
            </div>
          ) : null}

          {executionType === "CALLBACK" ? (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <button disabled={submitting} onClick={() => setContextMode("callback") } className="rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white">Atendeu</button>
                <button disabled={submitting} onClick={() => void command({ type: "CALLBACK_NO_ANSWER", activityId: activity.id })} className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-xs font-semibold">Não atendeu</button>
              </div>
              {contextMode === "callback" ? (
                <div className="mt-3">
                  <textarea aria-label="Contexto do callback" value={context} onChange={(event) => setContext(event.target.value)} rows={3} className="w-full rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-3 py-2 text-sm" />
                  <button disabled={submitting || !context.trim()} onClick={() => void command({ type: "CALLBACK_ANSWERED", activityId: activity.id, context })} className="mt-2 rounded-lg bg-[#697842] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Salvar callback e recalcular</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && !activity ? <p className="mt-4 text-sm text-[var(--gorila-text-muted)]">Nenhuma ação pendente. O detector do R2 revisará esta oportunidade.</p> : null}

      {view?.commitments.length ? (
        <div className="mt-4 border-t border-[var(--gorila-line)] pt-3 text-xs text-[var(--gorila-text-muted)]">
          Próximo compromisso: {view.commitments[0].description} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(view.commitments[0].dueAt))}
        </div>
      ) : null}

      {!loading ? (
        <details className="mt-4 border-t border-[var(--gorila-line)] pt-3">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--gorila-text-muted)]">Registrar retorno combinado</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-[var(--gorila-text-muted)]">Data e hora
              <input type="datetime-local" value={callbackAt} onChange={(event) => setCallbackAt(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-3 py-2 text-sm" />
            </label>
            <label className="text-xs text-[var(--gorila-text-muted)]">O que foi combinado
              <input value={callbackDescription} onChange={(event) => setCallbackDescription(event.target.value)} placeholder="Ex.: cliente pediu ligação às 10h" className="mt-1 w-full rounded-lg border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-3 py-2 text-sm" />
            </label>
          </div>
          <button
            disabled={submitting || !callbackAt || !callbackDescription.trim()}
            onClick={() => void command({
              type: "SCHEDULE_CALLBACK",
              dueAt: new Date(callbackAt).toISOString(),
              description: callbackDescription,
              promisedBy: "CUSTOMER",
              sourceEventId: `manual-callback:${opportunityId}:${callbackAt}`,
            })}
            className="mt-3 rounded-lg border border-[#D0B96C]/35 bg-[#D0B96C]/10 px-3 py-2 text-xs font-semibold text-[#D0B96C] disabled:opacity-50"
          >
            Agendar callback
          </button>
        </details>
      ) : null}

      {!loading ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[var(--gorila-text-muted)]">Compliance de contato</summary>
          <p className="mt-2 text-xs text-[var(--gorila-text-muted)]">Use apenas quando o cliente pedir inequivocamente para não receber novos contatos.</p>
          <button
            disabled={submitting}
            onClick={() => {
              if (window.confirm("Confirmar bloqueio de toda abordagem e reativação futura para este contato?")) {
                void command({ type: "DO_NOT_CONTACT" })
              }
            }}
            className="mt-2 rounded-lg border border-red-400/25 px-3 py-2 text-xs font-semibold text-red-300"
          >
            Não contatar novamente
          </button>
        </details>
      ) : null}
    </section>
  )
}
