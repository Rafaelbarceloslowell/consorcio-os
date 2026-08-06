"use client"

import Link from "next/link"
import {
  useActionState,
} from "react"

import {
  CONSORTIUM_TYPE_OPTIONS,
  LEAD_SOURCE_OPTIONS,
} from "@/components/lead/lead-labels"
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
  LeadUpdateActionState,
  LeadUpdateFormView,
} from "@/types/lead-update"

type LeadUpdateFormProps = Readonly<{
  lead: LeadUpdateFormView
  action: (
    previousState:
      LeadUpdateActionState,
    formData: FormData,
  ) => Promise<LeadUpdateActionState>
}>

const INITIAL_STATE:
  LeadUpdateActionState = {
    status: "idle",
    message: null,
  }

export function LeadUpdateForm({
  lead,
  action,
}: LeadUpdateFormProps) {
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
      : lead

  const fieldErrors =
    state.status === "error"
      ? state.fieldErrors
      : undefined

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href={values.returnTo}
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Cancelar e voltar
        </Link>

        <section className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)] sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Dados reais do contato
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Editar lead
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#96A0AF]">
              Corrija nome, e-mail, telefone e demais informações do lead. O histórico da conversa, o aprendizado do R2 e a oportunidade comercial serão preservados.
            </p>
          </header>

          <form
            action={formAction}
            className="mt-8 space-y-8"
          >
            <input
              type="hidden"
              name="returnTo"
              value={values.returnTo}
            />

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
                Identificação e contato
              </legend>

              <Field
                label="Nome do lead"
                htmlFor="name"
              >
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={values.name}
                  errorMessage={fieldErrors?.name}
                />
              </Field>

              <Field
                label="Empresa (opcional)"
                htmlFor="companyName"
              >
                <Input
                  id="companyName"
                  name="companyName"
                  defaultValue={values.companyName}
                  errorMessage={fieldErrors?.companyName}
                />
              </Field>

              <Field
                label="E-mail (opcional)"
                htmlFor="email"
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={values.email}
                  errorMessage={fieldErrors?.email}
                />
              </Field>

              <Field
                label="Documento (opcional)"
                htmlFor="document"
              >
                <Input
                  id="document"
                  name="document"
                  inputMode="numeric"
                  defaultValue={values.document}
                  errorMessage={fieldErrors?.document}
                />
              </Field>

              <Field
                label="Código do país"
                htmlFor="phoneCountryCode"
              >
                <Input
                  id="phoneCountryCode"
                  name="phoneCountryCode"
                  inputMode="numeric"
                  defaultValue={values.phoneCountryCode}
                  errorMessage={fieldErrors?.phoneCountryCode}
                />
              </Field>

              <Field
                label="Telefone"
                htmlFor="phone"
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  defaultValue={values.phone}
                  errorMessage={fieldErrors?.phone}
                />
              </Field>
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="col-span-full text-sm font-semibold">
                Interesse comercial
              </legend>

              <Field
                label="Origem do lead"
                htmlFor="source"
              >
                <Select
                  id="source"
                  name="source"
                  required
                  defaultValue={values.source}
                  errorMessage={fieldErrors?.source}
                >
                  {LEAD_SOURCE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </Select>
              </Field>

              <Field
                label="Tipo de consórcio"
                htmlFor="consortiumType"
              >
                <Select
                  id="consortiumType"
                  name="consortiumType"
                  required
                  defaultValue={values.consortiumType}
                  errorMessage={fieldErrors?.consortiumType}
                >
                  {CONSORTIUM_TYPE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </Select>
              </Field>

              <Field
                label="Crédito desejado"
                htmlFor="desiredCreditValue"
              >
                <Input
                  id="desiredCreditValue"
                  name="desiredCreditValue"
                  inputMode="decimal"
                  required
                  defaultValue={values.desiredCreditValue}
                  errorMessage={fieldErrors?.desiredCreditValue}
                />
              </Field>

              <Field
                label="Prazo desejado em meses"
                htmlFor="desiredTermMonths"
              >
                <Input
                  id="desiredTermMonths"
                  name="desiredTermMonths"
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={values.desiredTermMonths}
                  errorMessage={fieldErrors?.desiredTermMonths}
                />
              </Field>

              <Field
                label="Consultor responsável"
                htmlFor="consultantId"
              >
                <Select
                  id="consultantId"
                  name="consultantId"
                  required
                  defaultValue={values.consultantId}
                  errorMessage={fieldErrors?.consultantId}
                >
                  {lead.consultants.map(
                    (consultant) => (
                      <option
                        key={consultant.id}
                        value={consultant.id}
                      >
                        {consultant.name}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold">
                Contexto do contato
              </legend>

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
                  errorMessage={fieldErrors?.notes}
                />
              </Field>
            </fieldset>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={pending}
                loadingText="Salvando lead"
                disabled={pending}
              >
                Salvar dados do contato
              </Button>

              <Link
                href={values.returnTo}
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
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
