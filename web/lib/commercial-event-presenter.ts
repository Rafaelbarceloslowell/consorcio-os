import type {
  CommercialActorType,
  CommercialEvent,
  CommercialEventType,
} from "@/types/domain"

export type CommercialEventPresentation = {
  title: string
  description: string | null
  actorLabel: string
}

const commercialEventTypeLabels: Record<
  CommercialEventType,
  string
> = {
  LEAD_CREATED: "Lead criado",
  OPPORTUNITY_CREATED: "Oportunidade criada",
  LEAD_REPLIED: "Lead respondeu",
  MEETING_SCHEDULED: "Reunião agendada",
  MEETING_COMPLETED: "Reunião concluída",
  PROPOSAL_SENT: "Proposta enviada",
  PROPOSAL_ACCEPTED: "Proposta aceita",
  DOCUMENT_REQUESTED: "Documento solicitado",
  DOCUMENT_RECEIVED: "Documento recebido",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  SALE_COMPLETED: "Venda concluída",
  STATE_CHANGED: "Estado alterado",
  NOTE_ADDED: "Nota adicionada",
  TASK_CREATED: "Tarefa criada",
  TASK_COMPLETED: "Tarefa concluída",
}

const commercialActorTypeLabels: Record<
  CommercialActorType,
  string
> = {
  LEAD: "Lead",
  CLIENT: "Cliente",
  CONSULTANT: "Consultor",
  AI: "GorilaR2",
  SYSTEM: "Sistema",
  AUTOMATION: "Automação",
  ADMINISTRATOR: "Administrador",
}

function readPayloadString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key]

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return null
  }

  return value.trim()
}

function readFirstPayloadString(
  payload: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value =
      readPayloadString(
        payload,
        key,
      )

    if (value !== null) {
      return value
    }
  }

  return null
}

function formatTechnicalValue(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replaceAll("_", " ")
    .replace(
      /^./,
      (character) =>
        character.toLocaleUpperCase("pt-BR"),
    )
}

function createStateChangedDescription(
  payload: Record<string, unknown>,
): string | null {
  const previousState =
    readFirstPayloadString(
      payload,
      [
        "previousStateName",
        "sourceStateName",
        "previousStateCode",
        "sourceStateCode",
      ],
    )

  const targetState =
    readFirstPayloadString(
      payload,
      [
        "targetStateName",
        "newStateName",
        "targetStateCode",
        "newStateCode",
      ],
    )

  if (
    previousState !== null &&
    targetState !== null
  ) {
    return [
      formatTechnicalValue(
        previousState,
      ),
      formatTechnicalValue(
        targetState,
      ),
    ].join(" → ")
  }

  if (targetState !== null) {
    return `Novo estado: ${formatTechnicalValue(
      targetState,
    )}`
  }

  return readFirstPayloadString(
    payload,
    [
      "description",
      "reason",
      "message",
    ],
  )
}

function createGenericDescription(
  payload: Record<string, unknown>,
): string | null {
  return readFirstPayloadString(
    payload,
    [
      "description",
      "reason",
      "message",
      "content",
      "title",
      "note",
    ],
  )
}

export function getCommercialEventTypeLabel(
  type: CommercialEventType,
): string {
  return commercialEventTypeLabels[type]
}

export function getCommercialActorTypeLabel(
  actorType: CommercialActorType,
): string {
  return commercialActorTypeLabels[
    actorType
  ]
}

export function getCommercialEventDescription(
  event: Pick<
    CommercialEvent,
    "type" | "payload"
  >,
): string | null {
  if (event.type === "STATE_CHANGED") {
    return createStateChangedDescription(
      event.payload,
    )
  }

  return createGenericDescription(
    event.payload,
  )
}

export function presentCommercialEvent(
  event: Pick<
    CommercialEvent,
    "type" | "actorType" | "payload"
  >,
): CommercialEventPresentation {
  return {
    title:
      getCommercialEventTypeLabel(
        event.type,
      ),
    description:
      getCommercialEventDescription(
        event,
      ),
    actorLabel:
      getCommercialActorTypeLabel(
        event.actorType,
      ),
  }
}
