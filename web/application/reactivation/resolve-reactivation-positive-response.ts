export type ReactivationResponseIntent =
  | "POSITIVE_INTEREST"
  | "QUESTION_OR_INFORMATION_REQUEST"
  | "TEMPORARILY_UNAVAILABLE"
  | "NEGATIVE_INTEREST"
  | "UNCLEAR"

export type ReactivationPositiveResponseObjective =
  | "CONTINUE_REACTIVATION"
  | "RESPOND_AND_QUALIFY"
  | "HONOR_NEXT_STEP"
  | "PREPARE_MEETING"

export type ReactivationPositiveResponseInput = Readonly<{
  reactivationActive: boolean
  customerReplied: boolean
  intent: ReactivationResponseIntent
  nextStepDefined?: boolean
  meetingScheduled?: boolean
}>

export type ReactivationPositiveResponseTransition = Readonly<{
  handled: boolean
  stopReactivationSequence: boolean
  serviceState:
    | "REACTIVATION"
    | "ACTIVE_CONVERSATION"
  checkRestartBlocked: boolean
  objective: ReactivationPositiveResponseObjective
  localSignals: readonly string[]
  requestedExternalEvents: readonly string[]
  reason: string
}>

export type ReactivationCheckResumeInput = Readonly<{
  positiveResponseRecorded: boolean
  newNoResponseDetected: boolean
  maestroAuthorizedNewCadence: boolean
  nextStepDefined?: boolean
  meetingScheduled?: boolean
}>

export type ReactivationCheckResumeDecision = Readonly<{
  allowed: boolean
  reasonCode:
    | "POSITIVE_RESPONSE_NOT_RECORDED"
    | "MEETING_ACTIVE"
    | "NEXT_STEP_ACTIVE"
    | "NO_NEW_ABSENCE"
    | "MAESTRO_AUTHORIZATION_REQUIRED"
    | "AUTHORIZED"
  reason: string
}>

export function resolveReactivationPositiveResponse(
  input: ReactivationPositiveResponseInput,
): ReactivationPositiveResponseTransition {
  const positiveResponse =
    input.reactivationActive &&
    input.customerReplied &&
    input.intent ===
      "POSITIVE_INTEREST"

  if (!positiveResponse) {
    return {
      handled: false,
      stopReactivationSequence: false,
      serviceState:
        "REACTIVATION",
      checkRestartBlocked: false,
      objective:
        "CONTINUE_REACTIVATION",
      localSignals: [],
      requestedExternalEvents: [],
      reason:
        "Nenhuma resposta positiva de reativação foi confirmada.",
    }
  }

  const objective =
    input.meetingScheduled
      ? "PREPARE_MEETING"
      : input.nextStepDefined
        ? "HONOR_NEXT_STEP"
        : "RESPOND_AND_QUALIFY"

  return {
    handled: true,
    stopReactivationSequence: true,
    serviceState:
      "ACTIVE_CONVERSATION",
    checkRestartBlocked: true,
    objective,
    localSignals: [
      "POSITIVE_INTEREST",
    ],
    requestedExternalEvents: [
      "CUSTOMER_REPLIED",
      "REACTIVATION_STOPPED",
      "ACTIVE_SERVICE_REQUIRED",
    ],
    reason:
      "A resposta positiva encerra a reativação e devolve o lead ao atendimento ativo. Os Checks permanecem bloqueados até uma nova ausência e autorização oficial do Maestro.",
  }
}

export function resolveCheckResumeAfterPositiveResponse(
  input: ReactivationCheckResumeInput,
): ReactivationCheckResumeDecision {
  if (!input.positiveResponseRecorded) {
    return {
      allowed: false,
      reasonCode:
        "POSITIVE_RESPONSE_NOT_RECORDED",
      reason:
        "Não existe uma resposta positiva registrada para aplicar esta regra de retorno.",
    }
  }

  if (input.meetingScheduled) {
    return {
      allowed: false,
      reasonCode:
        "MEETING_ACTIVE",
      reason:
        "Uma reunião está ativa; nenhuma nova cadência de tentativa deve ser iniciada.",
    }
  }

  if (input.nextStepDefined) {
    return {
      allowed: false,
      reasonCode:
        "NEXT_STEP_ACTIVE",
      reason:
        "Existe um próximo passo definido; ele deve ser cumprido antes de qualquer nova cadência.",
    }
  }

  if (!input.newNoResponseDetected) {
    return {
      allowed: false,
      reasonCode:
        "NO_NEW_ABSENCE",
      reason:
        "O cliente não voltou a ficar sem resposta; os Checks continuam bloqueados.",
    }
  }

  if (!input.maestroAuthorizedNewCadence) {
    return {
      allowed: false,
      reasonCode:
        "MAESTRO_AUTHORIZATION_REQUIRED",
      reason:
        "Uma nova ausência foi detectada, mas o Maestro ainda não autorizou uma nova cadência.",
    }
  }

  return {
    allowed: true,
    reasonCode:
      "AUTHORIZED",
    reason:
      "Uma nova ausência foi detectada e o Maestro autorizou uma nova cadência.",
  }
}
