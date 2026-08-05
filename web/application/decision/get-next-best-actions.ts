import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

import type {
  NextBestAction,
} from "@/types/domain"

export type OperationalNextBestAction = {
  recommendation: NextBestAction

  journeyId: string

  journeyTitle: string

  leadId: string | null

  clientId: string | null

  contactName?: string | null

  approachType?:
    | "new"
    | "reactivation"
    | null
}

type GetNextBestActionsCommonInput = {
  crmRepository?: CrmRepository

  consultantId?: string

  now?: Date

  limit?: number
}

export type GetNextBestActionsLegacyInput =
  GetNextBestActionsCommonInput & {
    commercialRepository:
      CommercialRepository
  }

export type GetNextBestActionsAsyncInput =
  GetNextBestActionsCommonInput & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type GetNextBestActionsInput =
  | GetNextBestActionsLegacyInput
  | GetNextBestActionsAsyncInput

const priorityWeight: Record<
  NextBestAction["priority"],
  number
> = {
  URGENT: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
}

function compareOperationalActions(
  firstAction: OperationalNextBestAction,
  secondAction: OperationalNextBestAction,
): number {
  const priorityDifference =
    priorityWeight[
      secondAction.recommendation.priority
    ] -
    priorityWeight[
      firstAction.recommendation.priority
    ]

  if (priorityDifference !== 0) {
    return priorityDifference
  }

  const confidenceDifference =
    secondAction.recommendation.confidence -
    firstAction.recommendation.confidence

  if (confidenceDifference !== 0) {
    return confidenceDifference
  }

  return (
    new Date(
      firstAction.recommendation.createdAt,
    ).getTime() -
    new Date(
      secondAction.recommendation.createdAt,
    ).getTime()
  )
}

function isOpenNextBestAction(
  recommendation: NextBestAction,
  now: Date,
): boolean {
  if (recommendation.acceptedAt) {
    return false
  }

  if (recommendation.rejectedAt) {
    return false
  }

  if (recommendation.executedActionId) {
    return false
  }

  if (!recommendation.expiresAt) {
    return true
  }

  const expirationTime =
    new Date(
      recommendation.expiresAt,
    ).getTime()

  if (Number.isNaN(expirationTime)) {
    return false
  }

  return expirationTime > now.getTime()
}

function validateLimit(
  limit: number,
): void {
  if (
    !Number.isInteger(limit) ||
    limit < 1
  ) {
    throw new Error(
      `O limite de recomendaÃƒÂ§ÃƒÂµes deve ser um nÃƒÂºmero inteiro maior que zero. Valor recebido: "${limit}".`,
    )
  }
}

function finalizeOperationalActions(
  operationalActions:
    OperationalNextBestAction[],
  now: Date,
  limit: number,
): OperationalNextBestAction[] {
  return operationalActions
    .filter(
      ({ recommendation }) =>
        isOpenNextBestAction(
          recommendation,
          now,
        ),
    )
    .sort(
      compareOperationalActions,
    )
    .slice(
      0,
      limit,
    )
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
    )
  ) {
    return false
  }

  const journeysRepository =
    commercialRepository.journeys

  if (
    typeof journeysRepository !==
      "object" ||
    journeysRepository === null
  ) {
    return false
  }

  if (
    !(
      "findAll" in
      journeysRepository
    )
  ) {
    return false
  }

  if (
    typeof journeysRepository.findAll !==
    "function"
  ) {
    return false
  }

  if (
    !(
      "nextBestActions" in
      commercialRepository
    )
  ) {
    return false
  }

  const nextBestActionsRepository =
    commercialRepository.nextBestActions

  if (
    typeof nextBestActionsRepository !==
      "object" ||
    nextBestActionsRepository === null
  ) {
    return false
  }

  if (
    !(
      "findByJourneyId" in
      nextBestActionsRepository
    )
  ) {
    return false
  }

  return (
    typeof nextBestActionsRepository
      .findByJourneyId ===
    "function"
  )
}

function getLegacyNextBestActions({
  commercialRepository,
  crmRepository,
  consultantId,
  now,
  limit,
}: {
  commercialRepository:
    CommercialRepository


  crmRepository?: CrmRepository

  consultantId?: string

  now: Date

  limit: number
}): OperationalNextBestAction[] {
  const journeys = consultantId
    ? commercialRepository
        .getJourneys()
        .filter(
          (journey) =>
            journey.consultantId ===
            consultantId,
        )
    : commercialRepository.getJourneys()

  const operationalActions =
    journeys.flatMap(
      (
        journey,
      ): OperationalNextBestAction[] => {
        const recommendations =
          commercialRepository
            .getNextBestActionsByJourneyId(
              journey.id,
            )

        return recommendations.map(
          (
            recommendation,
          ): OperationalNextBestAction => ({
            recommendation,

            journeyId:
              journey.id,

            journeyTitle:
              journey.title,

            leadId:
              journey.leadId,

            clientId:
              journey.clientId,

            ...(
              crmRepository
                ? {
                    contactName:
                      journey.leadId
                        ? crmRepository
                            .getLeadById(
                              journey.leadId,
                            )
                            ?.name ?? null
                        : journey.clientId
                          ? crmRepository
                              .getClientById(
                                journey.clientId,
                              )
                              ?.name ?? null
                          : null,

                    approachType:
                      journey.leadId
                        ? crmRepository
                            .getLeadById(
                              journey.leadId,
                            )
                            ?.approachType ?? null
                        : null,
                  }
                : {}
            ),
          }),
        )
      },
    )

  return finalizeOperationalActions(
    operationalActions,
    now,
    limit,
  )
}

async function getAsyncNextBestActions({
  commercialRepository,
  crmRepository,
  consultantId,
  now,
  limit,
}: {
  commercialRepository:
    AsyncCommercialRepositories


  crmRepository?: CrmRepository

  consultantId?: string

  now: Date

  limit: number
}): Promise<
  OperationalNextBestAction[]
> {
  const journeys = consultantId
    ? await commercialRepository
        .journeys
        .findByConsultantId(
          consultantId,
        )
    : await commercialRepository
        .journeys
        .findAll()

  const journeysById =
    new Map(
      journeys.map(
        (journey) => [
          journey.id,
          journey,
        ] as const,
      ),
    )

  const recommendations =
    await commercialRepository
      .nextBestActions
      .findAll()

  const operationalActions =
    recommendations.flatMap(
      (
        recommendation,
      ): OperationalNextBestAction[] => {
        const journey =
          journeysById.get(
            recommendation.journeyId,
          )

        if (!journey) {
          return []
        }

        return [
          {
            recommendation,

            journeyId:
              journey.id,

            journeyTitle:
              journey.title,

            leadId:
              journey.leadId,

            clientId:
              journey.clientId,

            ...(
              crmRepository
                ? {
                    contactName:
                      journey.leadId
                        ? crmRepository
                            .getLeadById(
                              journey.leadId,
                            )
                            ?.name ?? null
                        : journey.clientId
                          ? crmRepository
                              .getClientById(
                                journey.clientId,
                              )
                              ?.name ?? null
                          : null,

                    approachType:
                      journey.leadId
                        ? crmRepository
                            .getLeadById(
                              journey.leadId,
                            )
                            ?.approachType ?? null
                        : null,
                  }
                : {}
            ),
          },
        ]
      },
    )

  return finalizeOperationalActions(
    operationalActions,
    now,
    limit,
  )
}

export function getNextBestActions(
  input: GetNextBestActionsLegacyInput,
): OperationalNextBestAction[]

export function getNextBestActions(
  input: GetNextBestActionsAsyncInput,
): Promise<
  OperationalNextBestAction[]
>

export function getNextBestActions({
  commercialRepository,
  crmRepository,
  consultantId,
  now = new Date(),
  limit = 10,
}: GetNextBestActionsInput):
  | OperationalNextBestAction[]
  | Promise<
      OperationalNextBestAction[]
    > {
  validateLimit(limit)

  if (
    isAsyncCommercialRepositories(
      commercialRepository,
    )
  ) {
    return getAsyncNextBestActions({
      commercialRepository,
      crmRepository,
      consultantId,
      now,
      limit,
    })
  }

  return getLegacyNextBestActions({
    commercialRepository,
    crmRepository,
    consultantId,
    now,
    limit,
  })
}