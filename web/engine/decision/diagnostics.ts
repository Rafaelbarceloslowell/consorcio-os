import type { CommercialJourney } from "@/types/domain"

const HIGH_SCORE_THRESHOLD = 70

export type JourneyDiagnostics = {
  diagnostics: string[]

  warnings: string[]

  isHighScore: boolean

  isClosed: boolean
}

export type AnalyzeJourneyDiagnosticsInput = {
  journey: CommercialJourney

  highScoreThreshold?: number
}

export function analyzeJourneyDiagnostics(
  input: AnalyzeJourneyDiagnosticsInput,
): JourneyDiagnostics {
  const {
    journey,
    highScoreThreshold = HIGH_SCORE_THRESHOLD,
  } = input

  const diagnostics: string[] = []
  const warnings: string[] = []

  const isHighScore = journey.score >= highScoreThreshold
  const isClosed = Boolean(journey.closedAt)

  if (isHighScore) {
    diagnostics.push(
      `A jornada possui score alto: ${journey.score}.`,
    )
  }

  if (isClosed) {
    diagnostics.push("A jornada já está encerrada.")
  } else {
    diagnostics.push("A jornada está ativa.")
  }

  if (journey.score < 0) {
    warnings.push(
      `A jornada possui score inválido: ${journey.score}.`,
    )
  }

  return {
    diagnostics,
    warnings,
    isHighScore,
    isClosed,
  }
}