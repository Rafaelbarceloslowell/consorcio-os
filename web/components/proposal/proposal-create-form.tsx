"use client"

import Link from "next/link"
import {
  useActionState,
} from "react"

import {
  Button,
} from "@/components/ui/button"
import {
  Input,
} from "@/components/ui/input"
import {
  Select,
} from "@/components/ui/select"
import {
  Textarea,
} from "@/components/ui/textarea"

import type {
  ProposalCreateActionState,
  ProposalCreateFormView,
} from "@/types/proposal-operational"

type ProposalCreateFormProps = Readonly<{
  view: ProposalCreateFormView
  action: (
    previousState:
      ProposalCreateActionState,
    formData: FormData,
  ) => Promise<ProposalCreateActionState>
}>

const INITIAL_STATE:
  ProposalCreateActionState = {
    status: "idle",
    message: null,
  }

function defaultValidityDate(): string {
  const date =
    new Date()
  date.setDate(
    date.getDate() + 7,
  )

  return date
    .toISOString()
    .slice(0, 10)
}

const EMPTY_VALUES = {
  leadId: "",
  consortiumId: "",
  creditValue: "",
  installmentValue: "",
  termMonths: "",
  administrationFeePercent: "",
  reserveFundPercent: "",
  validUntil: defaultValidityDate(),
  notes: "",
}

export function ProposalCreateForm({
  view,
  action,
}: ProposalCreateFormProps) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    action,
    INITIAL_STATE,
  )

  const values =
    state.status === "error"
      ? state.values
      : {
          ...EMPTY_VALUES,
          leadId:
            view.leads.length === 1
              ? view.leads[0]?.id ?? ""
              : "",
          consortiumId:
            view.consortiums.length === 1
              ? view.consortiums[0]?.id ?? ""
              : "",
        }

  const fieldErrors =
    state.status === "error"
      ? state.fieldErrors
      : undefined

  const ready =
    view.leads.length > 0 &&
    view.consortiums.length > 0

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/proposals"
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline"
        >
          Cancelar e voltar para Propostas
        </Link>

        <section className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Negociação comercial
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Nova proposta
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#96A0AF]">
              A proposta será vinculada ao lead. Aceitar a proposta não cria cliente nem registra venda.
            </p>
          </header>

          {!ready ? (
            <p
              role="status"
              className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
            >
              É necessário ter ao menos um lead ativo e um consórcio ativo.
            </p>
          ) : null}

          <form
            action={formAction}
            className="mt-8 space-y-8"
          >
            {state.status === "error" ? (
              <p
                role="alert"
                className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {state.message}
              </p>
            ) : null}

            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="col-span-full text-sm font-semibold">
                Lead e administradora
              </legend>

              <Field
                label="Lead"
                htmlFor="leadId"
              >
                <Select
                  id="leadId"
                  name="leadId"
                  required
                  disabled={view.leads.length === 0}
                  defaultValue={values.leadId}
                  placeholder="Selecione o lead"
                  errorMessage={fieldErrors?.leadId}
                >
                  {view.leads.map((lead) => (
                    <option
                      key={lead.id}
                      value={lead.id}
                    >
                      {lead.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Grupo / administradora"
                htmlFor="consortiumId"
              >
                <Select
                  id="consortiumId"
                  name="consortiumId"
                  required
                  disabled={
                    view.consortiums.length === 0
                  }
                  defaultValue={values.consortiumId}
                  placeholder="Selecione o grupo"
                  errorMessage={fieldErrors?.consortiumId}
                >
                  {view.consortiums.map(
                    (consortium) => (
                      <option
                        key={consortium.id}
                        value={consortium.id}
                      >
                        {consortium.label}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="col-span-full text-sm font-semibold">
                Condições da proposta
              </legend>

              <Field
                label="Crédito"
                htmlFor="creditValue"
              >
                <Input
                  id="creditValue"
                  name="creditValue"
                  inputMode="decimal"
                  required
                  placeholder="Ex.: 500.000,00"
                  defaultValue={values.creditValue}
                  errorMessage={fieldErrors?.creditValue}
                />
              </Field>

              <Field
                label="Parcela"
                htmlFor="installmentValue"
              >
                <Input
                  id="installmentValue"
                  name="installmentValue"
                  inputMode="decimal"
                  required
                  placeholder="Ex.: 1.397,50"
                  defaultValue={values.installmentValue}
                  errorMessage={fieldErrors?.installmentValue}
                />
              </Field>

              <Field
                label="Prazo em meses"
                htmlFor="termMonths"
              >
                <Input
                  id="termMonths"
                  name="termMonths"
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={values.termMonths}
                  errorMessage={fieldErrors?.termMonths}
                />
              </Field>

              <Field
                label="Validade"
                htmlFor="validUntil"
              >
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                  required
                  defaultValue={values.validUntil}
                  errorMessage={fieldErrors?.validUntil}
                />
              </Field>

              <Field
                label="Taxa de administração (%)"
                htmlFor="administrationFeePercent"
              >
                <Input
                  id="administrationFeePercent"
                  name="administrationFeePercent"
                  inputMode="decimal"
                  required
                  defaultValue={
                    values.administrationFeePercent
                  }
                  errorMessage={
                    fieldErrors?.administrationFeePercent
                  }
                />
              </Field>

              <Field
                label="Fundo de reserva (%)"
                htmlFor="reserveFundPercent"
              >
                <Input
                  id="reserveFundPercent"
                  name="reserveFundPercent"
                  inputMode="decimal"
                  required
                  defaultValue={
                    values.reserveFundPercent
                  }
                  errorMessage={
                    fieldErrors?.reserveFundPercent
                  }
                />
              </Field>
            </fieldset>

            <Field
              label="Observações (opcional)"
              htmlFor="notes"
            >
              <Textarea
                id="notes"
                name="notes"
                rows={5}
                maxLength={2000}
                defaultValue={values.notes}
                placeholder="Ex.: condição apresentada, estratégia de lance e próximos passos."
                errorMessage={fieldErrors?.notes}
              />
            </Field>

            <div className="rounded-xl border border-amber-400/15 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-amber-100">
              A criação e o aceite da proposta mantêm a pessoa como lead. Cliente e venda só serão criados após o fechamento confirmado da cota.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={pending}
                loadingText="Criando proposta"
                disabled={
                  pending ||
                  !ready
                }
              >
                Criar proposta
              </Button>
              <Link
                href="/proposals"
                aria-disabled={pending || undefined}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--gorila-focus)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: Readonly<{
  label: string
  htmlFor: string
  children: React.ReactNode
}>) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[#D6DBE3]"
    >
      {label}
      <div className="mt-2">
        {children}
      </div>
    </label>
  )
}
