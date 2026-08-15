import type {
    DecisionEngineInput,
    DecisionEngineOutput,
  } from "./types"
  
  import {
    validateCommercialContext,
  } from "./context"
  
  import {
    analyzeJourneyDiagnostics,
  } from "./diagnostics"
  
  import {
    generateRecommendations,
  } from "./recommendation"
  
  import {
    runStrategyEngine,
  } from "./strategy/engine"
  
  import {
    analyzeTimeline,
  } from "./timeline"

  import {
    latestR2CustomerBoundaryFromEvents,
  } from "@/application/r2/boundary"
  
  export function runDecisionEngine(
    input: DecisionEngineInput,
  ): DecisionEngineOutput {
    const diagnostics: string[] = []
    const warnings: string[] = []
  
    const nextBestActions:
      DecisionEngineOutput["nextBestActions"] = []
  
    const {
      context,
      evidenceContext,
      customerBoundaryContext:
        explicitCustomerBoundary,
    } = input
  
    const validation =
      validateCommercialContext({
        context,
      })
  
    if (!validation.isValid) {
      throw new Error(
        [
          "A Decision Engine recebeu um contexto comercial inválido.",
          ...validation.errors.map(
            (issue) =>
              `[${issue.code}] ${issue.message}`,
          ),
        ].join("\n"),
      )
    }
  
    warnings.push(
      ...validation.warnings.map(
        (issue) =>
          `[${issue.code}] ${issue.message}`,
      ),
    )

    const customerBoundaryContext =
      explicitCustomerBoundary ??
      latestR2CustomerBoundaryFromEvents(
        context.events,
      )

    if (customerBoundaryContext?.terminal) {
      diagnostics.push(
        `Customer Boundary ${customerBoundaryContext.state} aplicada antes do planejamento comercial.`,
      )
      warnings.push(
        "[R2_CUSTOMER_BOUNDARY] A conversa atual foi encerrada pelo cliente; NBA, estratégia e automação comercial foram suprimidas.",
      )

      return {
        nextBestActions,
        strategy: null,
        diagnostics,
        warnings,
        evidenceContext,
        customerBoundaryContext,
      }
    }

    if (evidenceContext) {
      diagnostics.push(
        `Contexto de evidência recebido com status ${evidenceContext.status} e resultado ${evidenceContext.outcome}.`,
      )

      warnings.push(
        ...evidenceContext.warnings.map(
          (warning) =>
            `[R2_EVIDENCE] ${warning}`,
        ),
      )

      if (
        evidenceContext.outcome === "BLOCKED" ||
        evidenceContext.humanConfirmationRequired
      ) {
        warnings.push(
          evidenceContext.outcome === "BLOCKED"
            ? "[R2_EVIDENCE_BLOCKED] A evidência atual não autoriza uma recomendação automática."
            : "[R2_HUMAN_CONFIRMATION_REQUIRED] Um conflito sensível precisa ser confirmado antes da recomendação.",
        )

        return {
          nextBestActions,
          strategy: null,
          diagnostics,
          warnings,
          evidenceContext,
        }
      }
    }
  
    const {
      journey,
      events,
      workflowRules,
      now,
    } = context
  
    diagnostics.push(
      `Jornada ${journey.id} analisada com ${events.length} eventos.`,
    )
  
    diagnostics.push(
      `${workflowRules.length} regras de workflow disponíveis para a análise.`,
    )
  
    diagnostics.push(
      `Contexto comercial enriquecido carregado com temperatura ${context.commercialTemperature}.`,
    )
  
    diagnostics.push(
      context.daysSinceLastInteraction === null
        ? "A jornada ainda não possui interação registrada."
        : `Última interação registrada há ${context.daysSinceLastInteraction} dias.`,
    )
  
    if (context.isInactive) {
      warnings.push(
        "A jornada está comercialmente inativa.",
      )
    }
  
    if (context.isHighScore) {
      diagnostics.push(
        "A jornada possui score comercial elevado.",
      )
    }
  
    if (context.isWon) {
      diagnostics.push(
        "A jornada foi encerrada como ganha.",
      )
    }
  
    if (context.isLost) {
      warnings.push(
        "A jornada foi encerrada como perdida.",
      )
    }
  
    const timelineAnalysis = analyzeTimeline({
      lastInteractionAt:
        journey.lastInteractionAt,
      now,
    })
  
    diagnostics.push(
      ...timelineAnalysis.diagnostics,
    )
  
    warnings.push(
      ...timelineAnalysis.warnings,
    )
  
    const journeyDiagnostics =
      analyzeJourneyDiagnostics({
        journey,
      })
  
    diagnostics.push(
      ...journeyDiagnostics.diagnostics,
    )
  
    warnings.push(
      ...journeyDiagnostics.warnings,
    )
  
    const recommendationResult =
      generateRecommendations({
        journey,
        timelineAnalysis,
        journeyDiagnostics,
        workflowRules,
        now,
      })
  
    nextBestActions.push(
      ...recommendationResult.nextBestActions,
    )
  
    diagnostics.push(
      ...recommendationResult.diagnostics,
    )
  
    warnings.push(
      ...recommendationResult.warnings,
    )
  
    const strategyResult =
      runStrategyEngine({
        journey,
        recommendations: nextBestActions,
        now,
      })
  
    diagnostics.push(
      ...strategyResult.diagnostics,
    )
  
    warnings.push(
      ...strategyResult.warnings,
    )
  
    return {
      nextBestActions,
      strategy: strategyResult.strategy,
      diagnostics,
      warnings,
      evidenceContext,
      customerBoundaryContext:
        customerBoundaryContext ?? undefined,
    }
  }
