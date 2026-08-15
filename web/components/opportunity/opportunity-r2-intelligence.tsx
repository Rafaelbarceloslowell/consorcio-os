import {
  formatR2CommercialTechnique,
} from "@/application/opportunity/build-r2-commercial-playbook-recommendation"

import type {
  R2IntelligenceResult,
} from "@/application/r2/resolve-r2-intelligence"

import {
  OpportunityR2ConsultantFeedback,
} from "./opportunity-r2-consultant-feedback"

import type {
  R2ConsultantFeedbackRevision,
} from "./opportunity-r2-consultant-feedback"

export function OpportunityR2Intelligence({
  intelligence,
  opportunityId,
  onRevision,
  showFeedback = true,
}: Readonly<{
  intelligence: R2IntelligenceResult
  opportunityId?: string
  onRevision?: (
    revision: R2ConsultantFeedbackRevision,
  ) => void
  showFeedback?: boolean
}>) {
  const consortium =
    intelligence
      .consortiumRecommendation
      .topOptions[0] ?? null

  return (
    <section
      aria-labelledby="opportunity-r2-intelligence-title"
      className="border-b border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] px-6 py-6 sm:px-8"
      data-testid="opportunity-r2-intelligence"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8F9B63]">
            R2 Intelligence
          </p>
          <h2
            id="opportunity-r2-intelligence-title"
            className="mt-2 text-xl font-semibold"
          >
            Faça isso agora
          </h2>
        </div>
        <span className="rounded-full border border-[#8F9B63]/30 bg-[#8F9B63]/10 px-3 py-1 text-xs font-semibold text-[#CDD59B]">
          Confiança da intenção {intelligence.intentConfidence}
        </span>
      </div>

      <p className="mt-4 text-lg font-semibold">
        {intelligence.nextBestAction.title}
      </p>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--gorila-text-soft)]">
        {intelligence.explanation}
      </p>

      <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-line)] md:grid-cols-2">
        <Item
          label="Técnica comercial"
          value={formatR2CommercialTechnique(
            intelligence
              .commercialStrategy
              .effectivePrimaryTechnique,
          )}
        />
        <Item
          label={
            intelligence.customerBoundary?.terminal
              ? "Conduta de encerramento"
              : "Pergunte / combine"
          }
          value={
            intelligence
              .commercialStrategy
              .suggestedQuestion ??
            intelligence
              .commercialStrategy
              .suggestedNextStep
          }
        />
        <Item
          label="Consórcio"
          value={
            intelligence.customerBoundary?.terminal
              ? "Não se aplica ao encerramento atual."
              : consortium
              ? `${consortium.administratorId} · ${consortium.productLabel} · ${consortium.fitBand}`
              : intelligence
                  .consortiumRecommendation
                  .explanation
          }
        />
        <Item
          label="Aprendizado"
          value={
            intelligence.learningEvidence
              .explanation
          }
        />
        {intelligence.customerBoundary ? (
          <Item
            label="Fronteira do cliente"
            value={`${intelligence.customerBoundary.state} · contato proativo ${intelligence.customerBoundary.proactiveContactSuppressed ? "suprimido" : "permitido"} · motivo ${intelligence.reasonForRejectionConfidence}`}
          />
        ) : null}
      </dl>

      {intelligence.missingData.length > 0 ? (
        <p className="mt-4 text-sm text-[#D6B878]">
          Dados faltantes: {intelligence.missingData.join(" · ")}
        </p>
      ) : null}

      {intelligence.warnings.length > 0 ? (
        <details className="mt-3 text-sm text-[var(--gorila-text-soft)]">
          <summary className="cursor-pointer font-semibold text-[#D6B878]">
            Alertas de segurança
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {intelligence.warnings.map(
              (warning) => (
                <li key={warning}>
                  {warning}
                </li>
              ),
            )}
          </ul>
        </details>
      ) : null}

      {opportunityId && showFeedback ? (
        <OpportunityR2ConsultantFeedback
          opportunityId={opportunityId}
          intelligence={intelligence}
          onRevision={onRevision}
        />
      ) : null}
    </section>
  )
}

function Item({
  label,
  value,
}: Readonly<{
  label: string
  value: string
}>) {
  return (
    <div className="bg-[var(--gorila-surface)] p-4">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gorila-text-muted)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-6">
        {value}
      </dd>
    </div>
  )
}
