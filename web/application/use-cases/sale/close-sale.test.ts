import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest"
  
  import type {
    ExecuteCommercialEventUseCaseResult,
  } from "@/application/use-cases/common/commercial-event-use-case"
  
  import {
    executeCommercialEventUseCase,
  } from "@/application/use-cases/common/commercial-event-use-case"
  
  import {
    closeSale as closeSaleDomain,
  } from "@/application/sale/close-sale"
  
  import {
    closeSale,
  } from "@/application/use-cases/sale/close-sale"
  
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
    CommercialActorType,
    Sale,
  } from "@/types/domain"
  
  vi.mock(
    "@/application/sale/close-sale",
    () => ({
      closeSale:
        vi.fn(),
    }),
  )
  
  vi.mock(
    "@/application/use-cases/common/commercial-event-use-case",
    () => ({
      executeCommercialEventUseCase:
        vi.fn(),
    }),
  )
  
  describe(
    "closeSale use case",
    () => {
      const saleDate =
        new Date(
          "2026-07-23T18:00:00.000Z",
        )
  
      const firstInstallmentDate =
        "2026-08-10"
  
      const journey = {
        id:
          "journey-1",
  
        workspaceId:
          "workspace-1",
  
        version:
          3,
      }
  
      const wonState = {
        id:
          "state-won",
  
        code:
          "WON",
  
        isWon:
          true,
  
        isFinal:
          true,
  
        isActive:
          true,
      }
  
      const sale = {
        id:
          "sale-1",
  
        workspaceId:
          "workspace-1",
  
        proposalId:
          "proposal-1",
  
        journeyId:
          "journey-1",
  
        clientId:
          "client-1",
  
        consultantId:
          "consultant-1",
  
        consortiumId:
          "consortium-1",
  
        contractNumber:
          "contract-1",
  
        groupNumber:
          "group-1",
  
        quotaNumber:
          101,
  
        creditValue:
          500_000,
  
        installmentValue:
          1_500,
  
        commissionValue:
          10_000,
  
        commissionPercent:
          2,
  
        paymentMethod:
          "bank_slip",
  
        status:
          "active",
  
        saleDate,
  
        firstInstallmentDate:
          new Date(
            "2026-08-10T00:00:00.000Z",
          ),
  
        createdAt:
          saleDate,
  
        updatedAt:
          saleDate,
      } as unknown as Sale
  
      let commercialRepository:
        CommercialRepository
  
      let crmRepository:
        CrmRepository
  
      let decisionAutomationRepository:
        DecisionAutomationRepository
  
      beforeEach(
        () => {
          vi.clearAllMocks()
  
          commercialRepository = {
            getJourneyById:
              vi.fn(
                () =>
                  journey,
              ),
  
            getStates:
              vi.fn(
                () => [
                  wonState,
                ],
              ),
          } as unknown as CommercialRepository
  
          crmRepository = {
            deleteSale:
              vi.fn(),
          } as unknown as CrmRepository
  
          decisionAutomationRepository =
            {} as DecisionAutomationRepository
  
          vi.mocked(
            closeSaleDomain,
          ).mockReturnValue(
            sale,
          )
  
          vi.mocked(
            executeCommercialEventUseCase,
          ).mockReturnValue(
            {
              event: {
                id:
                  "event-1",
              },
            } as unknown as ExecuteCommercialEventUseCaseResult,
          )
        },
      )
  
      function executeCloseSale() {
        return closeSale({
          commercialRepository,
          crmRepository,
          decisionAutomationRepository,
  
          workspaceId:
            "workspace-1",
  
          journeyId:
            "journey-1",
  
          proposalId:
            "proposal-1",
  
          contractNumber:
            "contract-1",
  
          quotaNumber:
            101,
  
          paymentMethod:
            "bank_slip",
  
          firstInstallmentDate,
  
          commissionPercent:
            2,
  
          status:
            "active",
  
          actorType:
            "SYSTEM" as CommercialActorType,
  
          actorId:
            null,
  
          expectedVersion:
            3,
  
          now:
            saleDate,
  
          generateSaleId:
            () =>
              "sale-1",
  
          generateEventId:
            () =>
              "event-1",
        })
      }
  
      it(
        "deve concluir a venda e manter o registro quando o ciclo comercial for executado com sucesso",
        () => {
          const result =
            executeCloseSale()
  
          expect(
            result.sale,
          ).toBe(
            sale,
          )
  
          expect(
            closeSaleDomain,
          ).toHaveBeenCalledTimes(
            1,
          )
  
          expect(
            executeCommercialEventUseCase,
          ).toHaveBeenCalledTimes(
            1,
          )
  
          expect(
            crmRepository.deleteSale,
          ).not.toHaveBeenCalled()
        },
      )
  
      it(
        "deve remover a venda quando o processamento do evento comercial falhar",
        () => {
          const processingError =
            new Error(
              "Falha ao processar o evento comercial.",
            )
  
          vi.mocked(
            executeCommercialEventUseCase,
          ).mockImplementation(
            () => {
              throw processingError
            },
          )
  
          expect(
            () =>
              executeCloseSale(),
          ).toThrow(
            processingError,
          )
  
          expect(
            crmRepository.deleteSale,
          ).toHaveBeenCalledTimes(
            1,
          )
  
          expect(
            crmRepository.deleteSale,
          ).toHaveBeenCalledWith(
            sale.id,
          )
        },
      )
  
      it(
        "deve propagar o erro original depois de remover a venda",
        () => {
          const originalError =
            new Error(
              "Erro original do Workflow Engine.",
            )
  
          vi.mocked(
            executeCommercialEventUseCase,
          ).mockImplementation(
            () => {
              throw originalError
            },
          )
  
          let capturedError:
            unknown
  
          try {
            executeCloseSale()
          } catch (error) {
            capturedError =
              error
          }
  
          expect(
            capturedError,
          ).toBe(
            originalError,
          )
  
          expect(
            crmRepository.deleteSale,
          ).toHaveBeenCalledWith(
            "sale-1",
          )
        },
      )
  
      it(
        "deve criar a venda sem atualizar diretamente a jornada",
        () => {
          executeCloseSale()
  
          expect(
            closeSaleDomain,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              proposalId:
                "proposal-1",
  
              journeyId:
                "journey-1",
  
              contractNumber:
                "contract-1",
  
              quotaNumber:
                101,
  
              paymentMethod:
                "bank_slip",
  
              firstInstallmentDate,
  
              commissionPercent:
                2,
  
              status:
                "active",
            }),
  
            expect.objectContaining({
              crmRepository,
              commercialRepository,
  
              updateJourney:
                false,
            }),
          )
        },
      )
  
      it(
        "deve registrar o evento de venda concluída direcionado ao estado ganho",
        () => {
          executeCloseSale()
  
          expect(
            executeCommercialEventUseCase,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              workspaceId:
                "workspace-1",
  
              journeyId:
                "journey-1",
  
              eventType:
                "SALE_COMPLETED",
  
              targetStateId:
                "state-won",
  
              payload:
                expect.objectContaining({
                  saleId:
                    "sale-1",
  
                  proposalId:
                    "proposal-1",
  
                  clientId:
                    "client-1",
  
                  consultantId:
                    "consultant-1",
  
                  consortiumId:
                    "consortium-1",
  
                  quotaNumber:
                    101,
  
                  paymentMethod:
                    "bank_slip",
  
                  saleStatus:
                    "active",
                }),
            }),
          )
        },
      )
  
      it(
        "não deve criar a venda quando a versão da jornada estiver desatualizada",
        () => {
          expect(
            () =>
              closeSale({
                commercialRepository,
                crmRepository,
                decisionAutomationRepository,
  
                workspaceId:
                  "workspace-1",
  
                journeyId:
                  "journey-1",
  
                proposalId:
                  "proposal-1",
  
                contractNumber:
                  "contract-1",
  
                quotaNumber:
                  101,
  
                paymentMethod:
                  "bank_slip",
  
                firstInstallmentDate,
  
                commissionPercent:
                  2,
  
                status:
                  "active",
  
                actorType:
                  "SYSTEM" as CommercialActorType,
  
                actorId:
                  null,
  
                expectedVersion:
                  2,
  
                now:
                  saleDate,
              }),
          ).toThrow(
            'A jornada comercial "journey-1" foi modificada por outro processo. Versão esperada: 2. Versão atual: 3.',
          )
  
          expect(
            closeSaleDomain,
          ).not.toHaveBeenCalled()
  
          expect(
            executeCommercialEventUseCase,
          ).not.toHaveBeenCalled()
  
          expect(
            crmRepository.deleteSale,
          ).not.toHaveBeenCalled()
        },
      )
    },
  )