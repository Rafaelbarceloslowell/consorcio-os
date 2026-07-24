import type {
  ProcessCommercialTransitionResult,
} from "@/application/commercial/process-commercial-transition"

import type {
  RunCommercialDecisionCycleResult,
} from "@/application/decision/run-commercial-decision-cycle"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

import type {
  DecisionAutomationRepository,
} from "@/repositories/decision/decision-automation-repository"

import type {
  CommercialEvent,
  CommercialJourney,
  Proposal,
} from "@/types/domain"

import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  sendProposal,
} from "./send-proposal"

const NOW =
  new Date(
    "2026-07-22T20:00:00.000Z",
  )

function createJourney(
  overrides:
    Partial<CommercialJourney> = {},
): CommercialJourney {
  return {
    id:
      "journey-test",

    workspaceId:
      "workspace-test",

    leadId:
      "lead-test",

    clientId:
      null,

    consultantId:
      "consultant-test",

    title:
      "Jornada comercial de teste",

    consortiumType:
      "real_estate",

    currentPhaseId:
      "phase-current",

    currentStateId:
      "state-current",

    priority:
      "NORMAL",

    score:
      50,

    outcome:
      null,

    stateEnteredAt:
      "2026-07-20T12:00:00.000Z",

    lastInteractionAt:
      null,

    closedAt:
      null,

    version:
      1,

    createdAt:
      "2026-07-20T12:00:00.000Z",

    updatedAt:
      "2026-07-20T12:00:00.000Z",

    ...overrides,
  }
}

function createProposal(
  overrides:
    Partial<Proposal> = {},
): Proposal {
  return {
    id:
      "proposal-test",

    code:
      "PROP-TEST-001",

    leadId:
      "lead-test",

    consultantId:
      "consultant-test",

    consortiumId:
      "consortium-test",

    creditValue:
      500_000,

    installmentValue:
      3_500,

    termMonths:
      180,

    administrationFeePercent:
      18,

    reserveFundPercent:
      2,

    status:
      "draft",

    validUntil:
      "2026-08-22T23:59:59.000Z",

    createdAt:
      "2026-07-20T12:00:00.000Z",

    updatedAt:
      "2026-07-20T12:00:00.000Z",

    ...overrides,
  }
}

function createEvent(
  journey: CommercialJourney,
): CommercialEvent {
  return {
    id:
      "event-proposal-sent",

    workspaceId:
      journey.workspaceId,

    journeyId:
      journey.id,

    type:
      "PROPOSAL_SENT",

    actorType:
      "CONSULTANT",

    actorId:
      journey.consultantId,

    payload: {
      proposalId:
        "proposal-test",

      sentAt:
        NOW.toISOString(),

      channel:
        "WHATSAPP",
    },

    occurredAt:
      NOW.toISOString(),

    createdAt:
      NOW.toISOString(),

    updatedAt:
      NOW.toISOString(),
  }
}

function createCommercialRepository(
  journeys:
    CommercialJourney[],
): CommercialRepository {
  return {
    getJourneyById:
      vi.fn(
        (
          journeyId: string,
        ) =>
          journeys.find(
            (journey) =>
              journey.id ===
              journeyId,
          ),
      ),
  } as unknown as CommercialRepository
}

function createCrmRepository(
  proposals:
    Proposal[],
): CrmRepository {
  return {
    getProposalById:
      vi.fn(
        (
          proposalId: string,
        ) =>
          proposals.find(
            (proposal) =>
              proposal.id ===
              proposalId,
          ),
      ),

    updateProposal:
      vi.fn(
        (
          proposal: Proposal,
        ) => {
          const proposalIndex =
            proposals.findIndex(
              (currentProposal) =>
                currentProposal.id ===
                proposal.id,
            )

          if (proposalIndex === -1) {
            throw new Error(
              `Proposta não encontrada para o ID "${proposal.id}".`,
            )
          }

          proposals[proposalIndex] =
            proposal

          return proposal
        },
      ),
  } as unknown as CrmRepository
}

function createDecisionCycleResult(
  journey: CommercialJourney,
): RunCommercialDecisionCycleResult {
  return {
    journeyId:
      journey.id,

    workspaceId:
      journey.workspaceId,

    journey,

    diagnostics: [
      "Ciclo comercial executado.",
    ],

    warnings: [],
  } as unknown as RunCommercialDecisionCycleResult
}

function createTransitionResult(
  journey: CommercialJourney,
  decisionCycle:
    RunCommercialDecisionCycleResult,
): ProcessCommercialTransitionResult {
  return {
    journeyId:
      journey.id,

    workspaceId:
      journey.workspaceId,

    changed:
      true,

    committedTransition:
      {} as ProcessCommercialTransitionResult[
        "committedTransition"
      ],

    crmSynchronization:
      null,

    decisionCycle,

    diagnostics: [
      "Transição executada.",
    ],

    warnings: [],

    workflow:
      {} as ProcessCommercialTransitionResult[
        "workflow"
      ],
  }
}

describe(
  "sendProposal",
  () => {
    it(
      "deve atualizar a proposta, registrar o evento e executar o ciclo comercial",
      () => {
        const initialJourney =
          createJourney()

        const journeyAfterEvent =
          createJourney({
            lastInteractionAt:
              NOW.toISOString(),

            version:
              2,

            updatedAt:
              NOW.toISOString(),
          })

        const journeys = [
          initialJourney,
        ]

        const proposals = [
          createProposal(),
        ]

        const commercialRepository =
          createCommercialRepository(
            journeys,
          )

        const crmRepository =
          createCrmRepository(
            proposals,
          )

        const event =
          createEvent(
            initialJourney,
          )

        const decisionCycle =
          createDecisionCycleResult(
            journeyAfterEvent,
          )

        const recordCommercialEvent =
          vi.fn(
            () => {
              journeys[0] =
                journeyAfterEvent

              return event
            },
          )

        const runCommercialDecisionCycle =
          vi.fn(
            () =>
              decisionCycle,
          )

        const processCommercialTransition =
          vi.fn()

        const result =
          sendProposal({
            commercialRepository,
            crmRepository,

            decisionAutomationRepository:
              {} as DecisionAutomationRepository,

            workspaceId:
              initialJourney.workspaceId,

            journeyId:
              initialJourney.id,

            proposalId:
              " proposal-test ",

            actorType:
              "CONSULTANT",

            actorId:
              initialJourney.consultantId,

            payload: {
              channel:
                "WHATSAPP",
            },

            now:
              NOW,

            dependencies: {
              recordCommercialEvent,
              runCommercialDecisionCycle,
              processCommercialTransition,
            },
          })

        expect(
          crmRepository.updateProposal,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id:
              "proposal-test",

            status:
              "sent",

            sentAt:
              NOW.toISOString(),

            updatedAt:
              NOW.toISOString(),
          }),
        )

        expect(
          recordCommercialEvent,
        ).toHaveBeenCalledWith(
          {
            workspaceId:
              initialJourney.workspaceId,

            journeyId:
              initialJourney.id,

            type:
              "PROPOSAL_SENT",

            actorType:
              "CONSULTANT",

            actorId:
              initialJourney.consultantId,

            payload: {
              channel:
                "WHATSAPP",

              proposalId:
                "proposal-test",

              sentAt:
                NOW.toISOString(),
            },
          },
          {
            commercialRepository,

            now:
              NOW,

            generateId:
              undefined,

            touchJourney:
              true,
          },
        )

        expect(
          processCommercialTransition,
        ).not.toHaveBeenCalled()

        expect(
          result.proposal.status,
        ).toBe(
          "sent",
        )

        expect(
          result.proposal.sentAt,
        ).toBe(
          NOW.toISOString(),
        )

        expect(
          proposals[0],
        ).toEqual(
          result.proposal,
        )

        expect(
          result.event,
        ).toEqual(
          event,
        )

        expect(
          result.decisionCycle,
        ).toBe(
          decisionCycle,
        )
      },
    )

    it(
      "deve delegar a mudança de estado ao processador de transição",
      () => {
        const initialJourney =
          createJourney()

        const journeyAfterEvent =
          createJourney({
            lastInteractionAt:
              NOW.toISOString(),

            version:
              2,

            updatedAt:
              NOW.toISOString(),
          })

        const finalJourney =
          createJourney({
            currentPhaseId:
              "phase-proposal",

            currentStateId:
              "state-proposal-sent",

            stateEnteredAt:
              NOW.toISOString(),

            lastInteractionAt:
              NOW.toISOString(),

            version:
              3,

            updatedAt:
              NOW.toISOString(),
          })

        const journeys = [
          initialJourney,
        ]

        const proposals = [
          createProposal(),
        ]

        const commercialRepository =
          createCommercialRepository(
            journeys,
          )

        const crmRepository =
          createCrmRepository(
            proposals,
          )

        const event =
          createEvent(
            initialJourney,
          )

        const decisionCycle =
          createDecisionCycleResult(
            finalJourney,
          )

        const transition =
          createTransitionResult(
            finalJourney,
            decisionCycle,
          )

        const recordCommercialEvent =
          vi.fn(
            () => {
              journeys[0] =
                journeyAfterEvent

              return event
            },
          )

        const processCommercialTransition =
          vi.fn(
            () => {
              journeys[0] =
                finalJourney

              return transition
            },
          )

        const runCommercialDecisionCycle =
          vi.fn()

        const result =
          sendProposal({
            commercialRepository,
            crmRepository,

            decisionAutomationRepository:
              {} as DecisionAutomationRepository,

            workspaceId:
              initialJourney.workspaceId,

            journeyId:
              initialJourney.id,

            proposalId:
              "proposal-test",

            actorType:
              "CONSULTANT",

            actorId:
              initialJourney.consultantId,

            targetStateId:
              "state-proposal-sent",

            expectedVersion:
              1,

            now:
              NOW,

            executionLimit:
              5,

            dependencies: {
              recordCommercialEvent,
              processCommercialTransition,
              runCommercialDecisionCycle,
            },
          })

        expect(
          processCommercialTransition,
        ).toHaveBeenCalledWith({
          commercialRepository,
          crmRepository,

          decisionAutomationRepository:
            expect.any(Object),

          journeyId:
            initialJourney.id,

          targetStateId:
            "state-proposal-sent",

          actorType:
            "CONSULTANT",

          actorId:
            initialJourney.consultantId,

          origin:
            "SYSTEM",

          workspaceId:
            initialJourney.workspaceId,

          eventType:
            "PROPOSAL_SENT",

          payload: {
            proposalId:
              "proposal-test",

            sentAt:
              NOW.toISOString(),

            sourceEventId:
              event.id,
          },

          expectedVersion:
            journeyAfterEvent.version,

          now:
            NOW,

          executionLimit:
            5,
        })

        expect(
          runCommercialDecisionCycle,
        ).not.toHaveBeenCalled()

        expect(
          result.transition,
        ).toBe(
          transition,
        )

        expect(
          result.transitioned,
        ).toBe(
          true,
        )

        expect(
          result.journey,
        ).toEqual(
          finalJourney,
        )
      },
    )

    it(
      "deve rejeitar um ID de proposta vazio",
      () => {
        const journey =
          createJourney()

        const proposals = [
          createProposal(),
        ]

        const crmRepository =
          createCrmRepository(
            proposals,
          )

        expect(() =>
          sendProposal({
            commercialRepository:
              createCommercialRepository([
                journey,
              ]),

            crmRepository,

            decisionAutomationRepository:
              {} as DecisionAutomationRepository,

            workspaceId:
              journey.workspaceId,

            journeyId:
              journey.id,

            proposalId:
              "   ",

            actorType:
              "CONSULTANT",

            actorId:
              journey.consultantId,
          }),
        ).toThrow(
          "O ID da proposta é obrigatório.",
        )

        expect(
          crmRepository.updateProposal,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "deve rejeitar uma proposta inexistente",
      () => {
        const journey =
          createJourney()

        const crmRepository =
          createCrmRepository([])

        expect(() =>
          sendProposal({
            commercialRepository:
              createCommercialRepository([
                journey,
              ]),

            crmRepository,

            decisionAutomationRepository:
              {} as DecisionAutomationRepository,

            workspaceId:
              journey.workspaceId,

            journeyId:
              journey.id,

            proposalId:
              "proposal-inexistente",

            actorType:
              "CONSULTANT",

            actorId:
              journey.consultantId,
          }),
        ).toThrow(
          'Proposta não encontrada para o ID "proposal-inexistente".',
        )

        expect(
          crmRepository.updateProposal,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      "sent",
      "accepted",
      "rejected",
      "expired",
    ] as const)(
      "deve rejeitar uma proposta com status %s",
      (
        status,
      ) => {
        const journey =
          createJourney()

        const proposals = [
          createProposal({
            status,
          }),
        ]

        const crmRepository =
          createCrmRepository(
            proposals,
          )

        expect(() =>
          sendProposal({
            commercialRepository:
              createCommercialRepository([
                journey,
              ]),

            crmRepository,

            decisionAutomationRepository:
              {} as DecisionAutomationRepository,

            workspaceId:
              journey.workspaceId,

            journeyId:
              journey.id,

            proposalId:
              "proposal-test",

            actorType:
              "CONSULTANT",

            actorId:
              journey.consultantId,
          }),
        ).toThrow(
          'A proposta "proposal-test" precisa estar em rascunho antes do envio.',
        )

        expect(
          crmRepository.updateProposal,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "deve restaurar a proposta quando o pipeline comercial falhar",
      () => {
        const journey =
          createJourney()

        const originalProposal =
          createProposal()

        const proposals = [
          originalProposal,
        ]

        const crmRepository =
          createCrmRepository(
            proposals,
          )

        const pipelineError =
          new Error(
            "Falha ao registrar evento.",
          )

        expect(() =>
          sendProposal({
            commercialRepository:
              createCommercialRepository([
                journey,
              ]),

            crmRepository,

            decisionAutomationRepository:
              {} as DecisionAutomationRepository,

            workspaceId:
              journey.workspaceId,

            journeyId:
              journey.id,

            proposalId:
              originalProposal.id,

            actorType:
              "CONSULTANT",

            actorId:
              journey.consultantId,

            now:
              NOW,

            dependencies: {
              recordCommercialEvent:
                vi.fn(
                  () => {
                    throw pipelineError
                  },
                ),
            },
          }),
        ).toThrow(
          pipelineError,
        )

        expect(
          crmRepository.updateProposal,
        ).toHaveBeenCalledTimes(
          2,
        )

        expect(
          proposals[0],
        ).toEqual(
          originalProposal,
        )
      },
    )

    it(
      "deve rejeitar uma data de envio inválida e preservar a proposta",
      () => {
        const journey =
          createJourney()

        const originalProposal =
          createProposal()

        const proposals = [
          originalProposal,
        ]

        const crmRepository =
          createCrmRepository(
            proposals,
          )

        expect(() =>
          sendProposal({
            commercialRepository:
              createCommercialRepository([
                journey,
              ]),

            crmRepository,

            decisionAutomationRepository:
              {} as DecisionAutomationRepository,

            workspaceId:
              journey.workspaceId,

            journeyId:
              journey.id,

            proposalId:
              originalProposal.id,

            actorType:
              "CONSULTANT",

            actorId:
              journey.consultantId,

            now:
              new Date(
                "data-inválida",
              ),
          }),
        ).toThrow(
          "A data de envio da proposta é inválida.",
        )

        expect(
          crmRepository.updateProposal,
        ).not.toHaveBeenCalled()

        expect(
          proposals[0],
        ).toEqual(
          originalProposal,
        )
      },
    )
  },
)
