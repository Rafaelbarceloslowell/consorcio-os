import type {
  CommercialAction,
  CommercialEvent,
  CommercialJourney,
  WorkflowRule,
  WorkflowRuleAction,
  WorkflowRuleCondition,
} from "@/types/domain"

import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

export type ExecuteWorkflowInput = {
  workspaceId:
    string

  event:
    CommercialEvent
}

export type WorkflowExecutorCommonDependencies = {
  now?: Date

  generateActionId?: () => string
}

export type WorkflowExecutorLegacyDependencies =
  WorkflowExecutorCommonDependencies & {
    commercialRepository:
      CommercialRepository
  }

export type WorkflowExecutorAsyncDependencies =
  WorkflowExecutorCommonDependencies & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type WorkflowExecutorDependencies =
  | WorkflowExecutorLegacyDependencies
  | WorkflowExecutorAsyncDependencies

export type WorkflowRuleExecution = {
  rule:
    WorkflowRule

  actions:
    CommercialAction[]
}

export type ExecuteWorkflowResult = {
  matchedRules:
    WorkflowRuleExecution[]

  createdActions:
    CommercialAction[]
}

type WorkflowConditionContext = {
  journey:
    CommercialJourney

  event:
    CommercialEvent
}

function generateDefaultActionId(): string {
  return `commercial-action-${globalThis.crypto.randomUUID()}`
}

function isAsyncCommercialRepositories(
  commercialRepository:
    | CommercialRepository
    | AsyncCommercialRepositories,
): commercialRepository is AsyncCommercialRepositories {
  if (
    !(
      "journeys" in
      commercialRepository
    ) ||
    !(
      "workflowRules" in
      commercialRepository
    ) ||
    !(
      "actions" in
      commercialRepository
    )
  ) {
    return false
  }

  return (
    typeof commercialRepository
      .journeys
      .findById ===
      "function" &&
    typeof commercialRepository
      .workflowRules
      .findAll ===
      "function" &&
    typeof commercialRepository
      .actions
      .create ===
      "function"
  )
}

function getNestedValue(
  source:
    unknown,
  path:
    string,
): unknown {
  if (!path.trim()) {
    return undefined
  }

  return path
    .split(".")
    .reduce<unknown>(
      (
        currentValue,
        property,
      ) => {
        if (
          typeof currentValue !==
            "object" ||
          currentValue === null ||
          Array.isArray(
            currentValue,
          )
        ) {
          return undefined
        }

        return (
          currentValue as Record<
            string,
            unknown
          >
        )[property]
      },
      source,
    )
}

function compareNumericValues(
  currentValue:
    unknown,
  expectedValue:
    unknown,
  comparator: (
    current:
      number,
    expected:
      number,
  ) => boolean,
): boolean {
  if (
    typeof currentValue !==
      "number" ||
    typeof expectedValue !==
      "number"
  ) {
    return false
  }

  return comparator(
    currentValue,
    expectedValue,
  )
}

function evaluateCondition(
  condition:
    WorkflowRuleCondition,
  context:
    WorkflowConditionContext,
): boolean {
  const currentValue =
    getNestedValue(
      context,
      condition.field,
    )

  switch (condition.operator) {
    case "EQUALS":
      return (
        currentValue ===
        condition.value
      )

    case "NOT_EQUALS":
      return (
        currentValue !==
        condition.value
      )

    case "GREATER_THAN":
      return compareNumericValues(
        currentValue,
        condition.value,
        (
          current,
          expected,
        ) => current > expected,
      )

    case "GREATER_THAN_OR_EQUAL":
      return compareNumericValues(
        currentValue,
        condition.value,
        (
          current,
          expected,
        ) =>
          current >= expected,
      )

    case "LESS_THAN":
      return compareNumericValues(
        currentValue,
        condition.value,
        (
          current,
          expected,
        ) => current < expected,
      )

    case "LESS_THAN_OR_EQUAL":
      return compareNumericValues(
        currentValue,
        condition.value,
        (
          current,
          expected,
        ) =>
          current <= expected,
      )

    case "IN":
      return (
        Array.isArray(
          condition.value,
        ) &&
        condition.value.includes(
          currentValue,
        )
      )

    case "NOT_IN":
      return (
        Array.isArray(
          condition.value,
        ) &&
        !condition.value.includes(
          currentValue,
        )
      )

    case "EXISTS":
      return (
        currentValue !==
          undefined &&
        currentValue !==
          null
      )

    case "NOT_EXISTS":
      return (
        currentValue ===
          undefined ||
        currentValue ===
          null
      )

    default: {
      const exhaustiveOperator:
        never =
        condition.operator

      throw new Error(
        `Operador de condição não suportado: "${exhaustiveOperator}".`,
      )
    }
  }
}

function ruleMatchesContext(
  rule:
    WorkflowRule,
  journey:
    CommercialJourney,
  event:
    CommercialEvent,
): boolean {
  if (!rule.isActive) {
    return false
  }

  if (
    rule.workspaceId !== null &&
    rule.workspaceId !==
      journey.workspaceId
  ) {
    return false
  }

  if (
    rule.eventType !==
      event.type
  ) {
    return false
  }

  if (
    rule.sourceStateId !==
      undefined &&
    rule.sourceStateId !==
      journey.currentStateId
  ) {
    return false
  }

  if (
    rule.targetStateId !==
      undefined &&
    event.payload.targetStateId !==
      rule.targetStateId
  ) {
    return false
  }

  const context:
    WorkflowConditionContext = {
      journey,
      event,
    }

  return rule.conditions.every(
    (condition) =>
      evaluateCondition(
        condition,
        context,
      ),
  )
}

function getActionTitle(
  action:
    WorkflowRuleAction,
  rule:
    WorkflowRule,
): string {
  const payloadTitle =
    action.payload.title

  if (
    typeof payloadTitle ===
      "string" &&
    payloadTitle.trim()
  ) {
    return payloadTitle
  }

  switch (action.type) {
    case "CHANGE_STATE":
      return "Alterar estado da jornada"

    case "CREATE_TASK":
      return "Criar tarefa comercial"

    case "ADD_NOTE":
      return "Adicionar observação comercial"

    case "UPDATE_PRIORITY":
      return "Atualizar prioridade da jornada"

    case "UPDATE_SCORE":
      return "Atualizar score da jornada"

    case "ASSIGN_CONSULTANT":
      return "Atribuir consultor à jornada"

    case "SEND_NOTIFICATION":
      return "Enviar notificação comercial"

    case "TRIGGER_AUTOMATION":
      return "Executar automação comercial"

    default: {
      const exhaustiveActionType:
        never =
        action.type

      throw new Error(
        `Tipo de ação de workflow não suportado: "${exhaustiveActionType}".`,
      )
    }
  }
}

function buildCommercialAction(
  action:
    WorkflowRuleAction,
  rule:
    WorkflowRule,
  journey:
    CommercialJourney,
  event:
    CommercialEvent,
  timestamp:
    string,
  generateActionId:
    () => string,
): CommercialAction {
  return {
    id:
      generateActionId(),

    workspaceId:
      journey.workspaceId,

    journeyId:
      journey.id,

    type:
      action.type,

    status:
      "PENDING",

    origin:
      "WORKFLOW_RULE",

    actorType:
      "AUTOMATION",

    actorId:
      null,

    title:
      getActionTitle(
        action,
        rule,
      ),

    description:
      `Ação criada pela regra de workflow "${rule.name}".`,

    payload: {
      ...action.payload,

      workflowRuleId:
        rule.id,

      sourceEventId:
        event.id,
    },

    scheduledFor:
      null,

    startedAt:
      null,

    completedAt:
      null,

    failedAt:
      null,

    failureReason:
      null,

    createdBy:
      null,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  }
}

function validateEventWorkspace(
  input:
    ExecuteWorkflowInput,
): void {
  if (
    input.event.workspaceId !==
      input.workspaceId
  ) {
    throw new Error(
      `O evento comercial "${input.event.id}" pertence a outro workspace.`,
    )
  }
}

function validateJourney(
  journey:
    CommercialJourney | undefined,
  input:
    ExecuteWorkflowInput,
): CommercialJourney {
  if (!journey) {
    throw new Error(
      `Jornada comercial não encontrada para o ID "${input.event.journeyId}".`,
    )
  }

  if (
    journey.workspaceId !==
      input.workspaceId
  ) {
    throw new Error(
      `A jornada comercial "${journey.id}" pertence a outro workspace.`,
    )
  }

  return journey
}

function getOrderedMatchingRules(
  rules:
    WorkflowRule[],
  journey:
    CommercialJourney,
  event:
    CommercialEvent,
): WorkflowRule[] {
  return rules
    .filter(
      (rule) =>
        ruleMatchesContext(
          rule,
          journey,
          event,
        ),
    )
    .sort(
      (
        firstRule,
        secondRule,
      ) =>
        secondRule.priority -
        firstRule.priority,
    )
}

function executeLegacyWorkflow(
  input:
    ExecuteWorkflowInput,
  {
    commercialRepository,
    now = new Date(),
    generateActionId =
      generateDefaultActionId,
  }: WorkflowExecutorLegacyDependencies,
): ExecuteWorkflowResult {
  validateEventWorkspace(
    input,
  )

  const journey =
    validateJourney(
      commercialRepository
        .getJourneyById(
          input.event.journeyId,
        ),
      input,
    )

  const orderedRules =
    getOrderedMatchingRules(
      commercialRepository
        .getWorkflowRules(),
      journey,
      input.event,
    )

  const timestamp =
    now.toISOString()

  const matchedRules:
    WorkflowRuleExecution[] = []

  const createdActions:
    CommercialAction[] = []

  for (
    const rule of
    orderedRules
  ) {
    const ruleActions:
      CommercialAction[] = []

    for (
      const workflowAction of
      rule.actions
    ) {
      const commercialAction =
        buildCommercialAction(
          workflowAction,
          rule,
          journey,
          input.event,
          timestamp,
          generateActionId,
        )

      const persistedAction =
        commercialRepository
          .createAction(
            commercialAction,
          )

      ruleActions.push(
        persistedAction,
      )

      createdActions.push(
        persistedAction,
      )
    }

    matchedRules.push({
      rule,

      actions:
        ruleActions,
    })

    if (
      rule.stopProcessingAfterMatch
    ) {
      break
    }
  }

  return {
    matchedRules,
    createdActions,
  }
}

async function executeAsyncWorkflow(
  input:
    ExecuteWorkflowInput,
  {
    commercialRepository,
    now = new Date(),
    generateActionId =
      generateDefaultActionId,
  }: WorkflowExecutorAsyncDependencies,
): Promise<ExecuteWorkflowResult> {
  validateEventWorkspace(
    input,
  )

  const journey =
    validateJourney(
      await commercialRepository
        .journeys
        .findById(
          input.event.journeyId,
        ),
      input,
    )

  const workflowRules =
    await commercialRepository
      .workflowRules
      .findAll()

  const orderedRules =
    getOrderedMatchingRules(
      workflowRules,
      journey,
      input.event,
    )

  const timestamp =
    now.toISOString()

  const matchedRules:
    WorkflowRuleExecution[] = []

  const createdActions:
    CommercialAction[] = []

  for (
    const rule of
    orderedRules
  ) {
    const ruleActions:
      CommercialAction[] = []

    for (
      const workflowAction of
      rule.actions
    ) {
      const commercialAction =
        buildCommercialAction(
          workflowAction,
          rule,
          journey,
          input.event,
          timestamp,
          generateActionId,
        )

      const persistedAction =
        await commercialRepository
          .actions
          .create(
            commercialAction,
          )

      ruleActions.push(
        persistedAction,
      )

      createdActions.push(
        persistedAction,
      )
    }

    matchedRules.push({
      rule,

      actions:
        ruleActions,
    })

    if (
      rule.stopProcessingAfterMatch
    ) {
      break
    }
  }

  return {
    matchedRules,
    createdActions,
  }
}

export function executeWorkflow(
  input:
    ExecuteWorkflowInput,
  dependencies:
    WorkflowExecutorAsyncDependencies,
): Promise<ExecuteWorkflowResult>

export function executeWorkflow(
  input:
    ExecuteWorkflowInput,
  dependencies:
    WorkflowExecutorLegacyDependencies,
): ExecuteWorkflowResult

export function executeWorkflow(
  input:
    ExecuteWorkflowInput,
  dependencies:
    WorkflowExecutorDependencies,
):
  | ExecuteWorkflowResult
  | Promise<ExecuteWorkflowResult>

export function executeWorkflow(
  input:
    ExecuteWorkflowInput,
  dependencies:
    WorkflowExecutorDependencies,
):
  | ExecuteWorkflowResult
  | Promise<ExecuteWorkflowResult> {
  if (
    isAsyncCommercialRepositories(
      dependencies
        .commercialRepository,
    )
  ) {
    return executeAsyncWorkflow(
      input,
      {
        ...dependencies,

        commercialRepository:
          dependencies
            .commercialRepository,
      },
    )
  }

  return executeLegacyWorkflow(
    input,
    {
      ...dependencies,

      commercialRepository:
        dependencies
          .commercialRepository,
    },
  )
}