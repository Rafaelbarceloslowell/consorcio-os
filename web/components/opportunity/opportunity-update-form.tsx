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
  OpportunityUpdateActionState,
  OpportunityUpdateFormView,
} from "@/types/opportunity-update"

import {
  OPPORTUNITY_PRIORITY_LABELS,
} from "./opportunity-labels"

type OpportunityUpdateFormProps = {
  opportunity:
    OpportunityUpdateFormView
  action: (
    previousState:
      OpportunityUpdateActionState,
    formData: FormData,
  ) => Promise<OpportunityUpdateActionState>
}

const INITIAL_STATE:
  OpportunityUpdateActionState = {
    status: "idle",
    message: null,
  }

export function OpportunityUpdateForm({
  opportunity,
  action,
}: OpportunityUpdateFormProps) {
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
          title:
            opportunity.title,
          consultantId:
            opportunity.consultantId,
          priority:
            opportunity.priority,
          score: String(
            opportunity.score,
          ),
        }

  const fieldErrors =
    state.status === "error"
      ? state.fieldErrors
      : undefined

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/opportunities/${encodeURIComponent(opportunity.id)}`}
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Cancelar e voltar aos detalhes
        </Link>

        <section className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)] sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Oportunidade comercial
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Editar oportunidade
            </h1>
          </header>

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
              label="Título"
              htmlFor="title"
            >
              <Input
                id="title"
                name="title"
                required
                defaultValue={
                  values.title
                }
                errorMessage={
                  fieldErrors?.title
                }
              />
            </Field>

            <Field
              label="Responsável"
              htmlFor="consultantId"
            >
              <Select
                id="consultantId"
                name="consultantId"
                required
                defaultValue={
                  values.consultantId
                }
                errorMessage={
                  fieldErrors
                    ?.consultantId
                }
              >
                {opportunity.consultants.map(
                  (consultant) => (
                    <option
                      key={
                        consultant.id
                      }
                      value={
                        consultant.id
                      }
                    >
                      {
                        consultant.name
                      }
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
                loadingText="Salvando"
                disabled={pending}
              >
                Salvar alterações
              </Button>
              <Link
                href={`/opportunities/${encodeURIComponent(opportunity.id)}`}
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
