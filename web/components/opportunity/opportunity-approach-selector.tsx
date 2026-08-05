import {
  updateLeadApproachAction,
} from "@/app/opportunities/[opportunityId]/actions"

type OpportunityApproachSelectorProps = {
  opportunityId: string
  leadId: string
  approachType?:
    | "new"
    | "reactivation"
    | null
}

export function OpportunityApproachSelector({
  opportunityId,
  leadId,
  approachType,
}: OpportunityApproachSelectorProps) {
  const updateApproach =
    updateLeadApproachAction.bind(
      null,
      opportunityId,
      leadId,
    )

  return (
    <section className="border-b border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] px-6 py-5 sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
          Tipo de atendimento
        </p>

        <p className="mt-2 text-sm text-[var(--gorila-text-muted)]">
          Defina como o R2 deve conduzir este contato.
        </p>
      </div>

      <form
        action={updateApproach}
        className="mt-4 flex flex-wrap gap-3"
      >
        <button
          type="submit"
          name="approachType"
          value="NEW"
          aria-pressed={
            approachType === "new"
          }
          className={
            approachType === "new"
              ? "rounded-xl border border-[#43A972]/50 bg-[#2F8F5B]/20 px-4 py-3 text-sm font-semibold text-[#6FD39B]"
              : "rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-4 py-3 text-sm font-semibold hover:border-[#43A972]/35 hover:text-[#6FD39B]"
          }
        >
          Novo atendimento
        </button>

        <button
          type="submit"
          name="approachType"
          value="REACTIVATION"
          aria-pressed={
            approachType ===
            "reactivation"
          }
          className={
            approachType ===
            "reactivation"
              ? "rounded-xl border border-[#D0B96C]/50 bg-[#D0B96C]/15 px-4 py-3 text-sm font-semibold text-[#E1CC7B]"
              : "rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-4 py-3 text-sm font-semibold hover:border-[#D0B96C]/35 hover:text-[#E1CC7B]"
          }
        >
          Reativação
        </button>
      </form>

      {approachType ? (
        <p className="mt-3 text-xs text-[var(--gorila-text-muted)]">
          Classificação atual:{" "}
          <strong className="text-[var(--gorila-text)]">
            {approachType === "new"
              ? "Novo atendimento"
              : "Reativação"}
          </strong>
        </p>
      ) : (
        <p className="mt-3 text-xs font-medium text-[#E1CC7B]">
          Este lead ainda não foi classificado.
        </p>
      )}
    </section>
  )
}