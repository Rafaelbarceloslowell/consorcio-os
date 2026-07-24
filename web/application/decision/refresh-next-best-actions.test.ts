import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import { mockCommercialData } from "@/data/mock-commercial"
  
  import {
    MockCommercialRepository,
  } from "@/repositories/commercial/mock-commercial-repository"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import type {
    CommercialJourney,
    NextBestAction,
  } from "@/types/domain"
  
  import {
    runApplicationDecisionEngine,
  } from "./run-decision-engine"
  
  import {
    refreshNextBestActions,
  } from "./refresh-next-best-actions"
  
  vi.mock(
    "./run-decision-engine",
    () => ({
      runApplicationDecisionEngine:
        vi.fn(),
    }),
  )
  
  const NOW = new Date(
    "2026-07-22T15:00:00.000Z",
  )
  
  const mockedRunApplicationDecisionEngine =
    vi.mocked(
      runApplicationDecisionEngine,
    )
  
  function createJourney(
    overrides: Partial<CommercialJourney> = {},
  ): CommercialJourney {
    return {
      id: "journey-test",
      workspaceId: "workspace-test",
      leadId: "lead-1",
      clientId: null,
      consultantId: "consultant-1",
      title: "Jornada comercial de teste",
      consortiumType: "real_estate",
      currentPhaseId: "phase-test",
      currentStateId: "state-test",
      priority: "NORMAL",
      score: 70,
      outcome: null,
      stateEnteredAt:
        "2026-07-20T12:00:00.000Z",
      lastInteractionAt:
        "2026-07-15T12:00:00.000Z",
      closedAt: null,
      version: 1,
      createdAt:
        "2026-07-20T12:00:00.000Z",
      updatedAt:
        "2026-07-20T12:00:00.000Z",
      ...overrides,
    }
  }
  
  function createNextBestAction(
    journey: CommercialJourney,
    overrides: Partial<NextBestAction> = {},
  ): NextBestAction {
    return {
      id: "recommendation-generated",
      workspaceId: journey.workspaceId,
      journeyId: journey.id,
      actionType: "SEND_MESSAGE",
      title: "Retomar contato",
      description:
        "Enviar uma mensagem personalizada ao lead.",
      reason:
        "A jornada está sem interação recente.",
      confidence: 0.9,
      priority: "HIGH",
      source: "RULE_ENGINE",
      expiresAt:
        "2026-07-24T15:00:00.000Z",
      acceptedAt: null,
      rejectedAt: null,
      executedActionId: null,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      ...overrides,
    }
  }
  
  function createCommercialRepository(
    journey: CommercialJourney,
    nextBestActions: NextBestAction[] = [],
  ): MockCommercialRepository {
    return new MockCommercialRepository({
      ...mockCommercialData,
      commercialJourneys: [
        journey,
      ],
      journeyPhases: [],
      journeyStates: [],
      commercialEvents: [],
      commercialActions: [],
      nextBestActions,
      workflowRules: [],
    })
  }
  
  function configureDecisionEngine(
    nextBestActions: NextBestAction[],
    options: {
      diagnostics?: string[]
      warnings?: string[]
    } = {},
  ): void {
    mockedRunApplicationDecisionEngine
      .mockReturnValue({
        nextBestActions,
        strategy: null,
        diagnostics:
          options.diagnostics ?? [],
        warnings:
          options.warnings ?? [],
      })
  }
  
  describe(
    "refreshNextBestActions",
    () => {
      beforeEach(() => {
        mockedRunApplicationDecisionEngine
          .mockReset()
      })
  
      it(
        "deve executar o motor de decisão e persistir as recomendações geradas",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const generatedRecommendation =
            createNextBestAction(
              journey,
            )
  
          configureDecisionEngine(
            [
              generatedRecommendation,
            ],
            {
              diagnostics: [
                "Jornada analisada.",
              ],
              warnings: [
                "Jornada inativa.",
              ],
            },
          )
  
          const result =
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: journey.id,
              workspaceId:
                journey.workspaceId,
              now: NOW,
            })
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).toHaveBeenCalledTimes(1)
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).toHaveBeenCalledWith({
            commercialRepository,
            crmRepository,
            journeyId: journey.id,
            now: NOW,
          })
  
          expect(result).toEqual({
            journeyId: journey.id,
            workspaceId:
              journey.workspaceId,
            generatedNextBestActions: [
              generatedRecommendation,
            ],
            preservedNextBestActions: [],
            removedNextBestActions: [],
            createdNextBestActions: [
              generatedRecommendation,
            ],
            nextBestActions: [
              generatedRecommendation,
            ],
            diagnostics: [
              "Jornada analisada.",
            ],
            warnings: [
              "Jornada inativa.",
            ],
          })
  
          expect(
            commercialRepository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toEqual([
            generatedRecommendation,
          ])
        },
      )
  
      it(
        "deve normalizar espaços no ID da jornada antes da execução",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          configureDecisionEngine([])
  
          const result =
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId:
                `  ${journey.id}  `,
              now: NOW,
            })
  
          expect(result.journeyId).toBe(
            journey.id,
          )
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).toHaveBeenCalledWith({
            commercialRepository,
            crmRepository,
            journeyId: journey.id,
            now: NOW,
          })
        },
      )
  
      it(
        "deve rejeitar um ID de jornada vazio sem executar o motor",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          expect(() =>
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: "   ",
              now: NOW,
            }),
          ).toThrow(
            "O ID da jornada comercial é obrigatório para atualizar as recomendações.",
          )
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma jornada inexistente sem executar o motor",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          expect(() =>
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId:
                "journey-inexistente",
              now: NOW,
            }),
          ).toThrow(
            'Jornada comercial não encontrada para o ID "journey-inexistente".',
          )
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve rejeitar uma jornada de outro workspace sem executar o motor",
        () => {
          const journey =
            createJourney()
  
          const commercialRepository =
            createCommercialRepository(
              journey,
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          expect(() =>
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: journey.id,
              workspaceId:
                "outro-workspace",
              now: NOW,
            }),
          ).toThrow(
            `A jornada comercial "${journey.id}" não pertence ao workspace "outro-workspace".`,
          )
  
          expect(
            mockedRunApplicationDecisionEngine,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve substituir recomendações abertas e preservar recomendações fechadas",
        () => {
          const journey =
            createJourney()
  
          const openRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-open",
                title:
                  "Recomendação aberta antiga",
                createdAt:
                  "2026-07-21T10:00:00.000Z",
                updatedAt:
                  "2026-07-21T10:00:00.000Z",
              },
            )
  
          const acceptedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-accepted",
                title:
                  "Recomendação aceita",
                acceptedAt:
                  "2026-07-21T11:00:00.000Z",
                createdAt:
                  "2026-07-21T10:00:00.000Z",
                updatedAt:
                  "2026-07-21T11:00:00.000Z",
              },
            )
  
          const rejectedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-rejected",
                title:
                  "Recomendação rejeitada",
                rejectedAt:
                  "2026-07-21T11:30:00.000Z",
                createdAt:
                  "2026-07-21T10:00:00.000Z",
                updatedAt:
                  "2026-07-21T11:30:00.000Z",
              },
            )
  
          const executedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-executed",
                title:
                  "Recomendação executada",
                executedActionId:
                  "action-executed",
                createdAt:
                  "2026-07-21T10:00:00.000Z",
                updatedAt:
                  "2026-07-21T12:00:00.000Z",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [
                openRecommendation,
                acceptedRecommendation,
                rejectedRecommendation,
                executedRecommendation,
              ],
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const generatedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-new",
                title:
                  "Nova recomendação",
              },
            )
  
          configureDecisionEngine([
            generatedRecommendation,
          ])
  
          const result =
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: journey.id,
              now: NOW,
            })
  
          expect(
            result.removedNextBestActions,
          ).toEqual([
            openRecommendation,
          ])
  
          expect(
            result.preservedNextBestActions,
          ).toEqual([
            acceptedRecommendation,
            rejectedRecommendation,
            executedRecommendation,
          ])
  
          expect(
            result.createdNextBestActions,
          ).toEqual([
            generatedRecommendation,
          ])
  
          expect(
            result.nextBestActions,
          ).toEqual([
            acceptedRecommendation,
            rejectedRecommendation,
            executedRecommendation,
            generatedRecommendation,
          ])
        },
      )
  
      it(
        "deve remover recomendações abertas quando o motor não gerar novas recomendações",
        () => {
          const journey =
            createJourney()
  
          const openRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-open",
              },
            )
  
          const acceptedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-accepted",
                acceptedAt:
                  "2026-07-21T11:00:00.000Z",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [
                openRecommendation,
                acceptedRecommendation,
              ],
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          configureDecisionEngine([])
  
          const result =
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: journey.id,
              now: NOW,
            })
  
          expect(
            result.generatedNextBestActions,
          ).toEqual([])
  
          expect(
            result.removedNextBestActions,
          ).toEqual([
            openRecommendation,
          ])
  
          expect(
            result.preservedNextBestActions,
          ).toEqual([
            acceptedRecommendation,
          ])
  
          expect(
            result.createdNextBestActions,
          ).toEqual([])
  
          expect(
            result.nextBestActions,
          ).toEqual([
            acceptedRecommendation,
          ])
        },
      )
  
      it(
        "deve rejeitar recomendações geradas para outra jornada sem alterar a persistência",
        () => {
          const journey =
            createJourney()
  
          const existingRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-existing",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [
                existingRecommendation,
              ],
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const invalidRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-invalid",
                journeyId:
                  "outra-jornada",
              },
            )
  
          configureDecisionEngine([
            invalidRecommendation,
          ])
  
          expect(() =>
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: journey.id,
              now: NOW,
            }),
          ).toThrow(
            `A recomendação comercial "${invalidRecommendation.id}" foi gerada para a jornada incorreta "outra-jornada".`,
          )
  
          expect(
            commercialRepository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toEqual([
            existingRecommendation,
          ])
        },
      )
  
      it(
        "deve rejeitar recomendações geradas para outro workspace sem alterar a persistência",
        () => {
          const journey =
            createJourney()
  
          const existingRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-existing",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [
                existingRecommendation,
              ],
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const invalidRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-invalid",
                workspaceId:
                  "outro-workspace",
              },
            )
  
          configureDecisionEngine([
            invalidRecommendation,
          ])
  
          expect(() =>
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: journey.id,
              now: NOW,
            }),
          ).toThrow(
            `A recomendação comercial "${invalidRecommendation.id}" foi gerada para o workspace incorreto "outro-workspace".`,
          )
  
          expect(
            commercialRepository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toEqual([
            existingRecommendation,
          ])
        },
      )
  
      it(
        "deve rejeitar recomendações duplicadas geradas pelo motor sem alterar a persistência",
        () => {
          const journey =
            createJourney()
  
          const existingRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-existing",
              },
            )
  
          const commercialRepository =
            createCommercialRepository(
              journey,
              [
                existingRecommendation,
              ],
            )
  
          const crmRepository =
            new MockCrmRepository()
  
          const duplicatedRecommendation =
            createNextBestAction(
              journey,
              {
                id:
                  "recommendation-duplicated",
              },
            )
  
          configureDecisionEngine([
            duplicatedRecommendation,
            {
              ...duplicatedRecommendation,
            },
          ])
  
          expect(() =>
            refreshNextBestActions({
              commercialRepository,
              crmRepository,
              journeyId: journey.id,
              now: NOW,
            }),
          ).toThrow(
            `O motor de decisão gerou recomendações duplicadas com o ID "${duplicatedRecommendation.id}".`,
          )
  
          expect(
            commercialRepository
              .getNextBestActionsByJourneyId(
                journey.id,
              ),
          ).toEqual([
            existingRecommendation,
          ])
        },
      )
    },
  )