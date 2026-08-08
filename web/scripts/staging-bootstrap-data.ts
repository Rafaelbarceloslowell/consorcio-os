export const stagingPipelineStages = [
  { name: "Prospecção", order: 1, type: "LEAD", color: "#6366f1", winProbability: "10.00", isClosedStage: false, isWonStage: false },
  { name: "Qualificação", order: 2, type: "LEAD", color: "#8b5cf6", winProbability: "25.00", isClosedStage: false, isWonStage: false },
  { name: "Proposta", order: 3, type: "LEAD", color: "#0ea5e9", winProbability: "50.00", isClosedStage: false, isWonStage: false },
  { name: "Negociação", order: 4, type: "LEAD", color: "#f59e0b", winProbability: "75.00", isClosedStage: false, isWonStage: false },
  { name: "Fechamento", order: 5, type: "LEAD", color: "#10b981", winProbability: "90.00", isClosedStage: false, isWonStage: false },
  { name: "Ganho", order: 6, type: "DEAL", color: "#059669", winProbability: "100.00", isClosedStage: true, isWonStage: true },
  { name: "Perdido", order: 7, type: "DEAL", color: "#ef4444", winProbability: "0.00", isClosedStage: true, isWonStage: false },
] as const

export const stagingJourneyPhases = [
  { code: "ACQUISITION", name: "Aquisição", order: 1 },
  { code: "QUALIFICATION", name: "Qualificação", order: 2 },
  { code: "SOLUTION_DESIGN", name: "Estruturação da solução", order: 3 },
  { code: "NEGOTIATION", name: "Negociação", order: 4 },
  { code: "ACTIVATION", name: "Ativação", order: 5 },
  { code: "CLOSED", name: "Encerramento", order: 6 },
] as const

export const stagingJourneyStates = [
  { phaseCode: "ACQUISITION", code: "NEW_LEAD", name: "Novo lead", order: 1, color: "#6366f1", icon: "user-plus", isInitial: true },
  { phaseCode: "ACQUISITION", code: "AWAITING_FIRST_CONTACT", name: "Aguardando primeiro contato", order: 2, color: "#818cf8", icon: "phone" },
  { phaseCode: "QUALIFICATION", code: "CONTACTED", name: "Contatado", order: 1, color: "#8b5cf6", icon: "message-circle" },
  { phaseCode: "QUALIFICATION", code: "AWAITING_RESPONSE", name: "Aguardando resposta", order: 2, color: "#a78bfa", icon: "clock" },
  { phaseCode: "QUALIFICATION", code: "QUALIFIED", name: "Qualificado", order: 3, color: "#7c3aed", icon: "badge-check" },
  { phaseCode: "SOLUTION_DESIGN", code: "SIMULATION_PREPARATION", name: "Preparando simulação", order: 1, color: "#0ea5e9", icon: "calculator" },
  { phaseCode: "SOLUTION_DESIGN", code: "PROPOSAL_PREPARATION", name: "Preparando proposta", order: 2, color: "#0284c7", icon: "file-text" },
  { phaseCode: "SOLUTION_DESIGN", code: "PROPOSAL_SENT", name: "Proposta enviada", order: 3, color: "#0369a1", icon: "send" },
  { phaseCode: "NEGOTIATION", code: "IN_NEGOTIATION", name: "Em negociação", order: 1, color: "#f59e0b", icon: "handshake" },
  { phaseCode: "NEGOTIATION", code: "AWAITING_DECISION", name: "Aguardando decisão", order: 2, color: "#d97706", icon: "hourglass" },
  { phaseCode: "ACTIVATION", code: "AWAITING_DOCUMENTS", name: "Aguardando documentos", order: 1, color: "#14b8a6", icon: "folder-clock" },
  { phaseCode: "ACTIVATION", code: "AWAITING_SIGNATURE", name: "Aguardando assinatura", order: 2, color: "#0d9488", icon: "pen-line" },
  { phaseCode: "CLOSED", code: "WON", name: "Ganho", order: 1, color: "#10b981", icon: "trophy", isFinal: true, isWon: true },
  { phaseCode: "CLOSED", code: "LOST", name: "Perdido", order: 2, color: "#ef4444", icon: "circle-x", isFinal: true, isLost: true, allowReopen: true },
  { phaseCode: "CLOSED", code: "POSTPONED", name: "Adiado", order: 3, color: "#64748b", icon: "calendar-clock", isFinal: true, allowReopen: true },
] as const

export type StagingBootstrapEnvironment = Readonly<
  Record<string, string | undefined>
>

export type StagingBootstrapConfiguration = {
  workspaceSlug: string
  consultantEmail: string
}

function requiredValue(
  environment: StagingBootstrapEnvironment,
  name: string,
): string {
  const value = environment[name]?.trim()

  if (!value) {
    throw new Error(
      `A variável ${name} é obrigatória para o bootstrap de staging.`,
    )
  }

  return value
}

export function readStagingBootstrapConfiguration(
  environment: StagingBootstrapEnvironment = process.env,
): StagingBootstrapConfiguration {
  if (
    requiredValue(
      environment,
      "STAGING_BOOTSTRAP_CONFIRM",
    ) !== "STAGING"
  ) {
    throw new Error(
      "STAGING_BOOTSTRAP_CONFIRM deve ser exatamente STAGING.",
    )
  }

  const consultantEmail = requiredValue(
    environment,
    "STAGING_CONSULTANT_EMAIL",
  ).toLowerCase()

  if (!consultantEmail.includes("@")) {
    throw new Error(
      "STAGING_CONSULTANT_EMAIL não possui formato válido.",
    )
  }

  return {
    workspaceSlug: requiredValue(
      environment,
      "WORKSPACE_SLUG",
    ),
    consultantEmail,
  }
}
