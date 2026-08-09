import type {
  OpportunityContactContextView,
} from "@/types/opportunity-details"

export type BuildOpportunitySuggestedMessageInput = {
  contactName: string
  consultantName: string
  contactContext:
    | OpportunityContactContextView
    | null
    | undefined
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim()

  return normalized || null
}

function removeTerminalPunctuation(
  value: string,
): string {
  return value
    .replace(/[.!?;:]+$/u, "")
    .trim()
}

function lowercaseInitial(
  value: string,
): string {
  if (!value) {
    return value
  }

  return `${value[0].toLocaleLowerCase(
    "pt-BR",
  )}${value.slice(1)}`
}

function extractUsableFirstName(
  value: string,
): string | null {
  const normalized =
    normalizeOptionalText(value)

  if (
    !normalized ||
    /nao identificado/iu.test(
      normalized
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          "",
        ),
    )
  ) {
    return null
  }

  return (
    normalized.split(/\s+/u)[0] ??
    null
  )
}

function buildGreeting(
  contactName: string,
): string {
  const firstName =
    extractUsableFirstName(
      contactName,
    )

  return firstName
    ? `Olá, ${firstName}! Tudo bem?`
    : "Olá! Tudo bem?"
}

function buildConsultantName(
  consultantName: string,
): string {
  return (
    normalizeOptionalText(
      consultantName,
    ) ?? "Rafael Barcelos"
  )
}

function buildNewContactMessage({
  contactName,
  consultantName,
}: {
  contactName: string
  consultantName: string
}): string {
  const greeting =
    buildGreeting(contactName)

  const consultant =
    buildConsultantName(
      consultantName,
    )

  return [
    greeting,
    `Meu nome é ${consultant}.`,
    "Sou consultor especialista em planejamento patrimonial e investimentos por meio do consórcio.",
    "Vi que você demonstrou interesse em conhecer melhor essa alternativa e queria entender um pouco do seu projeto.",
    "Hoje você pensa mais em imóvel, veículo ou investimento?",
  ].join(" ")
}

function buildReactivationMessage({
  contactName,
  consultantName,
  contactContext,
}: {
  contactName: string
  consultantName: string
  contactContext:
    OpportunityContactContextView
}): string {
  const greeting =
    buildGreeting(contactName)

  const consultantFirstName =
    extractUsableFirstName(
      consultantName,
    ) ?? "Rafael"

  const objective =
    normalizeOptionalText(
      contactContext.objective,
    )

  const memorySentence = objective
    ? `Passei pelo seu cadastro hoje e vi seu interesse em ${lowercaseInitial(
        removeTerminalPunctuation(
          objective,
        ),
      )}.`
    : "Passei pelo seu cadastro hoje e quis retomar seu interesse."

  return [
    greeting,
    `Aqui é o ${consultantFirstName}.`,
    memorySentence,
    "Queria entender como esse projeto evoluiu.",
    "Você conseguiu avançar ou ainda está estudando as possibilidades?",
  ].join(" ")
}

export function buildOpportunitySuggestedMessage({
  contactName,
  consultantName,
  contactContext,
}: BuildOpportunitySuggestedMessageInput): string | null {
  if (
    !contactContext ||
    !contactContext.approachType
  ) {
    return null
  }

  if (
    contactContext.approachType ===
    "reactivation"
  ) {
    return buildReactivationMessage({
      contactName,
      consultantName,
      contactContext,
    })
  }

  return buildNewContactMessage({
    contactName,
    consultantName,
  })
}
