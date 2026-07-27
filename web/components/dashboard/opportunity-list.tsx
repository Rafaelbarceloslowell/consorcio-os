import Link from "next/link"

import type {
  MissionControlOpportunityView,
} from "@/types/dashboard"

import {
  OPPORTUNITY_CONSORTIUM_LABELS,
  OPPORTUNITY_OUTCOME_LABELS,
  OPPORTUNITY_PRIORITY_LABELS,
} from "@/components/opportunity/opportunity-labels"

type OpportunityListProps = {
  opportunities:
    MissionControlOpportunityView[]
}

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value))
}

export function OpportunityList({
  opportunities,
}: OpportunityListProps) {
  return (
    <section
      id="pipeline"
      aria-labelledby="opportunity-list-title"
      className="gorila-material overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#15191F]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_22px_48px_rgba(0,0,0,0.2)]"
    >
      <header className="flex items-end justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
            Pipeline comercial
          </p>
          <h2
            id="opportunity-list-title"
            className="mt-2 text-lg font-semibold tracking-[-0.035em] text-[#F5F7FA]"
          >
            Oportunidades
          </h2>
        </div>
        <Link
          href="/opportunities/new"
          className="shrink-0 rounded-lg border border-[#43A972]/40 px-3 py-2 text-sm font-medium text-[#63C68C] hover:bg-[#43A972]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Nova oportunidade
        </Link>
      </header>

      {opportunities.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[#96A0AF] sm:px-6">
          Nenhuma oportunidade encontrada.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {opportunities.map(
            (opportunity) => (
              <li
                key={opportunity.id}
                className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-[#F5F7FA]">
                      <Link
                        href={`/opportunities/${encodeURIComponent(
                          opportunity.id,
                        )}`}
                        className="underline-offset-4 hover:text-[#43A972] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
                      >
                      {opportunity.title}
                      </Link>
                    </h3>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#96A0AF]">
                      {opportunity.status ===
                      "closed"
                        ? (
                            opportunity.outcome
                              ? OPPORTUNITY_OUTCOME_LABELS[
                                  opportunity
                                    .outcome
                                ]
                              : "Encerrada"
                          )
                        : "Aberta"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#96A0AF]">
                    {opportunity.originName}
                    {" · "}
                    {opportunity.consultantName}
                  </p>
                  <p className="mt-1 text-xs text-[#697384]">
                    {
                      OPPORTUNITY_CONSORTIUM_LABELS[
                        opportunity
                          .consortiumType
                      ]
                    }
                    {" · "}
                    {
                      OPPORTUNITY_PRIORITY_LABELS[
                        opportunity
                          .priority
                      ]
                    }
                    {" · score "}
                    {opportunity.score}
                  </p>
                </div>

                <div className="text-xs text-[#96A0AF]">
                  <p>
                    {opportunity.phaseName}
                    {" · "}
                    {opportunity.stateName}
                  </p>
                  <p className="mt-2 text-[#697384]">
                    {opportunity
                      .lastInteractionAt
                      ? `Última interação: ${formatDateTime(
                          opportunity
                            .lastInteractionAt,
                        )}`
                      : "Sem interação registrada"}
                  </p>
                </div>

                <p className="text-xs text-[#697384] lg:text-right">
                  Atualizada em{" "}
                  {formatDateTime(
                    opportunity.updatedAt,
                  )}
                </p>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  )
}
