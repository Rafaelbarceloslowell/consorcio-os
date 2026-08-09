import Link from "next/link"

import type {
  OpportunityDetailsView,
} from "@/types/opportunity-details"

import {
  OPPORTUNITY_CONSORTIUM_LABELS,
  OPPORTUNITY_OUTCOME_LABELS,
  OPPORTUNITY_PRIORITY_LABELS,
} from "./opportunity-labels"

import {
  OpportunityContactContext,
} from "./opportunity-contact-context"

import {
  OpportunityApproachSelector,
} from "./opportunity-approach-selector"

import {
  OpportunitySuggestedMessage,
} from "./opportunity-suggested-message"

import {
  OpportunitySuggestedQuestions,
} from "./opportunity-suggested-questions"

import {
  OpportunityBriefing,
} from "./opportunity-briefing"

import {
  OpportunityManualWhatsAppIntake,
} from "./opportunity-manual-whatsapp-intake"

import {
  OpportunityR2Intelligence,
} from "./opportunity-r2-intelligence"

import {
  OpportunityExecutionCard,
} from "./opportunity-execution-card"

import type {
  R2IntelligenceResult,
} from "@/application/r2/resolve-r2-intelligence"

type OpportunityDetailsProps = {
  opportunity:
    OpportunityDetailsView
  intelligence?:
    R2IntelligenceResult | null
}

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value))
}

function formatOptionalDateTime(
  value: string | null,
): string {
  return value
    ? formatDateTime(value)
    : "N\u00e3o registrada"
}

export function OpportunityDetails({
  opportunity,
  intelligence = null,
}: OpportunityDetailsProps) {
  const statusLabel =
    opportunity.status === "open"
      ? "Aberta"
      : opportunity.outcome
        ? OPPORTUNITY_OUTCOME_LABELS[
            opportunity.outcome
          ]
        : "Encerrada"

  const displayTitle =
    opportunity.contactContext?.isReactivated
      ? `Reativa\u00e7\u00e3o \u2014 ${opportunity.originName}`
      : opportunity.title

  const opportunityPath =
    `/opportunities/${encodeURIComponent(
      opportunity.id,
    )}`

  const contactEditHref =
    opportunity.origin === "lead"
      ? `/leads/${encodeURIComponent(
          opportunity.leadId,
        )}/edit?returnTo=${encodeURIComponent(
          opportunityPath,
        )}`
      : `/clients/${encodeURIComponent(
          opportunity.clientId,
        )}/edit`

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Voltar ao Mission Control
        </Link>

        <section
          aria-labelledby="opportunity-title"
          className="gorila-material mt-6 overflow-hidden rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)]"
        >
          <header className="border-b border-[var(--gorila-line)] px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Oportunidade comercial
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1
                id="opportunity-title"
                className="text-3xl font-semibold tracking-[-0.045em]"
              >
                {displayTitle}
              </h1>
              <span className="rounded-full border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] px-3 py-1 text-xs font-semibold">
                {statusLabel}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Link
                  href={contactEditHref}
                  className="rounded-lg border border-[#D0B96C]/35 bg-[#D0B96C]/10 px-3 py-2 text-sm font-medium text-[#E0CF8A] hover:bg-[#D0B96C]/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B96C]"
                >
                  Editar dados do contato
                </Link>

                {opportunity.status === "open" ? (
                  <Link
                    href={`/opportunities/${encodeURIComponent(
                      opportunity.id,
                    )}/learning`}
                    className="rounded-lg border border-[#43A972]/35 bg-[#2F8F5B]/10 px-3 py-2 text-sm font-medium text-[#63C68C] hover:bg-[#2F8F5B]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
                  >
                    Registrar aprendizado R2
                  </Link>
                ) : null}

                <Link
                  href={`/opportunities/${encodeURIComponent(opportunity.id)}/edit`}
                  className="rounded-lg border border-[var(--gorila-line)] px-3 py-2 text-sm font-medium text-[#43A972] hover:bg-[var(--gorila-surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
                >
                  Editar oportunidade
                </Link>
              </div>
            </div>
          </header>

          {opportunity.status === "open" ? (
            <div className="border-b border-[var(--gorila-line)] px-6 py-6 sm:px-8">
              <OpportunityExecutionCard opportunityId={opportunity.id} />
            </div>
          ) : null}

          {opportunity.origin === "lead" ? (
            <OpportunityApproachSelector
              opportunityId={opportunity.id}
              leadId={opportunity.leadId}
              approachType={
                opportunity.contactContext
                  ?.approachType ?? null
              }
            />
          ) : null}

          {opportunity.contactContext ? (
            <OpportunityContactContext
              contactContext={
                opportunity.contactContext
              }
            />
          ) : null}

          {opportunity.briefing ? (
            <OpportunityBriefing
              briefing={
                opportunity.briefing
              }
            />
          ) : null}

          {intelligence ? (
            <OpportunityR2Intelligence
              intelligence={intelligence}
            />
          ) : null}

          {opportunity.suggestedMessage ? (
            <OpportunitySuggestedMessage
              initialMessage={
                opportunity.suggestedMessage
              }
            />
          ) : null}

          {opportunity.suggestedQuestions?.length ? (
            <OpportunitySuggestedQuestions
              questions={
                opportunity.suggestedQuestions
              }
            />
          ) : null}

          {opportunity.contactContext ? (
            <OpportunityManualWhatsAppIntake
              opportunityId={
                opportunity.id
              }
              initialMemory={
                opportunity.conversationMemory
              }
              contactName={
                opportunity.originName
              }
              approachType={
                opportunity.contactContext
                  ?.approachType ?? null
              }
            />
          ) : null}

          <dl className="grid gap-px bg-[var(--gorila-line)] sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label="Origem"
              value={`${opportunity.origin === "lead" ? "Lead" : "Cliente"} \u00b7 ${opportunity.originName}`}
            />
            <Detail
              label={"Respons\u00e1vel"}
              value={opportunity.consultantName}
            />
            <Detail
              label={"Tipo de cons\u00f3rcio"}
              value={
                OPPORTUNITY_CONSORTIUM_LABELS[
                  opportunity.consortiumType
                ]
              }
            />
            <Detail
              label="Prioridade"
              value={
                OPPORTUNITY_PRIORITY_LABELS[
                  opportunity.priority
                ]
              }
            />
            <Detail
              label="Score"
              value={String(
                opportunity.score,
              )}
            />
            <Detail
              label={"Vers\u00e3o"}
              value={String(
                opportunity.version,
              )}
            />
            <Detail
              label="Fase"
              value={opportunity.phaseName}
            />
            <Detail
              label="Estado"
              value={opportunity.stateName}
            />
            <Detail
              label="Resultado"
              value={
                opportunity.outcome
                  ? OPPORTUNITY_OUTCOME_LABELS[
                      opportunity.outcome
                    ]
                  : "Sem resultado registrado"
              }
            />
            <Detail
              label="Entrada no estado"
              value={formatDateTime(
                opportunity.stateEnteredAt,
              )}
            />
            <Detail
              label={"\u00daltima intera\u00e7\u00e3o"}
              value={formatOptionalDateTime(
                opportunity.lastInteractionAt,
              )}
            />
            <Detail
              label="Encerramento"
              value={formatOptionalDateTime(
                opportunity.closedAt,
              )}
            />
            <Detail
              label="Criada em"
              value={formatDateTime(
                opportunity.createdAt,
              )}
            />
            <Detail
              label="Atualizada em"
              value={formatDateTime(
                opportunity.updatedAt,
              )}
            />
            <Detail
              label="ID"
              value={opportunity.id}
            />
          </dl>
        </section>
      </div>
    </main>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-[var(--gorila-surface)] px-6 py-5 sm:px-8">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gorila-text-muted)]">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium">
        {value}
      </dd>
    </div>
  )
}
