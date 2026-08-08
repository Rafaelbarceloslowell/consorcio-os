"use client"

import {
  useState,
} from "react"

import {
  analyzeManualWhatsAppMessage,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import {
  buildManualWhatsAppReply,
} from "@/application/opportunity/build-manual-whatsapp-reply"

import {
  buildR2CommercialPlaybookRecommendation,
  formatR2CommercialTechnique,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import {
  buildNextGoal,
} from "@/application/opportunity/conversation/build-next-goal"

import type {
  ConversationStage,
} from "@/application/opportunity/conversation/conversation-stage"

import type {
  ManualWhatsAppAnalysis,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import type {
  OpportunityConversationMemoryView,
} from "@/types/opportunity-details"

import type {
  R2IntelligenceResult,
} from "@/application/r2/resolve-r2-intelligence"

import {
  OpportunityR2Intelligence,
} from "./opportunity-r2-intelligence"

type OpportunityManualWhatsAppIntakeProps = {
  opportunityId?: string
  initialMemory?:
    | OpportunityConversationMemoryView
    | null
  contactName: string
  approachType?:
    | "new"
    | "reactivation"
    | null
}

function formatConversationStage(
  stage: ManualWhatsAppAnalysis["stage"],
): string {
  switch (stage) {
    case "opening":
      return "Abertura"
    case "discovery":
      return "Descoberta"
    case "diagnosis":
      return "Diagn\u00f3stico"
    case "qualification":
      return "Qualifica\u00e7\u00e3o"
    case "strategy":
      return "Estrat\u00e9gia"
    case "call_to_action":
      return "Pr\u00f3ximo passo"
    case "follow_up":
      return "Acompanhamento"
  }
}

function mapConversationStage(
  stage: ManualWhatsAppAnalysis["stage"],
): ConversationStage {
  switch (stage) {
    case "opening":
      return "opening"
    case "discovery":
      return "discovery"
    case "diagnosis":
      return "diagnosis"
    case "qualification":
      return "qualification"
    case "strategy":
      return "strategy"
    case "call_to_action":
      return "meeting"
    case "follow_up":
      return "follow_up"
  }
}

function formatStoredConversationStage(
  stage: OpportunityConversationMemoryView["stage"],
): string {
  switch (stage) {
    case "opening":
      return "Abertura"
    case "rapport":
      return "Conex\u00e3o"
    case "discovery":
      return "Descoberta"
    case "qualification":
      return "Qualifica\u00e7\u00e3o"
    case "diagnosis":
      return "Diagn\u00f3stico"
    case "strategy":
      return "Estrat\u00e9gia"
    case "meeting":
      return "Reuni\u00e3o"
    case "follow_up":
      return "Acompanhamento"
    case "closing":
      return "Fechamento"
  }
}

function formatStoredConversationGoal(
  goal: OpportunityConversationMemoryView["goal"],
): string {
  switch (goal) {
    case "get_first_response":
      return "Conseguir a primeira resposta"
    case "understand_interest_area":
      return "Entender a \u00e1rea de interesse"
    case "understand_project_purpose":
      return "Entender a finalidade do projeto"
    case "understand_timing":
      return "Entender o prazo"
    case "understand_budget":
      return "Entender o or\u00e7amento"
    case "understand_objection":
      return "Entender a obje\u00e7\u00e3o"
    case "present_strategy":
      return "Apresentar a estrat\u00e9gia"
    case "schedule_meeting":
      return "Agendar uma conversa"
    case "confirm_follow_up":
      return "Confirmar o retorno"
    case "close_next_step":
      return "Fechar o pr\u00f3ximo passo"
  }
}

function formatMemoryDate(
  value: string | null,
): string {
  if (!value) {
    return "Data n\u00e3o registrada"
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      dateStyle:
        "short",
      timeStyle:
        "short",
    },
  ).format(date)
}

export function OpportunityManualWhatsAppIntake({
  opportunityId,
  initialMemory,
  contactName,
  approachType,
}: OpportunityManualWhatsAppIntakeProps) {
  const resolvedApproachType =
    approachType === undefined
      ? "new"
      : approachType

  const isReactivation =
    resolvedApproachType ===
    "reactivation"

  const [incomingMessage, setIncomingMessage] =
    useState("")
  const [analysis, setAnalysis] =
    useState<ManualWhatsAppAnalysis | null>(null)
  const [reply, setReply] =
    useState("")
  const [copyStatus, setCopyStatus] =
    useState("")
  const [memoryStatus, setMemoryStatus] =
    useState("")
  const [intelligence, setIntelligence] =
    useState<R2IntelligenceResult | null>(null)
  const [isSavingMemory, setIsSavingMemory] =
    useState(false)

  const commercialGoal =
    analysis && resolvedApproachType
      ? buildNextGoal({
          approachType:
            resolvedApproachType,
          stage: mapConversationStage(
            analysis.stage,
          ),
        })
      : null

  const commercialPlaybook =
    analysis && resolvedApproachType
      ? buildR2CommercialPlaybookRecommendation({
          approachType:
            resolvedApproachType,
          analysis,
        })
      : null

  async function handleAnalyze() {
    let nextAnalysis =
      analyzeManualWhatsAppMessage(
        incomingMessage,
        {
          approachType:
            resolvedApproachType,
        },
      )

    let nextReply =
      buildManualWhatsAppReply({
        contactName,
        incomingMessage,
        approachType:
          resolvedApproachType,
        analysis: nextAnalysis,
      })

    setCopyStatus("")
    setMemoryStatus("")
    setIntelligence(null)

    if (opportunityId) {
      setIsSavingMemory(true)

      try {
        const response =
          await fetch(
            `/api/opportunities/${encodeURIComponent(
              opportunityId,
            )}/r2-intelligence`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                incomingMessage,
              }),
            },
          )
        const responseBody =
          await response.json() as {
            error?: string
            analysis?: ManualWhatsAppAnalysis
            reply?: string | null
            intelligence?: R2IntelligenceResult
          }

        if (
          !response.ok ||
          !responseBody.analysis ||
          !responseBody.intelligence
        ) {
          throw new Error(
            responseBody.error ??
              "N\u00e3o foi poss\u00edvel concluir a an\u00e1lise do R2.",
          )
        }

        nextAnalysis =
          responseBody.analysis
        nextReply =
          responseBody.reply ?? null
        setIntelligence(
          responseBody.intelligence,
        )
      } catch (error) {
        setAnalysis(null)
        setReply("")
        setMemoryStatus(
          error instanceof Error
            ? error.message
            : "N\u00e3o foi poss\u00edvel concluir a an\u00e1lise do R2.",
        )
        setIsSavingMemory(false)
        return
      }
    }

    setAnalysis(nextAnalysis)
    setReply(nextReply ?? "")

    if (
      !nextAnalysis ||
      !resolvedApproachType ||
      !opportunityId
    ) {
      return
    }

    const nextStage =
      mapConversationStage(
        nextAnalysis.stage,
      )

    const nextCommercialGoal =
      buildNextGoal({
        approachType:
          resolvedApproachType,
        stage: nextStage,
      })

    setIsSavingMemory(true)

    try {
      const response =
        await fetch(
          `/api/opportunities/${encodeURIComponent(
            opportunityId,
          )}/conversation-memory`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              stage: nextStage,
              goal:
                nextCommercialGoal.goal,
              intent:
                nextAnalysis.intent,
              incomingMessage,
              suggestedReply:
                nextReply,
            }),
          },
        )

      const responseBody =
        await response.json() as {
          error?: string
          message?: string
        }

      if (!response.ok) {
        throw new Error(
          responseBody.error ??
            "N\u00e3o foi poss\u00edvel salvar a mem\u00f3ria comercial.",
        )
      }

      setMemoryStatus(
        "Mem\u00f3ria comercial salva. O R2 vai lembrar onde a conversa parou.",
      )
    } catch (error) {
      setMemoryStatus(
        error instanceof Error
          ? error.message
          : "N\u00e3o foi poss\u00edvel salvar a mem\u00f3ria comercial.",
      )
    } finally {
      setIsSavingMemory(false)
    }
  }

  function handleClear() {
    setIncomingMessage("")
    setAnalysis(null)
    setReply("")
    setCopyStatus("")
    setMemoryStatus("")
    setIntelligence(null)
    setIsSavingMemory(false)
  }

  async function handleCopy() {
    if (!reply.trim()) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        reply.trim(),
      )
      setCopyStatus(
        "Resposta copiada. Revise antes de enviar manualmente.",
      )
    } catch {
      setCopyStatus(
        "N\u00e3o foi poss\u00edvel copiar automaticamente. Selecione o texto e copie manualmente.",
      )
    }
  }

  return (
    <section
      aria-labelledby="opportunity-manual-whatsapp-title"
      className="border-b border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] px-6 py-6 sm:px-8"
      data-testid="opportunity-manual-whatsapp-intake"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
            {"WhatsApp assistido \u00b7 piloto sem API"}
          </p>
          <h2
            id="opportunity-manual-whatsapp-title"
            className="mt-2 text-xl font-semibold tracking-[-0.035em]"
          >
            {isReactivation
              ? "Informar contexto recente"
              : "Analisar mensagem recebida"}
          </h2>
        </div>
        <span className="rounded-full border border-[#43A972]/30 bg-[#2F8F5B]/12 px-3 py-1 text-xs font-semibold text-[#6FD39B]">
          {"Somente nesta sess\u00e3o"}
        </span>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--gorila-text-soft)]">
        {isReactivation
          ? "Cole as \u00faltimas mensagens ou escreva um resumo do hist\u00f3rico, deixando claro o que o cliente queria, o que voc\u00ea fez e como ele respondeu. O R2 separa a fala do cliente da a\u00e7\u00e3o do consultor antes de preparar qualquer nova mensagem."
          : "Cole abaixo a \u00faltima mensagem recebida do cliente. A an\u00e1lise \u00e9 local, n\u00e3o l\u00ea o WhatsApp e salva apenas a mem\u00f3ria comercial no GorillaOS. Nenhuma mensagem ser\u00e1 enviada automaticamente."}
      </p>

      {initialMemory ? (
        <div
          className="mt-5 rounded-2xl border border-[#43A972]/20 bg-[#2F8F5B]/[0.065] p-4"
          data-testid="commercial-conversation-memory"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6FD39B]">
                {isReactivation
                  ? "\u00daltimo contexto analisado"
                  : "\u00daltima atualiza\u00e7\u00e3o manual"}
              </p>
              <p className="mt-2 text-xs text-[var(--gorila-text-muted)]">
                {formatMemoryDate(
                  initialMemory.analyzedAt ??
                    initialMemory.updatedAt,
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ResultItem
              label={"\u00daltimo est\u00e1gio"}
              value={formatStoredConversationStage(
                initialMemory.stage,
              )}
            />
            <ResultItem
              label={"Objetivo atual"}
              value={formatStoredConversationGoal(
                initialMemory.goal,
              )}
            />
          </div>

          {initialMemory.lastIncomingMessage ? (
            <div className="mt-3 rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gorila-text-muted)]">
                {isReactivation
                  ? "\u00daltimo contexto informado"
                  : "\u00daltima mensagem recebida"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {
                  initialMemory.lastIncomingMessage
                }
              </p>
            </div>
          ) : null}

          {initialMemory.lastSuggestedReply ? (
            <div className="mt-3 rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gorila-text-muted)]">
                {"\u00daltima resposta preparada"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {
                  initialMemory.lastSuggestedReply
                }
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <label
        htmlFor="opportunity-manual-whatsapp-message"
        className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gorila-text-muted)]"
      >
        {isReactivation
          ? "\u00daltimas mensagens ou resumo do hist\u00f3rico"
          : "Mensagem recebida do cliente"}
      </label>
      <textarea
        id="opportunity-manual-whatsapp-message"
        rows={5}
        value={incomingMessage}
        onChange={(event) => {
          setIncomingMessage(
            event.target.value,
          )
          setAnalysis(null)
          setReply("")
          setCopyStatus("")
          setMemoryStatus("")
          setIntelligence(null)
        }}
        placeholder={
          isReactivation
            ? "Ex.: O cliente buscava um Corolla. Tentei marcar uma reuni\u00e3o, mas ele n\u00e3o respondeu mais. Meu \u00faltimo contato foi em 23/04/2026.\n\nOu use: Cliente: ... / Consultor: ..."
            : "Cole aqui a mensagem recebida no WhatsApp"
        }
        className="mt-3 w-full resize-y rounded-2xl border border-white/[0.10] bg-[#0F1412] px-4 py-3 text-sm leading-6 text-[#F5F7FA] outline-none transition focus:border-[#43A972]/55 focus:ring-4 focus:ring-[#2F8F5B]/10"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={
            !incomingMessage.trim() ||
            isSavingMemory
          }
          onClick={handleAnalyze}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#43A972]/30 bg-[#2F8F5B]/15 px-4 text-xs font-semibold text-[#6FD39B] transition hover:-translate-y-0.5 hover:border-[#43A972]/45 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isSavingMemory
            ? "Analisando e salvando..."
            : isReactivation
              ? "Analisar contexto"
              : "Analisar mensagem"}
        </button>
        <button
          type="button"
          disabled={
            !incomingMessage &&
            !analysis &&
            !reply
          }
          onClick={handleClear}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] px-4 text-xs font-semibold text-[#D6DBE3] transition hover:-translate-y-0.5 hover:border-white/[0.18] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          Limpar
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#697384]">
        {"A mem\u00f3ria comercial ser\u00e1 salva no GorillaOS. O consultor continua respons\u00e1vel por revisar e enviar a resposta no WhatsApp."}
      </p>

      <p
        aria-live="polite"
        className="mt-2 min-h-5 text-xs text-[#6FD39B]"
      >
        {memoryStatus}
      </p>

      {intelligence ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--gorila-line)]">
          <OpportunityR2Intelligence
            intelligence={intelligence}
          />
        </div>
      ) : null}

      {analysis ? (
        <div
          className="mt-5 rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.065] p-4"
          data-testid="manual-whatsapp-analysis"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <ResultItem
              label={"Est\u00e1gio atual"}
              value={formatConversationStage(
                analysis.stage,
              )}
            />
            {commercialGoal ? (
              <ResultItem
                label={"Objetivo comercial"}
                value={`${commercialGoal.label}. ${commercialGoal.explanation}`}
              />
            ) : null}

            <ResultItem
              label="Sinal identificado"
              value={analysis.label}
            />
            <ResultItem
              label="Leitura do R2"
              value={analysis.summary}
            />
            <ResultItem
              label={"\u0050r\u00f3xima a\u00e7\u00e3o"}
              value={analysis.recommendedAction}
            />
            {commercialPlaybook ? (
              <>
                <ResultItem
                  label="Base do playbook"
                  value={formatR2CommercialTechnique(
                    commercialPlaybook.foundation,
                  )}
                />
                <ResultItem
                  label="Técnica principal"
                  value={formatR2CommercialTechnique(
                    commercialPlaybook.primaryTechnique,
                  )}
                />
                <ResultItem
                  label="Técnicas de apoio"
                  value={commercialPlaybook
                    .supportingTechniques
                    .map(
                      formatR2CommercialTechnique,
                    )
                    .join(" · ")}
                />
                <ResultItem
                  label="Objetivo comercial"
                  value={commercialPlaybook.objective}
                />
                <ResultItem
                  label="Por que agora"
                  value={commercialPlaybook.rationale}
                />
                <ResultItem
                  label="Orientação ao consultor"
                  value={commercialPlaybook.consultantInstruction}
                />
                <ResultItem
                  label="CTA recomendado"
                  value={commercialPlaybook.callToAction}
                />
                <ResultItem
                  label="Evitar agora"
                  value={commercialPlaybook.avoid.join(
                    " ",
                  )}
                />
              </>
            ) : null}
          </div>

          {commercialPlaybook
            ?.socialProof
            .shouldAskConsultant ? (
            <div
              className="mt-4 rounded-xl border border-[#D9A441]/30 bg-[#D9A441]/[0.08] p-4"
              data-testid="r2-social-proof-consultant-prompt"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F4C96B]">
                Prova social · confirmação humana obrigatória
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--gorila-text)]">
                {
                  commercialPlaybook
                    .socialProof.prompt
                }
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--gorila-text-muted)]">
                {
                  commercialPlaybook
                    .socialProof.rule
                }
              </p>
            </div>
          ) : null}

          <label
            htmlFor="opportunity-manual-whatsapp-reply"
            className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#6FD39B]"
          >
            Resposta preparada pelo R2
          </label>
          <textarea
            id="opportunity-manual-whatsapp-reply"
            rows={5}
            value={reply}
            onChange={(event) => {
              setReply(event.target.value)
              setCopyStatus("")
            }}
            className="mt-3 w-full resize-y rounded-xl border border-white/[0.10] bg-[#0F1412] px-3 py-3 text-sm leading-6 text-[#F5F7FA] outline-none transition focus:border-[#43A972]/55 focus:ring-4 focus:ring-[#2F8F5B]/10"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!reply.trim()}
              onClick={handleCopy}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] px-3.5 text-xs font-semibold text-[#D6DBE3] transition hover:-translate-y-0.5 hover:border-white/[0.18] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >
              Copiar resposta
            </button>
            <span className="text-xs text-[#697384]">
              Envio continua manual pelo consultor.
            </span>
          </div>

          <p
            aria-live="polite"
            className="mt-2 min-h-5 text-xs text-[#6FD39B]"
          >
            {copyStatus}
          </p>
        </div>
      ) : null}
    </section>
  )
}

function ResultItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gorila-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--gorila-text)]">
        {value}
      </p>
    </div>
  )
}
