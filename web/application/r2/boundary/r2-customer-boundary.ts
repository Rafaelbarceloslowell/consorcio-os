export type R2CustomerBoundarySignal =
  | "OPEN"
  | "DELAY_WITH_PERMISSION"
  | "SOFT_REJECTION"
  | "EXPLICIT_REJECTION"
  | "REPEATED_EXPLICIT_REJECTION"
  | "DO_NOT_CONTACT_REQUEST"
  | "HOSTILE_REJECTION"
  | "INBOUND_REOPENED"

export type R2CustomerBoundaryState =
  | "OPEN"
  | "CAUTIOUS"
  | "REJECTION"
  | "REPEATED_REJECTION"
  | "STOP_CURRENT_CONVERSATION"
  | "DO_NOT_CONTACT"

export type R2BoundaryConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "UNKNOWN"

export type R2CustomerBoundaryObservation = Readonly<{
  fingerprint: string
  signal: Exclude<R2CustomerBoundarySignal, "OPEN">
  state: R2CustomerBoundaryState
  sourceReference: string
  observedAt: string
}>

export type R2CustomerBoundaryMemory = Readonly<{
  schemaVersion: "1.0"
  currentState: R2CustomerBoundaryState
  explicitRejectionCount: number
  observations: readonly R2CustomerBoundaryObservation[]
  updatedAt: string
}>

export type R2CustomerBoundaryContext = Readonly<{
  signal: R2CustomerBoundarySignal
  state: R2CustomerBoundaryState
  intentConfidence: R2BoundaryConfidence
  reasonForRejectionConfidence: R2BoundaryConfidence
  explicitRejectionCount: number
  terminal: boolean
  currentConversationClosed: boolean
  proactiveContactSuppressed: boolean
  outboundAutomationSuppressed: boolean
  objectionHandlingAllowed: boolean
  fomoAllowed: boolean
  ctaAllowed: boolean
  questionAllowed: boolean
  inboundReopened: boolean
  fingerprint: string
  sourceReference: string
  observedAt: string
  isNewObservation: boolean
  rationale: string
}>

type BoundaryEvent = Readonly<{
  id: string
  payload: Readonly<Record<string, unknown>>
  occurredAt: string | Date
}>

export type AnalyzeR2CustomerBoundaryInput = Readonly<{
  opportunityId: string
  message: string
  structuredFacts?: unknown
  recentMessages?: readonly string[]
  commercialEvents?: readonly BoundaryEvent[]
  sourceReference?: string
  observedAt?: Date
}>

const EMPTY_MEMORY: R2CustomerBoundaryMemory = {
  schemaVersion: "1.0",
  currentState: "OPEN",
  explicitRejectionCount: 0,
  observations: [],
  updatedAt: new Date(0).toISOString(),
}

const REJECTION_SIGNALS = new Set<R2CustomerBoundarySignal>([
  "SOFT_REJECTION",
  "EXPLICIT_REJECTION",
  "REPEATED_EXPLICIT_REJECTION",
  "DO_NOT_CONTACT_REQUEST",
  "HOSTILE_REJECTION",
])

const EXPLICIT_REJECTION_SIGNALS =
  new Set<R2CustomerBoundarySignal>([
    "EXPLICIT_REJECTION",
    "REPEATED_EXPLICIT_REJECTION",
    "DO_NOT_CONTACT_REQUEST",
    "HOSTILE_REJECTION",
  ])

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
}

function stableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

export function normalizeR2BoundaryText(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\bn\b/gu, "nao")
    .replace(/\bnaum\b/gu, "nao")
    .replace(/\bq\b/gu, "que")
    .replace(/\bmsg\b/gu, "mensagem")
    .replace(/\bmsgs\b/gu, "mensagens")
    .replace(/[^a-z0-9%$]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

export function buildR2BoundaryFingerprint(
  opportunityId: string,
  message: string,
): string {
  return stableHash(
    `${opportunityId.trim()}|${normalizeR2BoundaryText(message)}`,
  )
}

export function readR2CustomerBoundaryMemory(
  structuredFacts: unknown,
): R2CustomerBoundaryMemory {
  if (!isRecord(structuredFacts)) return EMPTY_MEMORY

  const candidate = structuredFacts.r2CustomerBoundary

  if (
    !isRecord(candidate) ||
    candidate.schemaVersion !== "1.0" ||
    !Array.isArray(candidate.observations) ||
    typeof candidate.currentState !== "string" ||
    typeof candidate.explicitRejectionCount !== "number" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return EMPTY_MEMORY
  }

  return candidate as R2CustomerBoundaryMemory
}

function signalFromText(
  normalized: string,
): Exclude<R2CustomerBoundarySignal, "INBOUND_REOPENED"> {
  const authorizesLaterContact =
    /\b(me chama|me chamar|fala comigo|pode chamar|retorna|pode retornar|me procura)\b/u.test(normalized) &&
    /\b(amanha|depois|mais tarde|semana que vem|mes que vem|proximo mes|outro dia|daqui a)\b/u.test(normalized)
  const temporaryUnavailability =
    /\b(agora nao|hoje nao|nao posso agora|nao quero agora|ocupad[oa])\b/u.test(normalized)

  if (authorizesLaterContact && temporaryUnavailability) {
    return "DELAY_WITH_PERMISSION"
  }

  const doNotContact =
    /\bnao\s+(?:me\s+)?(?:mande|mandar|envie|enviar|chama|chame|chamar|contate|contacte)(?:\s+mais)?\b/u.test(normalized) ||
    /\bnao entre mais em contato\b/u.test(normalized) ||
    /\b(?:pare|para)\s+de\s+(?:me\s+)?(?:mandar|enviar|chamar|contatar|contactar)\b/u.test(normalized) ||
    /\bnao quero (?:mais )?(?:mensagem|mensagens|contato)\b/u.test(normalized) ||
    /\b(remove|apaga|tira)\b.{0,25}\b(numero|contato|lista)\b/u.test(normalized) ||
    /\b(me deixa em paz|deixa eu em paz|nao me procure)\b/u.test(normalized)

  if (doNotContact) return "DO_NOT_CONTACT_REQUEST"

  const explicitlyKeepsProjectActive =
    /\b(mas|porem)\b.{0,80}\b(ainda quero|quero fazer|continuo com|projeto continua|projeto segue)\b/u.test(normalized)

  if (explicitlyKeepsProjectActive) return "OPEN"

  if (
    /\b(?:pare|para)\s+de\s+insistir\b/u.test(
      normalized,
    )
  ) {
    return "HOSTILE_REJECTION"
  }

  const explicitRejection =
    /\b(nao quero|nao tenho interesse|sem interesse|prefiro nao|nao vou fazer|desisti|nao quero mais|deixa quieto|nao faz sentido para mim)\b/u.test(normalized) ||
    /\b(ja falei|ja disse|ja te falei)\b.{0,35}\b(nao|sem interesse)\b/u.test(normalized)

  if (!explicitRejection) {
    const softRejection =
      /\b(acho que nao|talvez nao|melhor nao|por enquanto nao tenho interesse)\b/u.test(normalized)

    return softRejection
      ? "SOFT_REJECTION"
      : "OPEN"
  }

  const frustrated =
    /\b(merda|porra|saco|inferno|insistindo|insistencia|quantas vezes)\b/u.test(normalized) ||
    /\b(para|pare)\b.{0,20}\b(insistir|insistindo)\b/u.test(normalized)

  if (frustrated) return "HOSTILE_REJECTION"

  const repeated =
    /\b(ja falei|ja disse|ja te falei|de novo|quantas vezes)\b/u.test(normalized)

  return repeated
    ? "REPEATED_EXPLICIT_REJECTION"
    : "EXPLICIT_REJECTION"
}

function explicitInboundReopening(
  normalized: string,
): boolean {
  if (
    /\b(nao tenho interesse|nao quero|sem interesse)\b/u.test(
      normalized,
    )
  ) {
    return false
  }

  return /\b(pensei melhor|mudei de ideia|quero retomar|podemos retomar|tenho interesse|queria ver|quero ver|quanto ficaria|faz uma simulacao|me mostra a simulacao)\b/u.test(normalized)
}

function eventObservations(
  events: readonly BoundaryEvent[],
): readonly R2CustomerBoundaryObservation[] {
  return events.flatMap((event) => {
    const payload = event.payload

    if (payload.category === "r2_customer_boundary_detected") {
      const fingerprint = payload.fingerprint
      const signal = payload.signal
      const state = payload.state
      const sourceReference = payload.sourceReference

      if (
        typeof fingerprint === "string" &&
        typeof signal === "string" &&
        signal !== "OPEN" &&
        typeof state === "string" &&
        typeof sourceReference === "string"
      ) {
        return [{
          fingerprint,
          signal: signal as R2CustomerBoundaryObservation["signal"],
          state: state as R2CustomerBoundaryState,
          sourceReference,
          observedAt: new Date(event.occurredAt).toISOString(),
        }]
      }
    }

    const analysis = payload.analysisSnapshot

    if (
      payload.category === "r2_intelligence_recommendation" &&
      isRecord(analysis) &&
      analysis.intent === "not_interested"
    ) {
      const recommendationId =
        typeof payload.recommendationId === "string"
          ? payload.recommendationId
          : event.id
      const boundary = payload.customerBoundary
      const fingerprint =
        isRecord(boundary) &&
        typeof boundary.fingerprint === "string"
          ? boundary.fingerprint
          : `legacy:${recommendationId}`

      return [{
        fingerprint,
        signal: "EXPLICIT_REJECTION" as const,
        state: "REJECTION" as const,
        sourceReference: `commercial-event:${event.id}`,
        observedAt: new Date(event.occurredAt).toISOString(),
      }]
    }

    return []
  })
}

function stateForSignal(
  signal: R2CustomerBoundarySignal,
): R2CustomerBoundaryState {
  switch (signal) {
    case "OPEN":
      return "OPEN"
    case "DELAY_WITH_PERMISSION":
    case "SOFT_REJECTION":
    case "INBOUND_REOPENED":
      return "CAUTIOUS"
    case "EXPLICIT_REJECTION":
      return "REJECTION"
    case "REPEATED_EXPLICIT_REJECTION":
      return "REPEATED_REJECTION"
    case "HOSTILE_REJECTION":
      return "STOP_CURRENT_CONVERSATION"
    case "DO_NOT_CONTACT_REQUEST":
      return "DO_NOT_CONTACT"
  }
}

function isTerminalState(
  state: R2CustomerBoundaryState,
): boolean {
  return state === "REJECTION" ||
    state === "REPEATED_REJECTION" ||
    state === "STOP_CURRENT_CONVERSATION" ||
    state === "DO_NOT_CONTACT"
}

export function analyzeR2CustomerBoundary({
  opportunityId,
  message,
  structuredFacts,
  recentMessages = [],
  commercialEvents = [],
  sourceReference,
  observedAt = new Date(),
}: AnalyzeR2CustomerBoundaryInput): R2CustomerBoundaryContext {
  const memory = readR2CustomerBoundaryMemory(
    structuredFacts,
  )
  const historicalFromMessages = recentMessages.flatMap(
    (historicalMessage) => {
      const normalized = normalizeR2BoundaryText(
        historicalMessage,
      )
      const signal = signalFromText(normalized)

      if (signal === "OPEN") return []

      return [{
        fingerprint: buildR2BoundaryFingerprint(
          opportunityId,
          historicalMessage,
        ),
        signal,
        state: stateForSignal(signal),
        sourceReference: "conversation-history",
        observedAt: observedAt.toISOString(),
      } satisfies R2CustomerBoundaryObservation]
    },
  )
  const knownObservations = [
    ...memory.observations,
    ...eventObservations(commercialEvents),
    ...historicalFromMessages,
  ]
  const uniqueKnown = new Map(
    knownObservations.map((observation) => [
      observation.fingerprint,
      observation,
    ]),
  )
  const normalized = normalizeR2BoundaryText(message)
  const fingerprint = buildR2BoundaryFingerprint(
    opportunityId,
    message,
  )
  const existingCurrent = uniqueKnown.has(fingerprint)
  const historicalRejectionCount = [...uniqueKnown.values()]
    .filter((observation) =>
      EXPLICIT_REJECTION_SIGNALS.has(observation.signal),
    ).length
  const priorTerminal = isTerminalState(memory.currentState) ||
    [...uniqueKnown.values()].some((observation) =>
      isTerminalState(observation.state),
    )
  const inboundReopened =
    priorTerminal &&
    explicitInboundReopening(normalized)
  let signal: R2CustomerBoundarySignal = inboundReopened
    ? "INBOUND_REOPENED"
    : signalFromText(normalized)

  if (
    signal === "EXPLICIT_REJECTION" &&
    historicalRejectionCount > 0
  ) {
    signal = "REPEATED_EXPLICIT_REJECTION"
  }

  if (
    signal === "OPEN" &&
    priorTerminal
  ) {
    const lastTerminal = [...uniqueKnown.values()]
      .reverse()
      .find((observation) =>
        isTerminalState(observation.state),
      )

    if (lastTerminal) signal = lastTerminal.signal
  }

  const state = signal === "OPEN" && priorTerminal
    ? memory.currentState
    : stateForSignal(signal)
  const terminal = isTerminalState(state) && !inboundReopened
  const isRejection = REJECTION_SIGNALS.has(signal)
  const isExplicitRejection =
    EXPLICIT_REJECTION_SIGNALS.has(signal)
  const explicitRejectionCount = historicalRejectionCount +
    (
      isExplicitRejection && !existingCurrent
        ? 1
        : 0
    )
  const proactiveContactSuppressed = terminal ||
    (
      inboundReopened &&
      memory.currentState === "DO_NOT_CONTACT"
    )

  return {
    signal,
    state,
    intentConfidence:
      isRejection || signal === "INBOUND_REOPENED"
        ? "HIGH"
        : signal === "DELAY_WITH_PERMISSION"
          ? "HIGH"
          : "UNKNOWN",
    reasonForRejectionConfidence:
      isRejection ? "UNKNOWN" : "UNKNOWN",
    explicitRejectionCount,
    terminal,
    currentConversationClosed: terminal,
    proactiveContactSuppressed,
    outboundAutomationSuppressed:
      proactiveContactSuppressed,
    objectionHandlingAllowed: !terminal,
    fomoAllowed: !terminal,
    ctaAllowed: !terminal,
    questionAllowed: !terminal,
    inboundReopened,
    fingerprint,
    sourceReference:
      sourceReference ??
      `manual-whatsapp:${fingerprint}`,
    observedAt: observedAt.toISOString(),
    isNewObservation:
      signal !== "OPEN" &&
      !existingCurrent,
    rationale: terminal
      ? state === "DO_NOT_CONTACT"
        ? "O cliente pediu explicitamente o fim de contatos; comunicação comercial proativa deve permanecer suprimida."
        : "A rejeição explícita fecha a conversa atual; motivo desconhecido não autoriza nova pergunta comercial."
      : inboundReopened
        ? "O próprio cliente reabriu a conversa com intenção comercial explícita; o contexto pode ser reavaliado com cautela."
        : signal === "DELAY_WITH_PERMISSION"
          ? "O cliente adiou a conversa e autorizou contato posterior; isso não é rejeição terminal."
          : "Nenhuma fronteira terminal foi identificada.",
  }
}

export function evolveR2CustomerBoundaryMemory({
  structuredFacts,
  boundary,
}: Readonly<{
  structuredFacts: unknown
  boundary: R2CustomerBoundaryContext
}>): R2CustomerBoundaryMemory {
  const memory = readR2CustomerBoundaryMemory(
    structuredFacts,
  )
  const observations = [...memory.observations]

  if (
    boundary.signal !== "OPEN" &&
    !observations.some((observation) =>
      observation.fingerprint === boundary.fingerprint,
    )
  ) {
    observations.push({
      fingerprint: boundary.fingerprint,
      signal: boundary.signal,
      state: boundary.state,
      sourceReference: boundary.sourceReference,
      observedAt: boundary.observedAt,
    })
  }

  return {
    schemaVersion: "1.0",
    currentState: boundary.state,
    explicitRejectionCount:
      boundary.explicitRejectionCount,
    observations: observations.slice(-25),
    updatedAt: boundary.observedAt,
  }
}

export function writeR2CustomerBoundaryMemory(
  structuredFacts: unknown,
  memory: R2CustomerBoundaryMemory,
): Readonly<Record<string, unknown>> {
  return {
    ...(isRecord(structuredFacts) ? structuredFacts : {}),
    r2CustomerBoundary: memory,
  }
}

export function latestR2CustomerBoundaryFromEvents(
  events: readonly BoundaryEvent[],
): R2CustomerBoundaryContext | null {
  const event = [...events]
    .sort((first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
    )
    .find((candidate) =>
      candidate.payload.category ===
        "r2_customer_boundary_detected",
    )

  if (!event) return null

  const payload = event.payload

  if (
    typeof payload.signal !== "string" ||
    typeof payload.state !== "string" ||
    typeof payload.fingerprint !== "string" ||
    typeof payload.sourceReference !== "string" ||
    typeof payload.observedAt !== "string" ||
    typeof payload.explicitRejectionCount !== "number"
  ) {
    return null
  }

  const state = payload.state as R2CustomerBoundaryState
  const terminal = isTerminalState(state)

  return {
    signal: payload.signal as R2CustomerBoundarySignal,
    state,
    intentConfidence: "HIGH",
    reasonForRejectionConfidence: "UNKNOWN",
    explicitRejectionCount: payload.explicitRejectionCount,
    terminal,
    currentConversationClosed: terminal,
    proactiveContactSuppressed: terminal,
    outboundAutomationSuppressed: terminal,
    objectionHandlingAllowed: !terminal,
    fomoAllowed: !terminal,
    ctaAllowed: !terminal,
    questionAllowed: !terminal,
    inboundReopened:
      payload.signal === "INBOUND_REOPENED",
    fingerprint: payload.fingerprint,
    sourceReference: payload.sourceReference,
    observedAt: payload.observedAt,
    isNewObservation: false,
    rationale:
      typeof payload.rationale === "string"
        ? payload.rationale
        : "Boundary recuperada do audit trail comercial.",
  }
}
