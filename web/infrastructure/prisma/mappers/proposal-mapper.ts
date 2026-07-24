import {
    ProposalStatus as PrismaProposalStatus,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Proposal as PrismaProposal,
    Prisma,
  } from "@/lib/generated/prisma/client"
  
  import type {
    Proposal,
    ProposalStatus,
  } from "@/types/domain"
  
  const proposalStatusToPrisma: Record<
    ProposalStatus,
    PrismaProposalStatus
  > = {
    draft: PrismaProposalStatus.DRAFT,
    sent: PrismaProposalStatus.SENT,
    accepted: PrismaProposalStatus.ACCEPTED,
    rejected: PrismaProposalStatus.REJECTED,
    expired: PrismaProposalStatus.EXPIRED,
  }
  
  const proposalStatusToDomain: Record<
    PrismaProposalStatus,
    ProposalStatus
  > = {
    [PrismaProposalStatus.DRAFT]:
      "draft",
    [PrismaProposalStatus.SENT]:
      "sent",
    [PrismaProposalStatus.ACCEPTED]:
      "accepted",
    [PrismaProposalStatus.REJECTED]:
      "rejected",
    [PrismaProposalStatus.EXPIRED]:
      "expired",
  }
  
  export type ProposalPersistenceInput = {
    workspaceId: string
    proposal: Proposal
  }
  
  export class ProposalMapper {
    static toDomain(
      raw: PrismaProposal,
    ): Proposal {
      return {
        id: raw.id,
        code: raw.code,
        clientId:
          raw.clientId ?? undefined,
        leadId:
          raw.leadId ?? undefined,
        consultantId:
          raw.consultantId,
        consortiumId:
          raw.consortiumId,
        creditValue:
          Number(raw.creditValue),
        installmentValue:
          Number(raw.installmentValue),
        termMonths:
          raw.termMonths,
        administrationFeePercent:
          Number(
            raw.administrationFeePercent,
          ),
        reserveFundPercent:
          Number(raw.reserveFundPercent),
        status:
          proposalStatusToDomain[
            raw.status
          ],
        sentAt:
          raw.sentAt?.toISOString(),
        validUntil:
          raw.validUntil.toISOString(),
        acceptedAt:
          raw.acceptedAt?.toISOString(),
        rejectedAt:
          raw.rejectedAt?.toISOString(),
        rejectionReason:
          raw.rejectionReason ?? undefined,
        notes:
          raw.notes ?? undefined,
        createdAt:
          raw.createdAt.toISOString(),
        updatedAt:
          raw.updatedAt.toISOString(),
      }
    }
  
    static toPersistence({
      workspaceId,
      proposal,
    }: ProposalPersistenceInput): Prisma.ProposalUncheckedCreateInput {
      return {
        id: proposal.id,
        workspaceId,
        code: proposal.code,
        clientId:
          proposal.clientId ?? null,
        leadId:
          proposal.leadId ?? null,
        consultantId:
          proposal.consultantId,
        consortiumId:
          proposal.consortiumId,
        creditValue:
          proposal.creditValue,
        installmentValue:
          proposal.installmentValue,
        termMonths:
          proposal.termMonths,
        administrationFeePercent:
          proposal.administrationFeePercent,
        reserveFundPercent:
          proposal.reserveFundPercent,
        status:
          proposalStatusToPrisma[
            proposal.status
          ],
        sentAt:
          proposal.sentAt
            ? new Date(proposal.sentAt)
            : null,
        validUntil:
          new Date(proposal.validUntil),
        acceptedAt:
          proposal.acceptedAt
            ? new Date(
                proposal.acceptedAt,
              )
            : null,
        rejectedAt:
          proposal.rejectedAt
            ? new Date(
                proposal.rejectedAt,
              )
            : null,
        rejectionReason:
          proposal.rejectionReason ?? null,
        notes:
          proposal.notes ?? null,
        createdAt:
          new Date(proposal.createdAt),
        updatedAt:
          new Date(proposal.updatedAt),
      }
    }
  }