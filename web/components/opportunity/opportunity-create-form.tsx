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

import type {
  OpportunityCreateActionState,
  OpportunityCreateFormView,
} from "@/types/opportunity-create"

import {
  OPPORTUNITY_CONSORTIUM_LABELS,
  OPPORTUNITY_PRIORITY_LABELS,
} from "./opportunity-labels"

type OpportunityCreateFormProps = {
  view: OpportunityCreateFormView
  action: (
    previousState:
      OpportunityCreateActionState,
    formData: FormData,
  ) => Promise<OpportunityCreateActionState>
}

const INITIAL_STATE:
  OpportunityCreateActionState = {
    status: "idle",
    message: null,
  }

export function OpportunityCreateForm({
  view,
  action,
}: OpportunityCreateFormProps) {
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
          clientId: "",
          title: "",
          consortiumType:
            "real_estate",
          priority: "NORMAL",
          score: "0",
        }

  const fieldErrors =
    state.status === "error"
      ? state.fieldErrors
      : undefined

  const hasClients =
    view.clients.length > 0

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Cancelar e voltar ao Mission Control
        </Link>

        <section className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)] sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Pipeline comercial
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Nova oportunidade
            </h1>
          </header>

          {!hasClients && (
            <p
              role="status"
              className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
            >
              É necessário cadastrar um cliente antes de criar uma oportunidade.
            </p>
          )}

          <form
            action={formAction}
            className="mt-8 space-y-6"
          >
            {state.status ===
              "error" && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {state.message}
              </p>
            )}

            <Field
              label="Cliente"
              htmlFor="clientId"
            >
              <Select
                id="clientId"
                name="clientId"
                required
                disabled={!hasClients}
                defaultValue={
                  values.clientId
                }
                placeholder="Selecione um cliente"
                errorMessage={
                  fieldErrors?.clientId
                }
              >
                {view.clients.map(
                  (client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                    </option>
                  ),
                )}
              </Select>
            </Field>

            <Field
              label="Título"
              htmlFor="title"
            >
              <Input
                id="title"
                name="title"
                placeholder="Ex.: Compra do primeiro imóvel"
                defaultValue={
                  values.title
                }
                errorMessage={
                  fieldErrors?.title
                }
              />
            </Field>

            <Field
              label="Tipo de consórcio"
              htmlFor="consortiumType"
            >
              <Select
                id="consortiumType"
                name="consortiumType"
                required
                defaultValue={
                  values.consortiumType
                }
                errorMessage={
                  fieldErrors
                    ?.consortiumType
                }
              >
                {Object.entries(
                  OPPORTUNITY_CONSORTIUM_LABELS,
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </Select>
            </Field>

            <Field
              label="Prioridade"
              htmlFor="priority"
            >
              <Select
                id="priority"
                name="priority"
                required
                defaultValue={
                  values.priority
                }
                errorMessage={
                  fieldErrors
                    ?.priority
                }
              >
                {Object.entries(
                  OPPORTUNITY_PRIORITY_LABELS,
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </Select>
            </Field>

            <Field
              label="Score"
              htmlFor="score"
            >
              <Input
                id="score"
                name="score"
                type="number"
                required
                min={0}
                max={100}
                step={1}
                inputMode="numeric"
                defaultValue={
                  values.score
                }
                errorMessage={
                  fieldErrors?.score
                }
              />
            </Field>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                loading={pending}
                loadingText="Criando"
                disabled={
                  pending || !hasClients
                }
              >
                Criar oportunidade
              </Button>
              <Link
                href="/"
                aria-disabled={
                  pending || undefined
                }
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] px-4 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--gorila-focus)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
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
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
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
