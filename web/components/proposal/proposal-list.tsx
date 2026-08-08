import Link from "next/link"

import type {
  ProposalListView,
} from "@/types/proposal-operational"

type ProposalAction = (
  formData: FormData,
) => Promise<void>

type ProposalListProps = Readonly<{
  view: ProposalListView
  sendAction: ProposalAction
  acceptAction: ProposalAction
  rejectAction: ProposalAction
  closeSaleAction: ProposalAction
}>

export function ProposalList({
  view,
  sendAction,
  acceptAction,
  rejectAction,
  closeSaleAction,
}: ProposalListProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section
        aria-labelledby="proposal-list-title"
        className="gorila-material overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#15191F]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_22px_48px_rgba(0,0,0,0.2)]"
      >
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              Negociação comercial
            </p>
            <h1
              id="proposal-list-title"
              className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#F5F7FA]"
            >
              Propostas
            </h1>
            <p className="mt-2 text-sm text-[#96A0AF]">
              {view.proposals.length}{" "}
              {view.proposals.length === 1
                ? "proposta registrada"
                : "propostas registradas"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/[0.10] px-3 py-2 text-sm font-medium text-[#B7C0CC] transition hover:border-white/[0.18] hover:bg-white/[0.04]"
            >
              Mission Control
            </Link>
            <Link
              href="/proposals/new"
              className="rounded-lg border border-[#43A972]/40 bg-[#2F8F5B]/10 px-3 py-2 text-sm font-medium text-[#63C68C] transition hover:bg-[#43A972]/15"
            >
              Nova proposta
            </Link>
          </div>
        </header>

        {view.proposals.length === 0 ? (
          <div
            role="status"
            className="px-5 py-12 text-center sm:px-6"
          >
            <p className="text-sm font-medium text-[#D6DBE3]">
              Ainda não existem propostas.
            </p>
            <p className="mt-2 text-sm text-[#96A0AF]">
              Crie uma proposta vinculada a um lead em atendimento.
            </p>
            <Link
              href="/proposals/new"
              className="mt-5 inline-flex rounded-lg border border-[#43A972]/40 bg-[#2F8F5B]/10 px-3 py-2 text-sm font-medium text-[#63C68C] hover:bg-[#43A972]/15"
            >
              Criar primeira proposta
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 p-5 lg:grid-cols-2 sm:p-6">
            {view.proposals.map(
              (proposal) => (
                <li
                  key={proposal.id}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697384]">
                        {proposal.code}
                      </p>
                      <h2 className="mt-1 truncate text-base font-semibold text-[#F5F7FA]">
                        {proposal.contactName}
                      </h2>
                    </div>
                    <span className="rounded-full border border-[#43A972]/20 bg-[#2F8F5B]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#63C68C]">
                      {proposal.statusLabel}
                    </span>
                  </div>

                  <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
                    <Data label="Administradora">
                      {proposal.administratorName}
                    </Data>
                    <Data label="Produto">
                      {proposal.consortiumName}
                    </Data>
                    <Data label="Crédito">
                      <span className="whitespace-nowrap tabular-nums">
                        {proposal.creditValueLabel}
                      </span>
                    </Data>
                    <Data label="Parcela">
                      <span className="whitespace-nowrap tabular-nums">
                        {proposal.installmentValueLabel}
                      </span>
                    </Data>
                    <Data label="Prazo">
                      {proposal.termMonths} meses
                    </Data>
                    <Data label="Validade">
                      {proposal.validUntilLabel}
                    </Data>
                    <Data label="Consultor">
                      {proposal.consultantName}
                    </Data>
                    <Data label="Criada em">
                      {proposal.createdAtLabel}
                    </Data>
                  </dl>

                  {proposal.rejectionReason ? (
                    <p className="mt-4 rounded-xl border border-red-400/15 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-200">
                      Motivo: {proposal.rejectionReason}
                    </p>
                  ) : null}

                  {proposal.status === "ACCEPTED" ? (
                    <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-amber-200">
                      Proposta aceita. Registre os dados da cota para concluir a venda.
                    </p>
                  ) : null}

                  {proposal.clientId ||
                  proposal.convertedClientId ? (
                    <p className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-[#B7C0CC]">
                      Cliente existente vinculado. O fechamento não criará outro cadastro.
                    </p>
                  ) : null}

                  {proposal.saleId ? (
                    <p className="mt-4 rounded-xl border border-[#43A972]/30 bg-[#2F8F5B]/10 px-3 py-2 text-xs text-[#63C68C]">
                      Venda registrada e jornada comercial concluída.
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                    {proposal.opportunityHref ? (
                      <Link
                        href={proposal.opportunityHref}
                        className="rounded-lg border border-white/[0.10] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-[#D6DBE3] hover:border-[#43A972]/35 hover:text-[#63C68C]"
                      >
                        Abrir oportunidade
                      </Link>
                    ) : null}

                    {proposal.status === "DRAFT" ? (
                      <form action={sendAction}>
                        <input
                          type="hidden"
                          name="proposalId"
                          value={proposal.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-[#43A972]/35 bg-[#2F8F5B]/10 px-3 py-2 text-xs font-semibold text-[#63C68C] hover:bg-[#43A972]/15"
                        >
                          Marcar como enviada
                        </button>
                      </form>
                    ) : null}

                    {proposal.status === "SENT" ? (
                      <form action={acceptAction}>
                        <input
                          type="hidden"
                          name="proposalId"
                          value={proposal.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-[#43A972]/35 bg-[#2F8F5B]/10 px-3 py-2 text-xs font-semibold text-[#63C68C] hover:bg-[#43A972]/15"
                        >
                          Registrar aceite
                        </button>
                      </form>
                    ) : null}
                  </div>

                  {proposal.status === "DRAFT" ||
                  proposal.status === "SENT" ? (
                    <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                      <summary className="cursor-pointer text-xs font-medium text-[#96A0AF]">
                        Rejeitar proposta
                      </summary>
                      <form
                        action={rejectAction}
                        className="mt-3 grid gap-3"
                      >
                        <input
                          type="hidden"
                          name="proposalId"
                          value={proposal.id}
                        />
                        <label className="text-xs text-[#96A0AF]">
                          Motivo
                          <textarea
                            name="rejectionReason"
                            required
                            rows={3}
                            maxLength={500}
                            className="mt-1 w-full rounded-lg border border-white/[0.10] bg-[#0F1412] px-3 py-2 text-sm text-[#F5F7FA]"
                          />
                        </label>
                        <button
                          type="submit"
                          className="justify-self-start rounded-lg border border-red-400/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10"
                        >
                          Confirmar rejeição
                        </button>
                      </form>
                    </details>
                  ) : null}

                  {proposal.status === "ACCEPTED" &&
                  !proposal.saleId ? (
                    <details className="mt-3 rounded-xl border border-[#43A972]/20 bg-[#2F8F5B]/5 px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold text-[#63C68C]">
                        Fechar venda
                      </summary>
                      <form
                        action={closeSaleAction}
                        className="mt-4 grid gap-3 sm:grid-cols-2"
                      >
                        <input
                          type="hidden"
                          name="proposalId"
                          value={proposal.id}
                        />

                        <SaleField label="Contrato">
                          <input
                            name="contractNumber"
                            required
                            maxLength={80}
                            className={inputClassName}
                          />
                        </SaleField>
                        <SaleField label="Número da cota">
                          <input
                            name="quotaNumber"
                            type="number"
                            min={1}
                            step={1}
                            required
                            className={inputClassName}
                          />
                        </SaleField>
                        <SaleField label="Forma de pagamento">
                          <select
                            name="paymentMethod"
                            required
                            defaultValue="bank_slip"
                            className={inputClassName}
                          >
                            <option value="bank_slip">Boleto</option>
                            <option value="direct_debit">Débito automático</option>
                            <option value="credit_card">Cartão de crédito</option>
                            <option value="pix">Pix</option>
                          </select>
                        </SaleField>
                        <SaleField label="Primeira parcela">
                          <input
                            name="firstInstallmentDate"
                            type="date"
                            required
                            className={inputClassName}
                          />
                        </SaleField>
                        <SaleField label="Comissão (%)">
                          <input
                            name="commissionPercent"
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            required
                            className={inputClassName}
                          />
                        </SaleField>

                        {!proposal.clientId &&
                        !proposal.convertedClientId ? (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#96A0AF] sm:col-span-2">
                              Cadastro do cliente
                            </p>
                            <SaleField label="Tipo de pessoa">
                              <select
                                name="personType"
                                required
                                defaultValue="individual"
                                className={inputClassName}
                              >
                                <option value="individual">Pessoa física</option>
                                <option value="company">Pessoa jurídica</option>
                              </select>
                            </SaleField>
                            <SaleField label="CPF/CNPJ">
                              <input
                                name="document"
                                required
                                defaultValue={proposal.leadDocument ?? ""}
                                className={inputClassName}
                              />
                            </SaleField>
                            <SaleField label="Razão social (se PJ)">
                              <input
                                name="companyName"
                                defaultValue={proposal.leadCompanyName ?? ""}
                                className={inputClassName}
                              />
                            </SaleField>
                            <SaleField label="Rua">
                              <input name="addressStreet" required className={inputClassName} />
                            </SaleField>
                            <SaleField label="Número">
                              <input name="addressNumber" required className={inputClassName} />
                            </SaleField>
                            <SaleField label="Complemento">
                              <input name="addressComplement" className={inputClassName} />
                            </SaleField>
                            <SaleField label="Bairro">
                              <input name="addressNeighborhood" required className={inputClassName} />
                            </SaleField>
                            <SaleField label="Cidade">
                              <input name="addressCity" required className={inputClassName} />
                            </SaleField>
                            <SaleField label="UF">
                              <input name="addressState" required minLength={2} maxLength={2} className={inputClassName} />
                            </SaleField>
                            <SaleField label="CEP">
                              <input name="addressZipCode" required className={inputClassName} />
                            </SaleField>
                          </>
                        ) : null}

                        <SaleField label="Observações" wide>
                          <textarea
                            name="saleNotes"
                            rows={3}
                            maxLength={1000}
                            className={inputClassName}
                          />
                        </SaleField>
                        <button
                          type="submit"
                          className="justify-self-start rounded-lg border border-[#43A972]/35 bg-[#2F8F5B]/10 px-3 py-2 text-xs font-semibold text-[#63C68C] hover:bg-[#43A972]/15 sm:col-span-2"
                        >
                          Confirmar fechamento
                        </button>
                      </form>
                    </details>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </main>
  )
}

const inputClassName =
  "mt-1 w-full rounded-lg border border-white/[0.10] bg-[#0F1412] px-3 py-2 text-sm text-[#F5F7FA]"

function SaleField({
  label,
  children,
  wide = false,
}: Readonly<{
  label: string
  children: React.ReactNode
  wide?: boolean
}>) {
  return (
    <label
      className={
        wide
          ? "text-xs text-[#96A0AF] sm:col-span-2"
          : "text-xs text-[#96A0AF]"
      }
    >
      {label}
      {children}
    </label>
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
