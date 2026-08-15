export type ManualWhatsAppInputSource =
  | "CUSTOMER_INBOUND"
  | "CONSULTANT_CONTEXT"

export type ConversationResponseStatus =
  | "NEVER_RESPONDED"
  | "RESPONDED"
  | "UNKNOWN"

export type ConversationInteractionState =
  Readonly<{
    schemaVersion: "1.0"
    sourceType: ManualWhatsAppInputSource
    customerHasReplied: boolean
    responseStatus: ConversationResponseStatus
    consultantContext: string | null
    lastCustomerInboundAt: string | null
  }>

type ResolveConversationInteractionStateInput =
  Readonly<{
    structuredFacts?: unknown
    factProvenance?: unknown
    lastIncomingMessage?: string | null
  }>

const INTERACTION_STATE_KEY =
  "conversationInteraction"

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function isResponseStatus(
  value: unknown,
): value is ConversationResponseStatus {
  return value === "NEVER_RESPONDED" ||
    value === "RESPONDED" ||
    value === "UNKNOWN"
}

function isInputSource(
  value: unknown,
): value is ManualWhatsAppInputSource {
  return value === "CUSTOMER_INBOUND" ||
    value === "CONSULTANT_CONTEXT"
}

function isExplicitNeverRespondedContext(
  value: string,
): boolean {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/gu, " ")
    .trim()

  return /\b(?:cliente|lead|contato)?\s*(?:nunca respondeu|nao respondeu(?: nenhuma vez| ainda)?)\b/u
    .test(normalized)
}

export function resolveConversationInteractionState({
  structuredFacts,
  factProvenance,
  lastIncomingMessage = null,
}: ResolveConversationInteractionStateInput): Readonly<{
  interaction: ConversationInteractionState
  lastIncomingMessage: string | null
  historicalNormalizationApplied: boolean
}> {
  const facts = asRecord(structuredFacts)
  const stored = asRecord(
    facts[INTERACTION_STATE_KEY],
  )

  if (
    stored.schemaVersion === "1.0" &&
    isInputSource(stored.sourceType) &&
    typeof stored.customerHasReplied === "boolean" &&
    isResponseStatus(stored.responseStatus)
  ) {
    const normalizedIncoming =
      stored.customerHasReplied &&
      lastIncomingMessage?.trim()
        ? lastIncomingMessage.trim()
        : null

    return {
      interaction: {
        schemaVersion: "1.0",
        sourceType: stored.sourceType,
        customerHasReplied:
          stored.customerHasReplied,
        responseStatus:
          stored.responseStatus,
        consultantContext:
          typeof stored.consultantContext === "string" &&
          stored.consultantContext.trim()
            ? stored.consultantContext.trim()
            : null,
        lastCustomerInboundAt:
          typeof stored.lastCustomerInboundAt === "string" &&
          stored.lastCustomerInboundAt.trim()
            ? stored.lastCustomerInboundAt.trim()
            : null,
      },
      lastIncomingMessage:
        normalizedIncoming,
      historicalNormalizationApplied:
        normalizedIncoming !==
        (lastIncomingMessage?.trim() || null),
    }
  }

  const provenance = asRecord(
    factProvenance,
  )
  const normalizedIncoming =
    lastIncomingMessage?.trim() || null
  const manualProvenance =
    provenance.lastIncomingMessage ===
      "manual_context" ||
    provenance.lastIncomingMessage ===
      "consultant_confirmation"
  const safelyIdentifiedLegacyContext =
    Boolean(
      normalizedIncoming &&
      manualProvenance &&
      isExplicitNeverRespondedContext(
        normalizedIncoming,
      ),
    )

  if (safelyIdentifiedLegacyContext) {
    return {
      interaction: {
        schemaVersion: "1.0",
        sourceType:
          "CONSULTANT_CONTEXT",
        customerHasReplied: false,
        responseStatus:
          "NEVER_RESPONDED",
        consultantContext:
          normalizedIncoming,
        lastCustomerInboundAt: null,
      },
      lastIncomingMessage: null,
      historicalNormalizationApplied:
        true,
    }
  }

  return {
    interaction: {
      schemaVersion: "1.0",
      sourceType:
        normalizedIncoming
          ? "CUSTOMER_INBOUND"
          : "CONSULTANT_CONTEXT",
      customerHasReplied:
        Boolean(normalizedIncoming),
      responseStatus:
        normalizedIncoming
          ? "RESPONDED"
          : "UNKNOWN",
      consultantContext: null,
      lastCustomerInboundAt: null,
    },
    lastIncomingMessage:
      normalizedIncoming,
    historicalNormalizationApplied:
      false,
  }
}

export function writeConversationInteractionState(
  structuredFacts: unknown,
  interaction: ConversationInteractionState,
): Readonly<Record<string, unknown>> {
  return {
    ...asRecord(structuredFacts),
    [INTERACTION_STATE_KEY]:
      interaction,
  }
}

export function buildConversationInteractionState(
  input: Readonly<{
    sourceType: ManualWhatsAppInputSource
    text: string
    observedAt: Date
    existing: ConversationInteractionState
    existingLastIncomingMessage: string | null
    explicitlyNeverResponded: boolean
  }>,
): Readonly<{
  interaction: ConversationInteractionState
  lastIncomingMessage: string | null
}> {
  const text = input.text.trim()

  if (!text) {
    return {
      interaction:
        input.existing,
      lastIncomingMessage:
        input.existingLastIncomingMessage
          ?.trim() || null,
    }
  }

  if (
    input.sourceType ===
    "CUSTOMER_INBOUND"
  ) {
    return {
      interaction: {
        schemaVersion: "1.0",
        sourceType:
          "CUSTOMER_INBOUND",
        customerHasReplied: true,
        responseStatus: "RESPONDED",
        consultantContext:
          input.existing
            .consultantContext,
        lastCustomerInboundAt:
          input.observedAt.toISOString(),
      },
      lastIncomingMessage: text,
    }
  }

  const previousInbound =
    input.existingLastIncomingMessage
      ?.trim() || null
  const hasPreviousInbound =
    Boolean(previousInbound) &&
    input.existing.customerHasReplied

  return {
    interaction: {
      schemaVersion: "1.0",
      sourceType:
        "CONSULTANT_CONTEXT",
      customerHasReplied:
        hasPreviousInbound,
      responseStatus:
        hasPreviousInbound
          ? "RESPONDED"
          : input.explicitlyNeverResponded
            ? "NEVER_RESPONDED"
            : "UNKNOWN",
      consultantContext: text,
      lastCustomerInboundAt:
        hasPreviousInbound
          ? input.existing
              .lastCustomerInboundAt
          : null,
    },
    lastIncomingMessage:
      hasPreviousInbound
        ? previousInbound
        : null,
  }
}
