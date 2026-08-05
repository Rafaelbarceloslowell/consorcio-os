import type {
  OpportunityBriefingView,
} from "@/types/opportunity-details"

type OpportunityBriefingProps = {
  briefing: OpportunityBriefingView
}

export function OpportunityBriefing({
  briefing,
}: OpportunityBriefingProps) {
  const items = [
    {
      label: "Resumo do caso",
      value: briefing.summary,
    },
    {
      label: "Ponto de atenção",
      value: briefing.attentionPoint,
    },
    {
      label: "Foco da conversa",
      value: briefing.conversationFocus,
    },
    {
      label: "Próximo movimento",
      value: briefing.recommendedNextStep,
    },
  ]

  return (
    <section
      aria-labelledby="opportunity-briefing-title"
      className="border-b border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-6 py-6 sm:px-8"
      data-testid="opportunity-briefing"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
            Leitura rápida do R2
          </p>
          <h2
            id="opportunity-briefing-title"
            className="mt-2 text-xl font-semibold tracking-[-0.035em]"
          >
            Briefing da oportunidade
          </h2>
        </div>
        <span className="rounded-full border border-[#43A972]/30 bg-[#2F8F5B]/12 px-3 py-1 text-xs font-semibold text-[#6FD39B]">
          Antes do contato
        </span>
      </div>

      <dl className="mt-5 grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] p-4"
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gorila-text-muted)]">
              {item.label}
            </dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--gorila-text)]">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
