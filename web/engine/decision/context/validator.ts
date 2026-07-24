import type { EnrichedCommercialContext } from "./enricher"
import type { CommercialContext } from "./types"

export type CommercialContextValidationSeverity =
  | "ERROR"
  | "WARNING"

export type CommercialContextValidationIssue = {
  code: string
  message: string
  severity: CommercialContextValidationSeverity
}

export type CommercialContextValidationResult = {
  isValid: boolean
  errors: CommercialContextValidationIssue[]
  warnings: CommercialContextValidationIssue[]
  issues: CommercialContextValidationIssue[]
}

export type ValidateCommercialContextInput = {
  context:
    | CommercialContext
    | EnrichedCommercialContext
}

function createIssue(
  code: string,
  message: string,
  severity: CommercialContextValidationSeverity,
): CommercialContextValidationIssue {
  return {
    code,
    message,
    severity,
  }
}

export function validateCommercialContext(
  input: ValidateCommercialContextInput,
): CommercialContextValidationResult {
  const { context } = input

  const issues: CommercialContextValidationIssue[] = []

  const {
    journey,
    lead,
    client,
    phase,
    state,
    events,
    actions,
    recommendations,
    now,
  } = context

  if (journey.score < 0 || journey.score > 100) {
    issues.push(
      createIssue(
        "JOURNEY_SCORE_OUT_OF_RANGE",
        `O score da jornada deve estar entre 0 e 100. Valor recebido: ${journey.score}.`,
        "ERROR",
      ),
    )
  }

  if (
    journey.currentPhaseId &&
    phase &&
    journey.currentPhaseId !== phase.id
  ) {
    issues.push(
      createIssue(
        "JOURNEY_PHASE_MISMATCH",
        "A fase carregada não corresponde à fase atual da jornada.",
        "ERROR",
      ),
    )
  }

  if (
    journey.currentStateId &&
    state &&
    journey.currentStateId !== state.id
  ) {
    issues.push(
      createIssue(
        "JOURNEY_STATE_MISMATCH",
        "O estado carregado não corresponde ao estado atual da jornada.",
        "ERROR",
      ),
    )
  }

  if (
    phase &&
    state &&
    state.phaseId !== phase.id
  ) {
    issues.push(
      createIssue(
        "STATE_PHASE_MISMATCH",
        "O estado comercial carregado não pertence à fase comercial informada.",
        "ERROR",
      ),
    )
  }

  if (state?.isWon && state.isLost) {
    issues.push(
      createIssue(
        "STATE_WON_AND_LOST",
        "O estado comercial não pode ser marcado simultaneamente como ganho e perdido.",
        "ERROR",
      ),
    )
  }

  if (
    journey.closedAt &&
    state &&
    !state.isWon &&
    !state.isLost
  ) {
    issues.push(
      createIssue(
        "CLOSED_JOURNEY_WITHOUT_FINAL_OUTCOME",
        "A jornada está fechada, mas o estado atual não está marcado como ganho ou perdido.",
        "WARNING",
      ),
    )
  }

  if (
    !journey.closedAt &&
    state &&
    (state.isWon || state.isLost)
  ) {
    issues.push(
      createIssue(
        "OPEN_JOURNEY_WITH_FINAL_STATE",
        "A jornada está aberta, mas o estado atual está marcado como ganho ou perdido.",
        "WARNING",
      ),
    )
  }

  if (
    journey.leadId &&
    lead &&
    lead.id !== journey.leadId
  ) {
    issues.push(
      createIssue(
        "JOURNEY_LEAD_MISMATCH",
        "O lead carregado não corresponde ao lead vinculado à jornada.",
        "ERROR",
      ),
    )
  }

  if (
    journey.clientId &&
    client &&
    client.id !== journey.clientId
  ) {
    issues.push(
      createIssue(
        "JOURNEY_CLIENT_MISMATCH",
        "O cliente carregado não corresponde ao cliente vinculado à jornada.",
        "ERROR",
      ),
    )
  }

  if (journey.lastInteractionAt) {
    const lastInteractionAt = new Date(
      journey.lastInteractionAt,
    )

    if (
      lastInteractionAt.getTime() >
      now.getTime()
    ) {
      issues.push(
        createIssue(
          "LAST_INTERACTION_IN_FUTURE",
          "A última interação da jornada não pode estar no futuro.",
          "ERROR",
        ),
      )
    }
  }

  if (journey.closedAt) {
    const closedAt = new Date(
      journey.closedAt,
    )

    if (closedAt.getTime() > now.getTime()) {
      issues.push(
        createIssue(
          "JOURNEY_CLOSED_IN_FUTURE",
          "A data de encerramento da jornada não pode estar no futuro.",
          "ERROR",
        ),
      )
    }
  }

  const foreignEvents = events.filter(
    (event) =>
      event.journeyId !== journey.id,
  )

  if (foreignEvents.length > 0) {
    issues.push(
      createIssue(
        "FOREIGN_EVENTS_IN_CONTEXT",
        `${foreignEvents.length} evento(s) não pertencem à jornada atual.`,
        "ERROR",
      ),
    )
  }

  const foreignActions = actions.filter(
    (action) =>
      action.journeyId !== journey.id,
  )

  if (foreignActions.length > 0) {
    issues.push(
      createIssue(
        "FOREIGN_ACTIONS_IN_CONTEXT",
        `${foreignActions.length} ação(ões) não pertencem à jornada atual.`,
        "ERROR",
      ),
    )
  }

  const foreignRecommendations =
    recommendations.filter(
      (recommendation) =>
        recommendation.journeyId !==
        journey.id,
    )

  if (foreignRecommendations.length > 0) {
    issues.push(
      createIssue(
        "FOREIGN_RECOMMENDATIONS_IN_CONTEXT",
        `${foreignRecommendations.length} recomendação(ões) não pertencem à jornada atual.`,
        "ERROR",
      ),
    )
  }

  if (!phase && journey.currentPhaseId) {
    issues.push(
      createIssue(
        "CURRENT_PHASE_NOT_LOADED",
        "A jornada possui uma fase atual, mas nenhuma fase foi carregada no contexto.",
        "WARNING",
      ),
    )
  }

  if (!state && journey.currentStateId) {
    issues.push(
      createIssue(
        "CURRENT_STATE_NOT_LOADED",
        "A jornada possui um estado atual, mas nenhum estado foi carregado no contexto.",
        "WARNING",
      ),
    )
  }

  if (!lead && journey.leadId) {
    issues.push(
      createIssue(
        "LEAD_NOT_LOADED",
        "A jornada possui um lead vinculado, mas o lead não foi carregado no contexto.",
        "WARNING",
      ),
    )
  }

  if (!client && journey.clientId) {
    issues.push(
      createIssue(
        "CLIENT_NOT_LOADED",
        "A jornada possui um cliente vinculado, mas o cliente não foi carregado no contexto.",
        "WARNING",
      ),
    )
  }

  const errors = issues.filter(
    (issue) =>
      issue.severity === "ERROR",
  )

  const warnings = issues.filter(
    (issue) =>
      issue.severity === "WARNING",
  )

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    issues,
  }
}