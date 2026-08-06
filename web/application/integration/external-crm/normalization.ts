import type {
  ExternalActionDueState,
  ExternalContactAction,
  ExternalContactActionStatus,
  ExternalContactActionType,
  ExternalContactChannel,
  ExternalContactPeriod,
  ExternalCrmDataOwner,
} from "./types"

export type NormalizeExternalContactActionInput = {
  sourceSystem: string
  sourceRecordId: string
  sourceCode?: string | null
  sourceUpdatedAt: string
  synchronizedAt: string
  contractVersion: string
  dataOwner?: ExternalCrmDataOwner
  externalActionId: string
  externalActionCode?: string | null
  label: string
  rawType?: string | null
  rawChannel?: string | null
  rawPeriod?: string | null
  rawStatus?: string | null
  rawDueState?: string | null
  position: number
  scheduledFor?: string | null
  completedAt?: string | null
  completedByConsultantId?: string | null
  resultCode?: string | null
}

function normalizeToken(
  value: string | null | undefined,
): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .normalize(
        "NFD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[\s-]+/g,
        "_",
      ) ?? ""
  )
}

export function normalizeExternalContactActionType(
  value: string | null | undefined,
): ExternalContactActionType {
  const normalized =
    normalizeToken(
      value,
    )

  if (
    normalized ===
      "contact_attempt" ||
    normalized ===
      "contact" ||
    normalized ===
      "attempt"
  ) {
    return "CONTACT_ATTEMPT"
  }

  if (
    normalized ===
      "follow_up" ||
    normalized ===
      "followup"
  ) {
    return "FOLLOW_UP"
  }

  if (
    normalized ===
      "meeting" ||
    normalized ===
      "reuniao"
  ) {
    return "MEETING"
  }

  return "OTHER"
}

export function normalizeExternalContactChannel(
  value: string | null | undefined,
): ExternalContactChannel {
  const normalized =
    normalizeToken(
      value,
    )

  if (
    normalized === "whatsapp" ||
    normalized === "whats_app"
  ) {
    return "WHATSAPP"
  }

  if (
    normalized === "phone" ||
    normalized === "call" ||
    normalized === "telefone" ||
    normalized === "ligacao"
  ) {
    return "PHONE"
  }

  if (
    normalized === "email" ||
    normalized === "e_mail"
  ) {
    return "EMAIL"
  }

  if (
    normalized === "meeting" ||
    normalized === "reuniao"
  ) {
    return "MEETING"
  }

  if (
    normalized === "internal" ||
    normalized === "interno"
  ) {
    return "INTERNAL"
  }

  return "OTHER"
}

export function normalizeExternalContactPeriod(
  value: string | null | undefined,
): ExternalContactPeriod {
  const normalized =
    normalizeToken(
      value,
    )

  if (
    normalized === "morning" ||
    normalized === "manha"
  ) {
    return "MORNING"
  }

  if (
    normalized === "afternoon" ||
    normalized === "tarde"
  ) {
    return "AFTERNOON"
  }

  if (
    normalized === "evening" ||
    normalized === "night" ||
    normalized === "noite"
  ) {
    return "EVENING"
  }

  if (
    normalized === "anytime" ||
    normalized === "any_time" ||
    normalized === "qualquer_horario"
  ) {
    return "ANYTIME"
  }

  return "UNKNOWN"
}

export function normalizeExternalContactActionStatus(
  value: string | null | undefined,
): ExternalContactActionStatus {
  const normalized =
    normalizeToken(
      value,
    )

  if (
    normalized === "pending" ||
    normalized === "pendente"
  ) {
    return "PENDING"
  }

  if (
    normalized === "ready" ||
    normalized === "pronto"
  ) {
    return "READY"
  }

  if (
    normalized === "in_progress" ||
    normalized === "em_andamento"
  ) {
    return "IN_PROGRESS"
  }

  if (
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "concluido"
  ) {
    return "COMPLETED"
  }

  if (
    normalized === "failed" ||
    normalized === "falhou"
  ) {
    return "FAILED"
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "cancelado"
  ) {
    return "CANCELLED"
  }

  if (
    normalized === "skipped" ||
    normalized === "ignorado"
  ) {
    return "SKIPPED"
  }

  return "UNKNOWN"
}

export function normalizeExternalActionDueState(
  value: string | null | undefined,
  status: ExternalContactActionStatus,
): ExternalActionDueState {
  if (
    status === "COMPLETED"
  ) {
    return "COMPLETED"
  }

  const normalized =
    normalizeToken(
      value,
    )

  if (
    normalized === "not_due" ||
    normalized === "nao_vencido"
  ) {
    return "NOT_DUE"
  }

  if (
    normalized === "due" ||
    normalized === "vence_agora"
  ) {
    return "DUE"
  }

  if (
    normalized === "overdue" ||
    normalized === "atrasado"
  ) {
    return "OVERDUE"
  }

  return "UNKNOWN"
}

export function normalizeExternalContactAction(
  input: NormalizeExternalContactActionInput,
): ExternalContactAction {
  const status =
    normalizeExternalContactActionStatus(
      input.rawStatus,
    )

  return {
    externalActionId:
      input.externalActionId,
    externalActionCode:
      input.externalActionCode ??
      null,
    label:
      input.label,
    type:
      normalizeExternalContactActionType(
        input.rawType,
      ),
    channel:
      normalizeExternalContactChannel(
        input.rawChannel,
      ),
    period:
      normalizeExternalContactPeriod(
        input.rawPeriod,
      ),
    position:
      input.position,
    status,
    dueState:
      normalizeExternalActionDueState(
        input.rawDueState,
        status,
      ),
    scheduledFor:
      input.scheduledFor ??
      null,
    completedAt:
      input.completedAt ??
      null,
    completedByConsultantId:
      input.completedByConsultantId ??
      null,
    resultCode:
      input.resultCode ??
      null,
    trace: {
      sourceSystem:
        input.sourceSystem,
      sourceRecordId:
        input.sourceRecordId,
      sourceCode:
        input.sourceCode ??
        null,
      sourceUpdatedAt:
        input.sourceUpdatedAt,
      synchronizedAt:
        input.synchronizedAt,
      contractVersion:
        input.contractVersion,
      dataOwner:
        input.dataOwner ??
        "EXTERNAL_CRM",
    },
  }
}
