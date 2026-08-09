import "dotenv/config"

import {
  Prisma,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"
import {
  readStagingBootstrapConfiguration,
  stagingJourneyPhases,
  stagingJourneyStates,
  stagingPipelineStages,
} from "./staging-bootstrap-data"

async function bootstrapStaging() {
  const configuration =
    readStagingBootstrapConfiguration()

  return prisma.$transaction(
    async (transaction) => {
      const workspace =
        await transaction.workspace.upsert({
          where: {
            slug: configuration.workspaceSlug,
          },
          update: {},
          create: {
            name: "GorillaOS STAGING - QA",
            slug: configuration.workspaceSlug,
            status: "ACTIVE",
          },
        })

      await transaction.consultant.upsert({
        where: {
          workspaceId_email: {
            workspaceId: workspace.id,
            email:
              configuration.consultantEmail,
          },
        },
        update: {
          name: "Rafael Barcelos",
          phone: "",
          team: "",
          region: "",
        },
        create: {
          workspaceId: workspace.id,
          name: "Rafael Barcelos",
          email:
            configuration.consultantEmail,
          phone: "",
          document:
            "STAGING-SEM-DOCUMENTO",
          role: "CONSULTANT",
          team: "",
          region: "",
          status: "ACTIVE",
          monthlySalesTarget:
            new Prisma.Decimal(0),
          monthlyLeadsTarget: 0,
        },
      })

      await transaction.consortium.upsert({
        where: {
          workspaceId_administrator_groupNumber: {
            workspaceId: workspace.id,
            administrator:
              "STAGING TESTE",
            groupNumber: "STAGING-QA",
          },
        },
        update: {},
        create: {
          workspaceId: workspace.id,
          name:
            "STAGING TESTE - Produto QA (NÃO OFERTAR)",
          administrator:
            "STAGING TESTE",
          type: "OTHER",
          groupNumber: "STAGING-QA",
          minCreditValue:
            new Prisma.Decimal(1),
          maxCreditValue:
            new Prisma.Decimal(1_000_000),
          defaultTermMonths: 120,
          administrationFeePercent:
            new Prisma.Decimal(0),
          reserveFundPercent:
            new Prisma.Decimal(0),
          totalQuotas: 999,
          availableQuotas: 999,
          status: "ACTIVE",
          description:
            "Massa estrutural exclusiva de staging; não representa oferta comercial.",
        },
      })

      for (
        const stage of stagingPipelineStages
      ) {
        await transaction.pipelineStage.upsert({
          where: {
            workspaceId_type_order: {
              workspaceId: workspace.id,
              type: stage.type,
              order: stage.order,
            },
          },
          update: {},
          create: {
            workspaceId: workspace.id,
            ...stage,
            winProbability:
              new Prisma.Decimal(
                stage.winProbability,
              ),
          },
        })
      }

      const phaseIds = new Map<
        string,
        string
      >()

      for (
        const phase of stagingJourneyPhases
      ) {
        const persistedPhase =
          await transaction.journeyPhase.upsert({
            where: {
              workspaceId_code: {
                workspaceId: workspace.id,
                code: phase.code,
              },
            },
            update: {},
            create: {
              workspaceId: workspace.id,
              ...phase,
              isActive: true,
            },
          })

        phaseIds.set(
          phase.code,
          persistedPhase.id,
        )
      }

      for (
        const state of stagingJourneyStates
      ) {
        const phaseId = phaseIds.get(
          state.phaseCode,
        )

        if (!phaseId) {
          throw new Error(
            "A configuração de estados referencia uma fase ausente.",
          )
        }

        await transaction.journeyState.upsert({
          where: {
            workspaceId_code: {
              workspaceId: workspace.id,
              code: state.code,
            },
          },
          update: {},
          create: {
            workspaceId: workspace.id,
            phaseId,
            code: state.code,
            name: state.name,
            order: state.order,
            color: state.color,
            icon: state.icon,
            isInitial:
              "isInitial" in state &&
              state.isInitial,
            isFinal:
              "isFinal" in state &&
              state.isFinal,
            isWon:
              "isWon" in state &&
              state.isWon,
            isLost:
              "isLost" in state &&
              state.isLost,
            allowReopen:
              "allowReopen" in state &&
              state.allowReopen,
            isActive: true,
          },
        })
      }

      const [
        consultants,
        consortiums,
        persistedPipelineStages,
        journeyPhases,
        journeyStates,
        initialStates,
        wonStates,
        lostStates,
      ] = await Promise.all([
        transaction.consultant.count({
          where: {
            workspaceId: workspace.id,
            email:
              configuration.consultantEmail,
            status: "ACTIVE",
          },
        }),
        transaction.consortium.count({
          where: {
            workspaceId: workspace.id,
            administrator:
              "STAGING TESTE",
            groupNumber: "STAGING-QA",
            status: "ACTIVE",
          },
        }),
        transaction.pipelineStage.findMany({
          where: {
            workspaceId: workspace.id,
          },
          select: {
            order: true,
            type: true,
            isClosedStage: true,
            isWonStage: true,
          },
        }),
        transaction.journeyPhase.count({
          where: {
            workspaceId: workspace.id,
          },
        }),
        transaction.journeyState.count({
          where: {
            workspaceId: workspace.id,
          },
        }),
        transaction.journeyState.count({
          where: {
            workspaceId: workspace.id,
            isInitial: true,
            isActive: true,
          },
        }),
        transaction.journeyState.count({
          where: {
            workspaceId: workspace.id,
            isFinal: true,
            isWon: true,
            isActive: true,
          },
        }),
        transaction.journeyState.count({
          where: {
            workspaceId: workspace.id,
            isFinal: true,
            isLost: true,
            isActive: true,
          },
        }),
      ])

      const pipelineMatches =
        persistedPipelineStages.length ===
          stagingPipelineStages.length &&
        stagingPipelineStages.every(
          (expected) =>
            persistedPipelineStages.some(
              (persisted) =>
                persisted.order === expected.order &&
                persisted.type === expected.type &&
                persisted.isClosedStage ===
                  expected.isClosedStage &&
                persisted.isWonStage ===
                  expected.isWonStage,
            ),
        )

      if (
        workspace.status !== "ACTIVE" ||
        consultants !== 1 ||
        consortiums !== 1 ||
        !pipelineMatches ||
        journeyPhases <
          stagingJourneyPhases.length ||
        journeyStates <
          stagingJourneyStates.length ||
        initialStates !== 1 ||
        wonStates !== 1 ||
        lostStates !== 1
      ) {
        throw new Error(
          "A fundação de staging ficou ambígua ou incompleta.",
        )
      }

      return {
        consultants,
        consortiums,
        pipelineStages:
          persistedPipelineStages.length,
        journeyPhases,
        journeyStates,
      }
    },
  )
}

async function main() {
  try {
    const result = await bootstrapStaging()

    console.info("STAGING_BOOTSTRAP=APROVADO")
    console.info(
      `STRUCTURAL_COUNTS=${JSON.stringify(result)}`,
    )
  } catch (error) {
    console.error("STAGING_BOOTSTRAP=REPROVADO")
    console.error(
      `ERROR_TYPE=${
        error instanceof Error
          ? error.name
          : "UnknownError"
      }`,
    )
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void main()
