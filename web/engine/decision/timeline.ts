const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

export type TimelineAnalysis = {
  daysSinceLastInteraction: number | null

  hasNoInteraction: boolean

  isInactive: boolean

  diagnostics: string[]

  warnings: string[]
}

export type AnalyzeTimelineInput = {
  lastInteractionAt?: string | Date | null

  now: Date

  inactivityThresholdInDays?: number
}

function differenceInDays(from: Date, to: Date): number {
  const differenceInMilliseconds = to.getTime() - from.getTime()

  return Math.floor(
    differenceInMilliseconds / MILLISECONDS_PER_DAY,
  )
}

export function analyzeTimeline(
  input: AnalyzeTimelineInput,
): TimelineAnalysis {
  const {
    lastInteractionAt,
    now,
    inactivityThresholdInDays = 7,
  } = input

  const diagnostics: string[] = []
  const warnings: string[] = []

  if (!lastInteractionAt) {
    warnings.push(
      "A jornada ainda não possui uma interação registrada.",
    )

    return {
      daysSinceLastInteraction: null,
      hasNoInteraction: true,
      isInactive: true,
      diagnostics,
      warnings,
    }
  }

  const interactionDate = new Date(lastInteractionAt)

  if (Number.isNaN(interactionDate.getTime())) {
    warnings.push(
      "A data da última interação é inválida.",
    )

    return {
      daysSinceLastInteraction: null,
      hasNoInteraction: false,
      isInactive: false,
      diagnostics,
      warnings,
    }
  }

  const daysSinceLastInteraction = differenceInDays(
    interactionDate,
    now,
  )

  const isInactive =
    daysSinceLastInteraction >= inactivityThresholdInDays

  diagnostics.push(
    `A última interação ocorreu há ${daysSinceLastInteraction} dias.`,
  )

  if (isInactive) {
    warnings.push(
      `A jornada está há ${daysSinceLastInteraction} dias sem interação.`,
    )
  }

  return {
    daysSinceLastInteraction,
    hasNoInteraction: false,
    isInactive,
    diagnostics,
    warnings,
  }
}