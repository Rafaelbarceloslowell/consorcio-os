import type {
    JourneyPhase,
    JourneyState,
    WorkflowRule,
  } from "@/types/domain"
  
  import type {
    ValidateWorkflowTransitionInput,
    ValidateWorkflowTransitionOutput,
    WorkflowValidationError,
  } from "./types"
  
  function createValidationError(
    code: WorkflowValidationError["code"],
    message: string,
  ): WorkflowValidationError {
    return {
      code,
      message,
    }
  }
  
  function findStateById(
    states: JourneyState[],
    stateId: string,
  ): JourneyState | null {
    return (
      states.find(
        (state) =>
          state.id === stateId,
      ) ?? null
    )
  }
  
  function findPhaseById(
    phases: JourneyPhase[],
    phaseId: string,
  ): JourneyPhase | null {
    return (
      phases.find(
        (phase) =>
          phase.id === phaseId,
      ) ?? null
    )
  }
  
  function belongsToWorkspace(
    resourceWorkspaceId: string | null,
    journeyWorkspaceId: string,
  ): boolean {
    return (
      resourceWorkspaceId === null ||
      resourceWorkspaceId ===
        journeyWorkspaceId
    )
  }
  
  function collectMatchingRules(
    input: ValidateWorkflowTransitionInput,
  ): WorkflowRule[] {
    return input.rules
      .filter(
        (rule) =>
          rule.isActive,
      )
      .filter(
        (rule) =>
          belongsToWorkspace(
            rule.workspaceId,
            input.journey.workspaceId,
          ),
      )
      .filter((rule) => {
        if (
          rule.sourceStateId !==
            undefined &&
          rule.sourceStateId !==
            input.journey.currentStateId
        ) {
          return false
        }
  
        if (
          rule.targetStateId !==
            undefined &&
          rule.targetStateId !==
            input.targetStateId
        ) {
          return false
        }
  
        if (
          input.eventType !==
            undefined &&
          rule.eventType !==
            input.eventType
        ) {
          return false
        }
  
        return true
      })
      .sort((first, second) => {
        if (
          first.priority !==
          second.priority
        ) {
          return (
            first.priority -
            second.priority
          )
        }
  
        return first.id.localeCompare(
          second.id,
        )
      })
  }
  
  function validateJourneyWorkspace(
    input: ValidateWorkflowTransitionInput,
    sourceState: JourneyState | null,
    targetState: JourneyState | null,
    errors: WorkflowValidationError[],
  ): void {
    if (
      sourceState !== null &&
      sourceState.workspaceId !==
        input.journey.workspaceId
    ) {
      errors.push(
        createValidationError(
          "JOURNEY_NOT_IN_WORKSPACE",
          `O estado atual "${sourceState.id}" não pertence ao workspace da jornada "${input.journey.id}".`,
        ),
      )
    }
  
    if (
      targetState !== null &&
      targetState.workspaceId !==
        input.journey.workspaceId
    ) {
      errors.push(
        createValidationError(
          "WORKSPACE_MISMATCH",
          `O estado de destino "${targetState.id}" não pertence ao workspace da jornada "${input.journey.id}".`,
        ),
      )
    }
  }
  
  function validateVersion(
    input: ValidateWorkflowTransitionInput,
    errors: WorkflowValidationError[],
  ): void {
    if (
      input.expectedVersion ===
      undefined
    ) {
      return
    }
  
    if (
      input.expectedVersion !==
      input.journey.version
    ) {
      errors.push(
        createValidationError(
          "VERSION_CONFLICT",
          `A jornada "${input.journey.id}" está na versão ${input.journey.version}, mas a transição esperava a versão ${input.expectedVersion}.`,
        ),
      )
    }
  }
  
  function validateCurrentState(
    input: ValidateWorkflowTransitionInput,
    sourceState: JourneyState | null,
    errors: WorkflowValidationError[],
  ): void {
    if (
      sourceState !== null
    ) {
      return
    }
  
    errors.push(
      createValidationError(
        "SOURCE_STATE_NOT_FOUND",
        `O estado atual "${input.journey.currentStateId}" da jornada "${input.journey.id}" não foi encontrado.`,
      ),
    )
  }
  
  function validateTargetState(
    input: ValidateWorkflowTransitionInput,
    targetState: JourneyState | null,
    errors: WorkflowValidationError[],
  ): void {
    if (
      targetState === null
    ) {
      errors.push(
        createValidationError(
          "TARGET_STATE_NOT_FOUND",
          `O estado de destino "${input.targetStateId}" não foi encontrado.`,
        ),
      )
  
      return
    }
  
    if (
      !targetState.isActive
    ) {
      errors.push(
        createValidationError(
          "TARGET_STATE_INACTIVE",
          `O estado de destino "${targetState.id}" está inativo.`,
        ),
      )
    }
  }
  
  function validatePhases(
    sourceState: JourneyState | null,
    targetState: JourneyState | null,
    sourcePhase: JourneyPhase | null,
    targetPhase: JourneyPhase | null,
    errors: WorkflowValidationError[],
  ): void {
    if (
      sourceState !== null &&
      sourcePhase === null
    ) {
      errors.push(
        createValidationError(
          "SOURCE_PHASE_NOT_FOUND",
          `A fase "${sourceState.phaseId}" do estado atual "${sourceState.id}" não foi encontrada.`,
        ),
      )
    }
  
    if (
      targetState !== null &&
      targetPhase === null
    ) {
      errors.push(
        createValidationError(
          "TARGET_PHASE_NOT_FOUND",
          `A fase "${targetState.phaseId}" do estado de destino "${targetState.id}" não foi encontrada.`,
        ),
      )
    }
  
    if (
      targetPhase !== null &&
      !targetPhase.isActive
    ) {
      errors.push(
        createValidationError(
          "TARGET_PHASE_INACTIVE",
          `A fase de destino "${targetPhase.id}" está inativa.`,
        ),
      )
    }
  }
  
  function validateSameState(
    input: ValidateWorkflowTransitionInput,
    errors: WorkflowValidationError[],
  ): void {
    if (
      input.journey.currentStateId !==
      input.targetStateId
    ) {
      return
    }
  
    errors.push(
      createValidationError(
        "SAME_STATE",
        `A jornada "${input.journey.id}" já está no estado "${input.targetStateId}".`,
      ),
    )
  }
  
  function validateClosedJourney(
    input: ValidateWorkflowTransitionInput,
    sourceState: JourneyState | null,
    targetState: JourneyState | null,
    errors: WorkflowValidationError[],
  ): void {
    const journeyIsClosed =
      input.journey.closedAt !== null ||
      input.journey.outcome !== null ||
      sourceState?.isFinal === true
  
    if (
      !journeyIsClosed
    ) {
      return
    }
  
    const isReopening =
      targetState !== null &&
      !targetState.isFinal
  
    if (
      isReopening
    ) {
      if (
        sourceState?.allowReopen !== true
      ) {
        errors.push(
          createValidationError(
            "REOPEN_NOT_ALLOWED",
            `O estado atual "${sourceState?.id ?? input.journey.currentStateId}" não permite reabrir a jornada "${input.journey.id}".`,
          ),
        )
      }
  
      return
    }
  
    errors.push(
      createValidationError(
        "JOURNEY_ALREADY_CLOSED",
        `A jornada "${input.journey.id}" já está encerrada.`,
      ),
    )
  }
  
  function addTransitionWarnings(
    sourcePhase: JourneyPhase | null,
    targetPhase: JourneyPhase | null,
    warnings: string[],
  ): void {
    if (
      sourcePhase === null ||
      targetPhase === null
    ) {
      return
    }
  
    if (
      targetPhase.order <
      sourcePhase.order
    ) {
      warnings.push(
        `A transição retorna da fase "${sourcePhase.name}" para a fase anterior "${targetPhase.name}".`,
      )
    }
  
    if (
      targetPhase.order >
      sourcePhase.order + 1
    ) {
      warnings.push(
        `A transição pula da fase "${sourcePhase.name}" para "${targetPhase.name}".`,
      )
    }
  }
  
  export function validateWorkflowTransition(
    input: ValidateWorkflowTransitionInput,
  ): ValidateWorkflowTransitionOutput {
    const errors: WorkflowValidationError[] =
      []
  
    const warnings: string[] =
      []
  
    const diagnostics: string[] =
      []
  
    const sourceState =
      findStateById(
        input.states,
        input.journey.currentStateId,
      )
  
    const targetState =
      findStateById(
        input.states,
        input.targetStateId,
      )
  
    const sourcePhase =
      sourceState === null
        ? null
        : findPhaseById(
            input.phases,
            sourceState.phaseId,
          )
  
    const targetPhase =
      targetState === null
        ? null
        : findPhaseById(
            input.phases,
            targetState.phaseId,
          )
  
    validateVersion(
      input,
      errors,
    )
  
    validateCurrentState(
      input,
      sourceState,
      errors,
    )
  
    validateTargetState(
      input,
      targetState,
      errors,
    )
  
    validateJourneyWorkspace(
      input,
      sourceState,
      targetState,
      errors,
    )
  
    validatePhases(
      sourceState,
      targetState,
      sourcePhase,
      targetPhase,
      errors,
    )
  
    validateSameState(
      input,
      errors,
    )
  
    validateClosedJourney(
      input,
      sourceState,
      targetState,
      errors,
    )
  
    addTransitionWarnings(
      sourcePhase,
      targetPhase,
      warnings,
    )
  
    const matchedRules =
      collectMatchingRules(
        input,
      )
  
    diagnostics.push(
      `Foram encontradas ${matchedRules.length} regras de workflow compatíveis com a transição da jornada "${input.journey.id}".`,
    )
  
    if (
      sourceState !== null &&
      targetState !== null
    ) {
      diagnostics.push(
        `A transição solicitada move a jornada "${input.journey.id}" do estado "${sourceState.id}" para "${targetState.id}".`,
      )
    }
  
    const allowed =
      errors.length === 0
  
    diagnostics.push(
      allowed
        ? `A transição da jornada "${input.journey.id}" foi validada com sucesso.`
        : `A transição da jornada "${input.journey.id}" foi rejeitada com ${errors.length} erro(s).`,
    )
  
    return {
      allowed,
      sourceState,
      targetState,
      sourcePhase,
      targetPhase,
      matchedRules,
      errors,
      warnings,
      diagnostics,
    }
  }