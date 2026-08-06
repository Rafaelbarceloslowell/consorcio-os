import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react"

import type {
  ExternalCrmPilotActionView,
  ExternalCrmPilotView,
} from "@/types/external-crm-pilot"

function channelLabel(
  channel: ExternalCrmPilotActionView["channel"],
): string {
  if (channel === "PHONE") {
    return "Ligação"
  }

  if (channel === "WHATSAPP") {
    return "WhatsApp"
  }

  if (channel === "EMAIL") {
    return "E-mail"
  }

  if (channel === "MEETING") {
    return "Reunião"
  }

  return "Ação"
}

function periodLabel(
  period: ExternalCrmPilotActionView["period"],
): string {
  if (period === "MORNING") {
    return "manhã"
  }

  if (period === "AFTERNOON") {
    return "tarde"
  }

  if (period === "EVENING") {
    return "noite"
  }

  return "horário definido"
}

function formatDateTime(
  value: string,
  timezone: string | null,
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "horário indisponível"
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        timezone ??
        "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(date)
}

function ActionIcon({
  channel,
}: {
  channel: ExternalCrmPilotActionView["channel"]
}) {
  if (channel === "PHONE") {
    return (
      <Phone
        aria-hidden="true"
        className="size-4"
      />
    )
  }

  return (
    <MessageCircle
      aria-hidden="true"
      className="size-4"
    />
  )
}

export function ExternalCrmPilotCard({
  view,
}: {
  view: ExternalCrmPilotView
}) {
  const checkLabel =
    view.cadence
      ?.currentCheck !== null &&
    view.cadence
      ?.currentCheck !== undefined
      ? `Check ${view.cadence.currentCheck} de ${view.cadence.totalChecks ?? "?"}`
      : "Check indisponível"

  const actionsLabel =
    view.cadence
      ? `${view.cadence.completedActions} de ${view.cadence.plannedActions}`
      : "—"

  const cadencePaused =
    view.cadence?.paused ===
      true ||
    view.cadence?.status ===
      "PAUSED"

  const cadenceCompleted =
    view.cadence?.status ===
    "COMPLETED"

  const positiveReactivationResponse =
    view.reactivation
      ?.positiveResponseHandled ===
    true

  const actionPanelTitle =
    view.meeting
      ? "Compromisso oficial do Maestro"
      : positiveReactivationResponse
        ? "Atendimento ativo após reativação"
        : cadencePaused
        ? "Próximo passo oficial do Maestro"
        : cadenceCompleted
          ? "Cadência concluída no Maestro"
          : "Próxima ação do Maestro"

  return (
    <section
      aria-labelledby="external-crm-pilot-title"
      className="gorila-material relative overflow-hidden rounded-[24px] border border-[#2F8F5B]/25 bg-[#15191F]/92 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-[#2F8F5B]/[0.12] blur-3xl"
      />

      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#2F8F5B]/25 bg-[#2F8F5B]/[0.1] text-[#43A972]">
              <Database
                aria-hidden="true"
                className="size-5"
              />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
                Piloto de integração externa
              </p>

              <h2
                id="external-crm-pilot-title"
                className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#F5F7FA]"
              >
                Maestro simulado conectado ao R2
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#96A0AF]">
                O dashboard está lendo um cenário simulado do Maestro pelo contrato universal do GorillaOS.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2F8F5B]/25 bg-[#2F8F5B]/[0.1] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#67C493]">
              <ShieldCheck
                aria-hidden="true"
                className="size-3.5"
              />
              Somente leitura
            </span>

            <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#96A0AF]">
              Dados simulados
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.06] bg-black/[0.14] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697384]">
              Lead oficial
            </p>
            <p className="mt-2 text-sm font-semibold text-[#F5F7FA]">
              {view.lead.name}
            </p>
            <p className="mt-1 text-xs text-[#96A0AF]">
              {view.lead.source ?? "Origem não informada"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/[0.14] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697384]">
              Cadência
            </p>
            <p className="mt-2 text-sm font-semibold text-[#F5F7FA]">
              {checkLabel}
            </p>
            <p className="mt-1 text-xs text-[#96A0AF]">
              {view.cadence?.templateVersion ?? "Template não informado"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/[0.14] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697384]">
              Ações concluídas
            </p>
            <p className="mt-2 text-sm font-semibold text-[#F5F7FA]">
              {actionsLabel}
            </p>
            <p className="mt-1 text-xs text-[#96A0AF]">
              {view.cadence?.overdueActions
                ? `${view.cadence.overdueActions} atrasadas`
                : "Nenhuma ação atrasada"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/[0.14] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697384]">
              Estado externo
            </p>
            <p className="mt-2 text-sm font-semibold text-[#F5F7FA]">
              {view.cadence?.status ?? view.healthStatus}
            </p>
            <p className="mt-1 text-xs text-[#96A0AF]">
              {view.cadence?.pauseReasonLabel
                ? `${view.cadence.pauseReasonLabel} · ${view.contractVersion}`
                : `Contrato ${view.contractVersion}`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-white/[0.06] bg-black/[0.14] p-4">
            <div className="flex items-center gap-2 text-[#D6DBE3]">
              {view.meeting ? (
                <CalendarClock
                  aria-hidden="true"
                  className="size-4"
                />
              ) : positiveReactivationResponse ? (
                <MessageCircle
                  aria-hidden="true"
                  className="size-4"
                />
              ) : view.nextAction ? (
                <ActionIcon
                  channel={
                    view.nextAction.channel
                  }
                />
              ) : (
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4"
                />
              )}

              <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                {actionPanelTitle}
              </p>
            </div>

            {view.meeting ? (
              <>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#F5F7FA]">
                  {view.meeting.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96A0AF]">
                  {formatDateTime(
                    view.meeting.scheduledFor,
                    view.cadence?.timezone ?? null,
                  )}
                </p>
                <p className="mt-3 text-xs leading-5 text-[#96A0AF]">
                  A reunião substitui qualquer tentativa de contato do Check enquanto a cadência estiver pausada.
                </p>
              </>
            ) : positiveReactivationResponse ? (
              <>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#F5F7FA]">
                  Reativação encerrada.
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96A0AF]">
                  {view.latestTimelineSummary ??
                    "Cliente respondeu com interesse e voltou ao atendimento ativo."}
                </p>
                <p className="mt-3 text-xs leading-5 text-[#96A0AF]">
                  Nenhuma ação de Check será retomada automaticamente. Primeiro o R2 responde, qualifica e define o próximo passo.
                </p>
              </>
            ) : cadencePaused ? (
              <>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#F5F7FA]">
                  {view.latestTimelineSummary ??
                    "Próximo passo registrado no Maestro."}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96A0AF]">
                  {view.lead.nextActionAt
                    ? formatDateTime(
                        view.lead.nextActionAt,
                        view.cadence?.timezone ?? null,
                      )
                    : "Aguardar o horário oficial registrado no Maestro."}
                </p>
                <p className="mt-3 text-xs leading-5 text-[#96A0AF]">
                  Nenhuma ligação ou mensagem do Check deve ser executada enquanto a pausa estiver ativa.
                </p>
              </>
            ) : cadenceCompleted ? (
              <>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#F5F7FA]">
                  Nenhuma nova tentativa está liberada.
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96A0AF]">
                  Aguardar a decisão oficial sobre reativação ou encerramento.
                </p>
              </>
            ) : view.nextAction ? (
              <>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#F5F7FA]">
                  {view.nextAction.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#96A0AF]">
                  {channelLabel(
                    view.nextAction.channel,
                  )} · {periodLabel(
                    view.nextAction.period,
                  )}
                  {view.nextAction.scheduledFor
                    ? ` · ${formatDateTime(
                        view.nextAction.scheduledFor,
                        view.cadence?.timezone ?? null,
                      )}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#96A0AF]">
                Nenhuma ação pendente foi informada pelo cenário externo.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.075] p-4">
            <div className="flex items-center gap-2">
              {view.cadence?.overdueActions ? (
                <AlertTriangle
                  aria-hidden="true"
                  className="size-4 text-[#E6B566]"
                />
              ) : (
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4 text-[#43A972]"
                />
              )}

              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#43A972]">
                Leitura do R2
              </p>
            </div>

            <h3 className="mt-3 text-base font-semibold text-[#F5F7FA]">
              {view.r2.headline}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#B6BEC9]">
              {view.r2.analysis}
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-[#F5F7FA]">
              {view.r2.recommendation}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#96A0AF]">
              {view.r2.reason}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-[#697384]">
          Cenário {view.scenarioId} · Fonte oficial simulada: Maestro · Nenhuma escrita, mensagem ou alteração de cadência foi executada.
        </p>
      </div>
    </section>
  )
}
