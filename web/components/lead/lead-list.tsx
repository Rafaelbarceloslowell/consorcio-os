import Link from "next/link"

import { triageDataCrazyLeadAction } from "@/app/leads/actions"

import type {
  LeadListView,
} from "@/types/lead-list"

type LeadListProps = Readonly<{
  view: LeadListView
}>

export function LeadList({
  view,
}: LeadListProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section
        aria-labelledby="lead-list-title"
        className="gorila-material overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#15191F]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_22px_48px_rgba(0,0,0,0.2)]"
      >
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              Operação comercial
            </p>
            <h1
              id="lead-list-title"
              className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#F5F7FA]"
            >
              Leads
            </h1>
            <p className="mt-2 text-sm text-[#96A0AF]">
              {view.summaryLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="shrink-0 rounded-lg border border-white/[0.10] px-3 py-2 text-sm font-medium text-[#B7C0CC] transition hover:border-white/[0.18] hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
            >
              Mission Control
            </Link>

            <Link
              href="/leads/new"
              className="shrink-0 rounded-lg border border-[#43A972]/40 bg-[#2F8F5B]/10 px-3 py-2 text-sm font-medium text-[#63C68C] transition hover:bg-[#43A972]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
            >
              Novo lead
            </Link>
          </div>
        </header>

        {view.leads.length === 0 ? (
          <div
            role="status"
            className="px-5 py-12 text-center sm:px-6"
          >
            <p className="text-sm font-medium text-[#D6DBE3]">
              Ainda não existem leads cadastrados.
            </p>
            <p className="mt-2 text-sm text-[#96A0AF]">
              Cadastre o primeiro lead real para iniciar o atendimento comercial.
            </p>
            <Link
              href="/leads/new"
              className="mt-5 inline-flex rounded-lg border border-[#43A972]/40 bg-[#2F8F5B]/10 px-3 py-2 text-sm font-medium text-[#63C68C] hover:bg-[#43A972]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
            >
              Cadastrar primeiro lead
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 p-5 lg:grid-cols-2 sm:p-6">
            {view.leads.map(
              (lead) => (
                <li
                  key={lead.id}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-[#F5F7FA]">
                        {lead.name}
                      </h2>
                      {lead.companyName ? (
                        <p className="mt-1 truncate text-xs text-[#96A0AF]">
                          {lead.companyName}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={
                        lead.classification ===
                        "REACTIVATED"
                          ? "rounded-full border border-[#D0B96C]/25 bg-[#D0B96C]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D0B96C]"
                          : lead.classification === "UNTRIAGED"
                            ? "rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-200"
                          : "rounded-full border border-[#43A972]/20 bg-[#2F8F5B]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#63C68C]"
                      }
                    >
                      {lead.statusLabel}
                    </span>
                  </div>

                  <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
                    <Data label="Telefone">
                      {lead.phoneLabel}
                    </Data>
                    <Data label="E-mail">
                      <span className="break-all">
                        {lead.email}
                      </span>
                    </Data>
                    <Data label="Interesse">
                      {lead.consortiumTypeLabel}
                    </Data>
                    <Data label="Crédito desejado">
                      <span className="whitespace-nowrap tabular-nums">
                        {lead.desiredCreditValueLabel}
                      </span>
                    </Data>
                    <Data label="Prazo">
                      {lead.desiredTermLabel}
                    </Data>
                    <Data label="Origem">
                      {lead.sourceLabel}
                    </Data>
                    <Data label="Etapa">
                      {lead.pipelineStageName}
                    </Data>
                    <Data label="Consultor">
                      {lead.consultantName}
                    </Data>
                    <Data label="Score">
                      {lead.score}
                    </Data>
                    <Data label={lead.entryLabel}>
                      {lead.createdAtLabel}
                    </Data>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                    <Link
                      href={`/leads/${encodeURIComponent(
                        lead.id,
                      )}/edit`}
                      aria-label={`Editar dados de ${lead.name}`}
                      className="inline-flex rounded-lg border border-[#D0B96C]/25 bg-[#D0B96C]/8 px-3 py-2 text-xs font-semibold text-[#E0CF8A] transition hover:border-[#D0B96C]/45 hover:bg-[#D0B96C]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B96C]"
                    >
                      Editar dados
                    </Link>

                    {lead.canTriage ? (
                      <form
                        action={triageDataCrazyLeadAction.bind(null, lead.id)}
                        aria-label={`Classificar ${lead.name}`}
                        className="flex flex-wrap gap-2"
                      >
                        <button
                          type="submit"
                          name="approachType"
                          value="NEW"
                          className="rounded-lg border border-[#43A972]/35 bg-[#2F8F5B]/10 px-3 py-2 text-xs font-semibold text-[#63C68C] transition hover:bg-[#43A972]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
                        >
                          Novo
                        </button>
                        <button
                          type="submit"
                          name="approachType"
                          value="REACTIVATION"
                          className="rounded-lg border border-[#D0B96C]/35 bg-[#D0B96C]/8 px-3 py-2 text-xs font-semibold text-[#E0CF8A] transition hover:bg-[#D0B96C]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B96C]"
                        >
                          Reativação
                        </button>
                      </form>
                    ) : lead.opportunityHref ? (
                      <Link
                        href={lead.opportunityHref}
                        aria-label={`Abrir oportunidade de ${lead.name}`}
                        className="inline-flex rounded-lg border border-white/[0.10] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-[#D6DBE3] transition hover:border-[#43A972]/35 hover:bg-[#2F8F5B]/10 hover:text-[#63C68C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
                      >
                        Abrir oportunidade
                      </Link>
                    ) : (
                      <span className="self-center text-xs text-[#697384]">
                        Nenhuma oportunidade aberta.
                      </span>
                    )}
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        {view.pagination.totalPages > 1 ? (
          <nav
            aria-label="Paginação de leads"
            className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-4 text-xs text-[#96A0AF] sm:px-6"
          >
            {view.pagination.previousHref ? (
              <Link
                href={view.pagination.previousHref}
                className="rounded-lg border border-white/[0.10] px-3 py-2 font-semibold text-[#D6DBE3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
              >
                Anterior
              </Link>
            ) : <span />}
            <span>
              Página {view.pagination.page} de {view.pagination.totalPages}
            </span>
            {view.pagination.nextHref ? (
              <Link
                href={view.pagination.nextHref}
                className="rounded-lg border border-white/[0.10] px-3 py-2 font-semibold text-[#D6DBE3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
              >
                Próxima
              </Link>
            ) : <span />}
          </nav>
        ) : null}
      </section>
    </main>
  )
}

function Data({
  label,
  children,
}: Readonly<{
  label: string
  children: React.ReactNode
}>) {
  return (
    <div>
      <dt className="text-[#697384]">
        {label}
      </dt>
      <dd className="mt-1 text-[#D6DBE3]">
        {children}
      </dd>
    </div>
  )
}
