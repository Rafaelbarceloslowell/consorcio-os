import Link from "next/link"

import type {
  AgendaView,
} from "@/types/agenda"

type AgendaAction = (
  formData: FormData,
) => Promise<void>

type AgendaBoardProps = Readonly<{
  view: AgendaView
  completeTaskAction: AgendaAction
  rescheduleTaskAction: AgendaAction
  completeMeetingAction: AgendaAction
  rescheduleMeetingAction: AgendaAction
}>

export function AgendaBoard({
  view,
  completeTaskAction,
  rescheduleTaskAction,
  completeMeetingAction,
  rescheduleMeetingAction,
}: AgendaBoardProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section
        aria-labelledby="agenda-title"
        className="gorila-material overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#15191F]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_22px_48px_rgba(0,0,0,0.2)]"
      >
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              Execução comercial
            </p>
            <h1
              id="agenda-title"
              className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#F5F7FA]"
            >
              Agenda
            </h1>
            <p className="mt-2 text-sm text-[#96A0AF]">
              {view.tasks.length} tarefas e {view.meetings.length} reuniões abertas
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
              href="/agenda/new"
              className="rounded-lg border border-[#43A972]/40 bg-[#2F8F5B]/10 px-3 py-2 text-sm font-medium text-[#63C68C] transition hover:bg-[#43A972]/15"
            >
              Novo compromisso
            </Link>
          </div>
        </header>

        <div className="grid gap-6 p-5 xl:grid-cols-2 sm:p-6">
          <AgendaColumn
            title="Tarefas e retornos"
            emptyMessage="Nenhuma tarefa pendente."
          >
            {view.tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#F5F7FA]">
                      {task.title}
                    </h2>
                    <p className="mt-1 text-xs text-[#96A0AF]">
                      {task.relatedName}
                    </p>
                  </div>

                  <span
                    className={
                      task.overdue
                        ? "rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-300"
                        : "rounded-full border border-[#43A972]/20 bg-[#2F8F5B]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#63C68C]"
                    }
                  >
                    {task.overdue ? "Atrasada" : task.priorityLabel}
                  </span>
                </div>

                {task.description ? (
                  <p className="mt-4 text-sm leading-6 text-[#B7C0CC]">
                    {task.description}
                  </p>
                ) : null}

                <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                  <Data label="Prazo">
                    {task.dueAtLabel}
                  </Data>
                  <Data label="Status">
                    {task.statusLabel}
                  </Data>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  {task.opportunityHref ? (
                    <Link
                      href={task.opportunityHref}
                      className="rounded-lg border border-white/[0.10] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-[#D6DBE3] hover:border-[#43A972]/35 hover:text-[#63C68C]"
                    >
                      Abrir oportunidade
                    </Link>
                  ) : null}

                  <form action={completeTaskAction}>
                    <input
                      type="hidden"
                      name="taskId"
                      value={task.id}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-[#43A972]/35 bg-[#2F8F5B]/10 px-3 py-2 text-xs font-semibold text-[#63C68C] hover:bg-[#43A972]/15"
                    >
                      Concluir tarefa
                    </button>
                  </form>
                </div>

                <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-[#96A0AF]">
                    Remarcar tarefa
                  </summary>
                  <form
                    action={rescheduleTaskAction}
                    className="mt-3 flex flex-wrap items-end gap-2"
                  >
                    <input
                      type="hidden"
                      name="taskId"
                      value={task.id}
                    />
                    <label className="min-w-56 flex-1 text-xs text-[#96A0AF]">
                      Nova data e hora
                      <input
                        type="datetime-local"
                        name="dueAt"
                        required
                        defaultValue={task.dueAtInput}
                        className="mt-1 w-full rounded-lg border border-white/[0.10] bg-[#0F1412] px-3 py-2 text-sm text-[#F5F7FA]"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg border border-white/[0.10] px-3 py-2 text-xs font-semibold text-[#D6DBE3] hover:bg-white/[0.04]"
                    >
                      Salvar data
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </AgendaColumn>

          <AgendaColumn
            title="Reuniões"
            emptyMessage="Nenhuma reunião agendada."
          >
            {view.meetings.map((meeting) => (
              <article
                key={meeting.id}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#F5F7FA]">
                      {meeting.title}
                    </h2>
                    <p className="mt-1 text-xs text-[#96A0AF]">
                      {meeting.relatedName}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#43A972]/20 bg-[#2F8F5B]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#63C68C]">
                    {meeting.typeLabel}
                  </span>
                </div>

                {meeting.description ? (
                  <p className="mt-4 text-sm leading-6 text-[#B7C0CC]">
                    {meeting.description}
                  </p>
                ) : null}

                {meeting.liveBriefing ? (
                  <div className="mt-4 rounded-xl border border-[#D0B96C]/20 bg-[#D0B96C]/5 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D0B96C]">
                      Briefing vivo do R2
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#B7C0CC]">
                      {meeting.liveBriefing}
                    </p>
                  </div>
                ) : null}

                <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                  <Data label="Horário">
                    {meeting.startAtLabel}
                  </Data>
                  <Data label="Local">
                    {meeting.location ?? "Não informado"}
                  </Data>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  {meeting.opportunityHref ? (
                    <Link
                      href={meeting.opportunityHref}
                      className="rounded-lg border border-white/[0.10] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-[#D6DBE3] hover:border-[#43A972]/35 hover:text-[#63C68C]"
                    >
                      Abrir oportunidade
                    </Link>
                  ) : null}

                  {meeting.meetingUrl ? (
                    <a
                      href={meeting.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/[0.10] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-[#D6DBE3] hover:border-[#43A972]/35 hover:text-[#63C68C]"
                    >
                      Entrar na reunião
                    </a>
                  ) : null}
                </div>

                <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-[#96A0AF]">
                    Concluir reunião
                  </summary>
                  <form
                    action={completeMeetingAction}
                    className="mt-3 grid gap-3"
                  >
                    <input
                      type="hidden"
                      name="meetingId"
                      value={meeting.id}
                    />
                    <label className="text-xs text-[#96A0AF]">
                      Resultado
                      <select
                        name="outcome"
                        required
                        defaultValue="follow_up_scheduled"
                        className="mt-1 w-full rounded-lg border border-white/[0.10] bg-[#0F1412] px-3 py-2 text-sm text-[#F5F7FA]"
                      >
                        <option value="proposal_sent">
                          Proposta enviada
                        </option>
                        <option value="follow_up_scheduled">
                          Novo acompanhamento
                        </option>
                        <option value="not_interested">
                          Sem interesse
                        </option>
                        <option value="no_answer">
                          Não compareceu / não respondeu
                        </option>
                        <option value="other">
                          Outro
                        </option>
                      </select>
                    </label>
                    <label className="text-xs text-[#96A0AF]">
                      Observação
                      <textarea
                        name="notes"
                        rows={3}
                        maxLength={1000}
                        className="mt-1 w-full rounded-lg border border-white/[0.10] bg-[#0F1412] px-3 py-2 text-sm text-[#F5F7FA]"
                      />
                    </label>
                    <button
                      type="submit"
                      className="justify-self-start rounded-lg border border-[#43A972]/35 bg-[#2F8F5B]/10 px-3 py-2 text-xs font-semibold text-[#63C68C] hover:bg-[#43A972]/15"
                    >
                      Registrar conclusão
                    </button>
                  </form>
                </details>

                <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-[#96A0AF]">
                    Remarcar reunião
                  </summary>
                  <form
                    action={rescheduleMeetingAction}
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                  >
                    <input
                      type="hidden"
                      name="meetingId"
                      value={meeting.id}
                    />
                    <label className="text-xs text-[#96A0AF]">
                      Início
                      <input
                        type="datetime-local"
                        name="startAt"
                        required
                        defaultValue={meeting.startAtInput}
                        className="mt-1 w-full rounded-lg border border-white/[0.10] bg-[#0F1412] px-3 py-2 text-sm text-[#F5F7FA]"
                      />
                    </label>
                    <label className="text-xs text-[#96A0AF]">
                      Término
                      <input
                        type="datetime-local"
                        name="endAt"
                        required
                        defaultValue={meeting.endAtInput}
                        className="mt-1 w-full rounded-lg border border-white/[0.10] bg-[#0F1412] px-3 py-2 text-sm text-[#F5F7FA]"
                      />
                    </label>
                    <button
                      type="submit"
                      className="justify-self-start rounded-lg border border-white/[0.10] px-3 py-2 text-xs font-semibold text-[#D6DBE3] hover:bg-white/[0.04] sm:col-span-2"
                    >
                      Salvar novo horário
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </AgendaColumn>
        </div>
      </section>
    </main>
  )
}

function AgendaColumn({
  title,
  emptyMessage,
  children,
}: Readonly<{
  title: string
  emptyMessage: string
  children: React.ReactNode
}>) {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : children
      ? [children]
      : []

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#697384]">
        {title}
      </h2>
      {items.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-white/[0.10] px-5 py-10 text-center text-sm text-[#96A0AF]"
        >
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </section>
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
