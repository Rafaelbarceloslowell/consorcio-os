"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  CommercialActorType,
  CommercialEventType,
  CommercialJourneyPriority,
  LeadApproachType,
  PipelineStageType,
  Prisma,
} from "@/lib/generated/prisma/client"

import { ensureOpportunityExecutionState } from "@/application/execution/r2-execution-service"
import { isDataCrazyLead } from "@/application/lead/data-crazy-import"
import { prisma } from "@/infrastructure/prisma/client"
import { getAuthenticatedCommercialContext } from "@/lib/auth/get-authenticated-commercial-context"

function parseApproachType(value: FormDataEntryValue | null): LeadApproachType {
  if (value === "NEW") return LeadApproachType.NEW
  if (value === "REACTIVATION") return LeadApproachType.REACTIVATION
  throw new Error("Selecione Novo ou Reativação para iniciar o atendimento.")
}

export async function triageDataCrazyLeadAction(
  leadId: string,
  formData: FormData,
): Promise<void> {
  const normalizedLeadId = leadId.trim()
  if (!normalizedLeadId) throw new Error("Lead inválido para triagem.")

  const approachType = parseApproachType(formData.get("approachType"))
  const context = await getAuthenticatedCommercialContext()

  const journeyId = await prisma.$transaction(async (transaction) => {
    const lead = await transaction.lead.findFirst({
      where: {
        id: normalizedLeadId,
        workspaceId: context.workspaceId,
        consultantId: context.consultantId,
        convertedClientId: null,
      },
      select: {
        id: true,
        name: true,
        notes: true,
        approachType: true,
        consortiumType: true,
        pipelineStage: { select: { name: true } },
        commercialJourneys: {
          where: { closedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    })

    if (!lead || !isDataCrazyLead(lead.notes, lead.pipelineStage.name)) {
      throw new Error("Lead Data Crazy não encontrado no escopo autenticado.")
    }

    const existingJourney = lead.commercialJourneys[0]
    if (existingJourney) {
      if (lead.approachType === approachType) return existingJourney.id
      throw new Error("Este lead já possui atendimento iniciado com outra classificação.")
    }

    if (lead.approachType && lead.approachType !== approachType) {
      throw new Error("Este lead já foi classificado anteriormente.")
    }

    const [initialState, activeStage] = await Promise.all([
      transaction.journeyState.findFirst({
        where: {
          workspaceId: context.workspaceId,
          isInitial: true,
          isActive: true,
          isFinal: false,
        },
        orderBy: { order: "asc" },
        select: { id: true, phaseId: true },
      }),
      transaction.pipelineStage.findFirst({
        where: {
          workspaceId: context.workspaceId,
          type: PipelineStageType.LEAD,
          isClosedStage: false,
          name: { not: "Backlog Data Crazy" },
        },
        orderBy: { order: "asc" },
        select: { id: true },
      }),
    ])

    if (!initialState || !activeStage) {
      throw new Error("A fundação comercial do workspace está incompleta.")
    }

    const now = new Date()
    const updated = await transaction.lead.updateMany({
      where: {
        id: lead.id,
        workspaceId: context.workspaceId,
        consultantId: context.consultantId,
        approachType: null,
      },
      data: {
        approachType,
        pipelineStageId: activeStage.id,
      },
    })

    if (updated.count !== 1) {
      throw new Error("A classificação mudou durante a triagem; recarregue a página.")
    }

    const journey = await transaction.commercialJourney.create({
      data: {
        workspaceId: context.workspaceId,
        leadId: lead.id,
        clientId: null,
        consultantId: context.consultantId,
        title: `Oportunidade - ${lead.name}`,
        consortiumType: lead.consortiumType,
        currentPhaseId: initialState.phaseId,
        currentStateId: initialState.id,
        priority: CommercialJourneyPriority.NORMAL,
        score: 0,
        outcome: null,
        stateEnteredAt: now,
        lastInteractionAt: null,
        closedAt: null,
        version: 1,
      },
      select: { id: true },
    })

    await transaction.commercialEvent.createMany({
      data: [
        {
          workspaceId: context.workspaceId,
          journeyId: journey.id,
          type: CommercialEventType.LEAD_CREATED,
          actorType: CommercialActorType.CONSULTANT,
          actorId: context.consultantId,
          payload: {
            category: "data_crazy_triage",
            leadId: lead.id,
            approachType,
            importedLead: true,
          },
          occurredAt: now,
        },
        {
          workspaceId: context.workspaceId,
          journeyId: journey.id,
          type: CommercialEventType.OPPORTUNITY_CREATED,
          actorType: CommercialActorType.CONSULTANT,
          actorId: context.consultantId,
          payload: {
            category: "data_crazy_triage",
            leadId: lead.id,
            journeyId: journey.id,
            approachType,
          },
          occurredAt: now,
        },
      ],
    })

    return journey.id
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })

  await ensureOpportunityExecutionState({
    workspaceId: context.workspaceId,
    opportunityId: journeyId,
  })

  revalidatePath("/")
  revalidatePath("/leads")
  revalidatePath(`/opportunities/${encodeURIComponent(journeyId)}`)
  redirect(`/opportunities/${encodeURIComponent(journeyId)}`)
}
