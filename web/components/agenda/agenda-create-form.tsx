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
  AgendaCreateActionState,
  AgendaCreateFormView,
} from "@/types/agenda"

type AgendaCreateFormProps = Readonly<{
  view: AgendaCreateFormView
  action: (
    previousState: AgendaCreateActionState,
    formData: FormData,
  ) => Promise<AgendaCreateActionState>
}>

const INITIAL_STATE:
  AgendaCreateActionState = {
    status: "idle",
    message: null,
  }

const EMPTY_VALUES = {
  kind: "task",
  leadId: "",
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  meetingType: "phone",
  taskType: "follow_up",
  priority: "medium",
  location: "",
  meetingUrl: "",
}

export function AgendaCreateForm({
  view,
  action,
}: AgendaCreateFormProps) {
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
        }

  const fieldErrors =
    state.status === "error"
      ? state.fieldErrors
      : undefined

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/agenda"
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline"
        >
          Cancelar e voltar para Agenda
        </Link>

        <section className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Execução comercial
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Novo compromisso
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#96A0AF]">
              Crie uma tarefa de retorno ou agende uma reunião vinculada a um lead real.
            </p>
          </header>

          {view.leads.length === 0 ? (
            <p
              role="status"
              className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
            >
              Cadastre um lead antes de criar compromissos.
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
                Compromisso
              </legend>

              <Field
                label="Tipo de compromisso"
                htmlFor="kind"
              >
                <Select
                  id="kind"
                  name="kind"
                  required
                  defaultValue={values.kind}
                  errorMessage={fieldErrors?.kind}
                >
                  <option value="task">
                    Tarefa ou retorno
                  </option>
                  <option value="meeting">
                    Reunião
                  </option>
                </Select>
              </Field>

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
                label="Título"
                htmlFor="title"
              >
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={values.title}
                  errorMessage={fieldErrors?.title}
                />
              </Field>

              <Field
                label="Prioridade da tarefa"
                htmlFor="priority"
              >
                <Select
                  id="priority"
                  name="priority"
                  defaultValue={values.priority}
                  errorMessage={fieldErrors?.priority}
                >
                  <option value="high">
                    Alta
                  </option>
                  <option value="medium">
                    Média
                  </option>
                  <option value="low">
                    Baixa
                  </option>
                </Select>
              </Field>

              <Field
                label="Data e hora de início"
                htmlFor="startAt"
              >
                <Input
                  id="startAt"
                  name="startAt"
                  type="datetime-local"
                  required
                  defaultValue={values.startAt}
                  errorMessage={fieldErrors?.startAt}
                />
              </Field>

              <Field
                label="Data e hora de término (reunião)"
                htmlFor="endAt"
              >
                <Input
                  id="endAt"
                  name="endAt"
                  type="datetime-local"
                  defaultValue={values.endAt}
                  errorMessage={fieldErrors?.endAt}
                />
              </Field>

              <Field
                label="Tipo de tarefa"
                htmlFor="taskType"
              >
                <Select
                  id="taskType"
                  name="taskType"
                  defaultValue={values.taskType}
                  errorMessage={fieldErrors?.taskType}
                >
                  <option value="follow_up">
                    Retorno
                  </option>
                  <option value="call">
                    Ligação
                  </option>
                  <option value="email">
                    E-mail
                  </option>
                  <option value="document">
                    Documento
                  </option>
                  <option value="proposal_review">
                    Revisar proposta
                  </option>
                  <option value="other">
                    Outra
                  </option>
                </Select>
              </Field>

              <Field
                label="Tipo de reunião"
                htmlFor="meetingType"
              >
                <Select
                  id="meetingType"
                  name="meetingType"
                  defaultValue={values.meetingType}
                  errorMessage={fieldErrors?.meetingType}
                >
                  <option value="phone">
                    Telefone
                  </option>
                  <option value="online">
                    Online
                  </option>
                  <option value="in_person">
                    Presencial
                  </option>
                </Select>
              </Field>

              <Field
                label="Local (opcional)"
                htmlFor="location"
              >
                <Input
                  id="location"
                  name="location"
                  defaultValue={values.location}
                  errorMessage={fieldErrors?.location}
                />
              </Field>

              <Field
                label="Link da reunião (opcional)"
                htmlFor="meetingUrl"
              >
                <Input
                  id="meetingUrl"
                  name="meetingUrl"
                  type="url"
                  defaultValue={values.meetingUrl}
                  errorMessage={fieldErrors?.meetingUrl}
                />
              </Field>
            </fieldset>

            <Field
              label="Descrição (opcional)"
              htmlFor="description"
            >
              <Textarea
                id="description"
                name="description"
                rows={4}
                maxLength={1000}
                defaultValue={values.description}
                errorMessage={fieldErrors?.description}
              />
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={pending}
                loadingText="Criando compromisso"
                disabled={
                  pending ||
                  view.leads.length === 0
                }
              >
                Criar compromisso
              </Button>
              <Link
                href="/agenda"
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
