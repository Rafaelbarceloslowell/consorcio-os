import type { CommercialEvent } from "@/types/domain"

import type { CommercialContext } from "./types"

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

export type CommercialTemperature =
  | "COLD"
  | "WARM"
  | "HOT"

export type EnrichedCommercialContext = CommercialContext & {
  daysSinceLastInteraction: number | null

  hasNoInteraction: boolean

  isInactive: boolean

  hasMeetingScheduled: boolean

  hasProposalSent: boolean

  hasProposalAccepted: boolean

  isClosed: boolean

  isWon: boolean

  isLost: boolean

  isHighScore: boolean

  commercialTemperature: CommercialTemperature
}

export type EnrichCommercialContextInput = {
  context: CommercialContext

  inactivityThresholdInDays?: number

  highScoreThreshold?: number
}

function differenceInDays(from: Date, to: Date): number {
  const differenceInMilliseconds =
    to.getTime() - from.getTime()

  return Math.floor(
    differenceInMilliseconds / MILLISECONDS_PER_DAY,
  )
}

function hasEventType(
  events: CommercialEvent[],
  eventType: CommercialEvent["type"],
): boolean {
  return events.some((event) => event.type === eventType)
}

function calculateCommercialTemperature(
  score: number,
  isInactive: boolean,
  isClosed: boolean,
): CommercialTemperature {
  if (isClosed) {
    return "COLD"
  }

  if (score >= 80 && !isInactive) {
    return "HOT"
  }

  if (score >= 50) {
    return "WARM"
  }

  return "COLD"
}

export function enrichCommercialContext(
  input: EnrichCommercialContextInput,
): EnrichedCommercialContext {
  const {
    context,
    inactivityThresholdInDays = 7,
    highScoreThreshold = 70,
  } = input

  const {
    journey,
    events,
    now,
    state,
  } = context

  const lastInteractionAt = journey.lastInteractionAt

  const hasNoInteraction = !lastInteractionAt

  const daysSinceLastInteraction =
    lastInteractionAt
      ? differenceInDays(
          new Date(lastInteractionAt),
          now,
        )
      : null

  const isInactive =
    daysSinceLastInteraction === null
      ? true
      : daysSinceLastInteraction >=
        inactivityThresholdInDays

  const hasMeetingScheduled = hasEventType(
    events,
    "MEETING_SCHEDULED",
  )

  const hasProposalSent = hasEventType(
    events,
    "PROPOSAL_SENT",
  )

  const hasProposalAccepted = hasEventType(
    events,
    "PROPOSAL_ACCEPTED",
  )

  const isClosed = Boolean(journey.closedAt)

  const isWon = state?.isWon ?? false

  const isLost = state?.isLost ?? false

  const isHighScore =
    journey.score >= highScoreThreshold

  const commercialTemperature =
    calculateCommercialTemperature(
      journey.score,
      isInactive,
      isClosed,
    )

  return {
    ...context,
    daysSinceLastInteraction,
    hasNoInteraction,
    isInactive,
    hasMeetingScheduled,
    hasProposalSent,
    hasProposalAccepted,
    isClosed,
    isWon,
    isLost,
    isHighScore,
    commercialTemperature,
  }
}