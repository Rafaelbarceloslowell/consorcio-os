import type {
  OpportunityContactContextView,
} from "@/types/opportunity-details"

type OpportunityContactContextProps = {
  contactContext:
    OpportunityContactContextView
}

function formatImportedAt(
  value: string | null,
): string {
  if (!value) {
    return "Não informada"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date)
}

export function OpportunityContactContext({
  contactContext,
}: OpportunityContactContextProps) {
  return (
    <section
      aria-labelledby="opportunity-contact-context-title"
      className="border-b border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] px-6 py-6 sm:px-8"
      data-testid="opportunity-contact-context"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
            Contexto do contato
          </p>
          <h2
            id="opportunity-contact-context-title"
            className="mt-2 text-xl font-semibold tracking-[-0.035em]"
          >
            {contactContext.sourceLabel}
          </h2>
        </div>

        {contactContext.isReactivated ? (
          <span className="rounded-full border border-[#43A972]/35 bg-[#2F8F5B]/15 px-3 py-1 text-xs font-semibold text-[#6FD39B]">
            Lead reativado
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoItem
          label="Telefone"
          value={
            contactContext.phone ??
            "Não informado"
          }
        />

        <InfoItem
          label="E-mail"
          value={
            contactContext.email ??
            "Não informado"
          }
        />

        <InfoItem
          label="Importado no GorillaOS"
          value={formatImportedAt(
            contactContext.importedAt,
          )}
        />

        <InfoItem
          label="Objetivo original"
          value={
            contactContext.objective ??
            "Não informado"
          }
        />

        <InfoItem
          label="Situação atual"
          value={
            contactContext.currentSituation ??
            "Não informada"
          }
        />
      </div>

      {contactContext.originalInformation ? (
        <div className="mt-4 rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gorila-text-muted)]">
            Informações originais
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--gorila-text)]">
            {
              contactContext.originalInformation
            }
          </p>
        </div>
      ) : null}
    </section>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gorila-text-muted)]">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6">
        {value}
      </p>
    </div>
  )
}
