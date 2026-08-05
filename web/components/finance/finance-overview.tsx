import Link from "next/link"

import type {
  FinanceView,
} from "@/types/finance-operational"

export function FinanceOverview({
  view,
}: Readonly<{
  view: FinanceView
}>) {
  const metrics = [
    {
      label:
        "Crédito confirmado",
      value:
        view.summary
          .confirmedCreditValueLabel,
      support:
        `${view.summary.confirmedSalesCount} vendas ativas`,
    },
    {
      label:
        "Crédito aguardando assinatura",
      value:
        view.summary
          .pendingCreditValueLabel,
      support:
        `${view.summary.pendingSignatureCount} vendas pendentes`,
    },
    {
      label:
        "Comissão confirmada",
      value:
        view.summary
          .confirmedCommissionValueLabel,
      support:
        "Somente vendas ativas",
    },
    {
      label:
        "Comissão prevista",
      value:
        view.summary
          .forecastCommissionValueLabel,
      support:
        "Aguardando assinatura",
    },
  ]

  return (
    <main className="min-h-screen bg-[#0B0F0D] p-4 text-[#F5F7FA] sm:p-8">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#131814] shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <header className="flex flex-col gap-5 border-b border-white/[0.07] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              Controle financeiro
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              Financeiro
            </h1>
            <p className="mt-2 text-sm text-[#96A0AF]">
              Somente vendas fechadas entram nos indicadores financeiros.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.10] px-4 text-sm font-semibold text-[#B7C0CC] transition hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.04]"
          >
            Mission Control
          </Link>
        </header>

        <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"
            >
              <p className="text-xs text-[#697384]">
                {metric.label}
              </p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.035em]">
                {metric.value}
              </p>
              <p className="mt-2 text-xs text-[#96A0AF]">
                {metric.support}
              </p>
            </article>
          ))}
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-4">
            <p className="text-sm font-semibold text-amber-100">
              Recebimentos não são presumidos
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-100/65">
              O banco atual ainda não possui baixa individual de comissão ou parcela. O GorillaOS mostra valores confirmados e previstos, mas não marca dinheiro como recebido sem comprovação.
            </p>
          </div>
        </div>

        <div className="border-t border-white/[0.07] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.03em]">
                Vendas registradas
              </h2>
              <p className="mt-1 text-sm text-[#697384]">
                {view.sales.length} registros no workspace
              </p>
            </div>

            {view.summary
              .cancelledSalesCount >
            0 ? (
              <span className="rounded-full border border-red-400/15 bg-red-500/5 px-3 py-1 text-xs text-red-200">
                {view.summary.cancelledSalesCount} canceladas
              </span>
            ) : null}
          </div>

          {view.sales.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/[0.09] px-5 py-14 text-center">
              <p className="text-sm font-semibold text-[#D6DBE3]">
                Nenhuma venda fechada registrada.
              </p>
              <p className="mt-2 text-sm text-[#697384]">
                Leads e propostas não aparecem como faturamento antes do fechamento confirmado da cota.
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4">
              {view.sales.map(
                (sale) => (
                  <li
                    key={sale.id}
                    className="rounded-2xl border border-white/[0.07] bg-black/10 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {sale.clientName}
                          </h3>
                          <span className="rounded-full border border-[#43A972]/20 bg-[#2F8F5B]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#63C68C]">
                            {sale.statusLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#697384]">
                          Contrato {sale.contractNumber} · proposta {sale.proposalCode}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-lg font-semibold">
                          {new Intl.NumberFormat(
                            "pt-BR",
                            {
                              style:
                                "currency",
                              currency:
                                "BRL",
                            },
                          ).format(
                            sale.creditValue,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-[#697384]">
                          Comissão{" "}
                          {new Intl.NumberFormat(
                            "pt-BR",
                            {
                              style:
                                "currency",
                              currency:
                                "BRL",
                            },
                          ).format(
                            sale.commissionValue,
                          )}{" "}
                          ({sale.commissionPercent}%)
                        </p>
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-4 border-t border-white/[0.06] pt-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <Data label="Administradora">
                        {sale.administratorName}
                      </Data>
                      <Data label="Grupo e cota">
                        {sale.groupNumber} · {sale.quotaNumber}
                      </Data>
                      <Data label="Consultor">
                        {sale.consultantName}
                      </Data>
                      <Data label="Venda">
                        {sale.saleDateLabel}
                      </Data>
                      <Data label="Parcela">
                        {new Intl.NumberFormat(
                          "pt-BR",
                          {
                            style:
                              "currency",
                            currency:
                              "BRL",
                          },
                        ).format(
                          sale.installmentValue,
                        )}
                      </Data>
                      <Data label="Primeira parcela">
                        {sale.firstInstallmentDateLabel}
                      </Data>
                      <Data label="Pagamento">
                        {sale.paymentMethodLabel}
                      </Data>
                      <Data label="Cota">
                        {sale.quotaStatusLabel}
                      </Data>
                    </dl>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
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
