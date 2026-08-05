export type {
  Address,
  ConsortiumType,
  EntityId,
  PersonType,
  Timestamps,
} from "./common"

export type { Client, ClientStatus } from "./client"
export type { Consortium, ConsortiumStatus } from "./consortium"

export type {
  Consultant,
  ConsultantRole,
  ConsultantStatus,
} from "./consultant"

export type { Lead, LeadApproachType, LeadSource, LeadStatus } from "./lead"

export type {
  Meeting,
  MeetingOutcome,
  MeetingStatus,
  MeetingType,
} from "./meeting"

export type {
  PipelineStage,
  PipelineStageType,
} from "./pipeline-stage"

export type { Proposal, ProposalStatus } from "./proposal"
export type { PaymentMethod, Sale, SaleStatus } from "./sale"

export type {
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "./task"

export type { CommercialActorType } from "./commercial-actor"

export type {
  CommercialConversationGoal,
  CommercialConversationMemory,
  CommercialConversationStage,
} from "./commercial-conversation-memory"

export type {
  CommercialAction,
  CommercialActionOrigin,
  CommercialActionStatus,
  CommercialActionType,
} from "./commercial-action"

export type {
  CommercialEvent,
  CommercialEventType,
} from "./commercial-event"

export type {
  CommercialJourney,
  CommercialJourneyOutcome,
  CommercialJourneyPriority,
} from "./commercial-journey"

export type { JourneyPhase } from "./journey-phase"
export type { JourneyState } from "./journey-state"

export type {
  NextBestAction,
  NextBestActionPriority,
  NextBestActionSource,
} from "./next-best-action"

export type {
  WorkflowRule,
  WorkflowRuleAction,
  WorkflowRuleActionType,
  WorkflowRuleCondition,
  WorkflowRuleConditionOperator,
} from "./workflow-rule"

/**
 * Estrutura antiga do CRM.
 */
export type CrmDomain = {
  consultants: import("./consultant").Consultant[]
  consortiums: import("./consortium").Consortium[]
  pipelineStages: import("./pipeline-stage").PipelineStage[]
  leads: import("./lead").Lead[]
  clients: import("./client").Client[]
  meetings: import("./meeting").Meeting[]
  tasks: import("./task").Task[]
  proposals: import("./proposal").Proposal[]
  sales: import("./sale").Sale[]
}

/**
 * Novo motor comercial.
 */
export type CommercialDomain = CrmDomain & {
  journeyPhases: import("./journey-phase").JourneyPhase[]
  journeyStates: import("./journey-state").JourneyState[]
  commercialJourneys: import("./commercial-journey").CommercialJourney[]
  commercialEvents: import("./commercial-event").CommercialEvent[]
  workflowRules: import("./workflow-rule").WorkflowRule[]
  commercialActions: import("./commercial-action").CommercialAction[]
  nextBestActions: import("./next-best-action").NextBestAction[]
}