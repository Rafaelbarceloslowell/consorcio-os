import {
    beforeEach,
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    Lead,
  } from "@/types/domain"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    UpdateLead,
  } from "./update-lead"
  
  const updateDate =
    new Date(
      "2026-07-23T16:00:00.000Z",
    )
  
  function createLeadFixture(
    overrides: Partial<Lead> = {},
  ): Lead {
    return {
      id:
        "lead-update-test",
  
      name:
        "Lead Original",
  
      email:
        "lead.original.update@example.com",
  
      phone:
        "(41) 99999-7001",
  
      document:
        "909.090.909-09",
  
      companyName:
        "Empresa Original",
  
      source:
        "website",
  
      status:
        "contacted",
  
      consortiumType:
        "real_estate",
  
      desiredCreditValue:
        500000,
  
      desiredTermMonths:
        200,
  
      consultantId:
        "",
  
      pipelineStageId:
        "pipeline-stage-original",
  
      score:
        45,
  
      notes:
        "Observação original",
  
      lastContactAt:
        "2026-07-20T10:00:00.000Z",
  
      createdAt:
        "2026-01-01T10:00:00.000Z",
  
      updatedAt:
        "2026-01-01T10:00:00.000Z",
  
      ...overrides,
    }
  }
  
  describe(
    "UpdateLead",
    () => {
      let repository:
        MockCrmRepository
  
      let consultantId:
        string
  
      beforeEach(
        () => {
          repository =
            new MockCrmRepository()
  
          const consultant =
            repository
              .getConsultants()
              .at(0)
  
          if (!consultant) {
            throw new Error(
              "O mock precisa possuir pelo menos um consultor.",
            )
          }
  
          consultantId =
            consultant.id
        },
      )
  
      it(
        "deve atualizar os dados editáveis do lead",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          const result =
            new UpdateLead(
              repository,
              {
                now:
                  updateDate,
              },
            ).execute({
              leadId:
                lead.id,
  
              name:
                "  Lead Atualizado  ",
  
              email:
                "  LEAD.ATUALIZADO@example.com  ",
  
              phone:
                "(41) 98888-7766",
  
              document:
                "808.080.808-08",
  
              companyName:
                "  Empresa Atualizada  ",
  
              source:
                "referral",
  
              consortiumType:
                "vehicle",
  
              desiredCreditValue:
                250000,
  
              desiredTermMonths:
                120,
  
              notes:
                "  Lead atualizado  ",
            })
  
          expect(
            result.lead,
          ).toEqual({
            ...lead,
  
            name:
              "Lead Atualizado",
  
            email:
              "lead.atualizado@example.com",
  
            phone:
              "(41) 98888-7766",
  
            document:
              "808.080.808-08",
  
            companyName:
              "Empresa Atualizada",
  
            source:
              "referral",
  
            consortiumType:
              "vehicle",
  
            desiredCreditValue:
              250000,
  
            desiredTermMonths:
              120,
  
            notes:
              "Lead atualizado",
  
            updatedAt:
              updateDate.toISOString(),
          })
        },
      )
  
      it(
        "deve atualizar somente os campos informados",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          const result =
            new UpdateLead(
              repository,
              {
                now:
                  updateDate,
              },
            ).execute({
              leadId:
                lead.id,
  
              name:
                "Lead Parcialmente Atualizado",
            })
  
          expect(
            result.lead.name,
          ).toBe(
            "Lead Parcialmente Atualizado",
          )
  
          expect(
            result.lead.email,
          ).toBe(
            lead.email,
          )
  
          expect(
            result.lead.phone,
          ).toBe(
            lead.phone,
          )
  
          expect(
            result.lead.createdAt,
          ).toBe(
            lead.createdAt,
          )
        },
      )
  
      it(
        "deve remover espaços dos campos textuais",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          const result =
            new UpdateLead(
              repository,
            ).execute({
              leadId:
                `  ${lead.id}  `,
  
              name:
                "  Lead Sem Espaços  ",
  
              document:
                "  123.456.789-00  ",
  
              companyName:
                "  Empresa Teste  ",
  
              notes:
                "  Nova observação  ",
            })
  
          expect(
            result.lead.name,
          ).toBe(
            "Lead Sem Espaços",
          )
  
          expect(
            result.lead.document,
          ).toBe(
            "123.456.789-00",
          )
  
          expect(
            result.lead.companyName,
          ).toBe(
            "Empresa Teste",
          )
  
          expect(
            result.lead.notes,
          ).toBe(
            "Nova observação",
          )
        },
      )
  
      it(
        "deve permitir limpar campos opcionais",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          const result =
            new UpdateLead(
              repository,
            ).execute({
              leadId:
                lead.id,
  
              document:
                "   ",
  
              companyName:
                "   ",
  
              notes:
                "   ",
            })
  
          expect(
            result.lead.document,
          ).toBeUndefined()
  
          expect(
            result.lead.companyName,
          ).toBeUndefined()
  
          expect(
            result.lead.notes,
          ).toBeUndefined()
        },
      )
  
      it(
        "deve permitir manter o próprio e-mail e telefone",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  lead.id,
  
                email:
                  " LEAD.ORIGINAL.UPDATE@example.com ",
  
                phone:
                  "41999997001",
              }),
          ).not.toThrow()
        },
      )
  
      it(
        "deve atualizar o consultor responsável",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          const anotherConsultant =
            repository
              .getConsultants()
              .find(
                (consultant) =>
                  consultant.id !==
                  consultantId,
              )
  
          if (!anotherConsultant) {
            return
          }
  
          const result =
            new UpdateLead(
              repository,
            ).execute({
              leadId:
                lead.id,
  
              consultantId:
                `  ${anotherConsultant.id}  `,
            })
  
          expect(
            result.lead.consultantId,
          ).toBe(
            anotherConsultant.id,
          )
        },
      )
  
      it(
        "deve rejeitar um ID vazio",
        () => {
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  "   ",
              }),
          ).toThrow(
            "O ID do lead é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um lead inexistente",
        () => {
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  "lead-inexistente",
              }),
          ).toThrow(
            'Lead não encontrado para o ID "lead-inexistente".',
          )
        },
      )
  
      it(
        "deve rejeitar um nome vazio",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  lead.id,
  
                name:
                  "   ",
              }),
          ).toThrow(
            "O nome do lead é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um e-mail inválido",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  lead.id,
  
                email:
                  "email-invalido",
              }),
          ).toThrow(
            "O e-mail informado é inválido.",
          )
        },
      )
  
      it(
        "deve rejeitar um telefone vazio",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  lead.id,
  
                phone:
                  "   ",
              }),
          ).toThrow(
            "O telefone do lead é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um consultor inexistente",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  lead.id,
  
                consultantId:
                  "consultant-inexistente",
              }),
          ).toThrow(
            'Consultor não encontrado para o ID "consultant-inexistente".',
          )
        },
      )
  
      it(
        "deve rejeitar um valor de crédito inválido",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  lead.id,
  
                desiredCreditValue:
                  0,
              }),
          ).toThrow(
            "O valor de crédito desejado deve ser maior que zero.",
          )
        },
      )
  
      it(
        "deve rejeitar um prazo inválido",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  lead.id,
  
                desiredTermMonths:
                  12.5,
              }),
          ).toThrow(
            "O prazo desejado deve ser um número inteiro maior que zero.",
          )
        },
      )
  
      it(
        "deve rejeitar um e-mail duplicado de outro lead",
        () => {
          const firstLead =
            createLeadFixture({
              id:
                "lead-first",
  
              consultantId,
            })
  
          const secondLead =
            createLeadFixture({
              id:
                "lead-second",
  
              email:
                "outro.lead.update@example.com",
  
              phone:
                "(41) 99999-7002",
  
              consultantId,
            })
  
          repository.createLead(
            firstLead,
          )
  
          repository.createLead(
            secondLead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  secondLead.id,
  
                email:
                  " LEAD.ORIGINAL.UPDATE@example.com ",
              }),
          ).toThrow(
            'Já existe um lead cadastrado com o e-mail "lead.original.update@example.com".',
          )
        },
      )
  
      it(
        "deve rejeitar um telefone duplicado de outro lead",
        () => {
          const firstLead =
            createLeadFixture({
              id:
                "lead-first",
  
              consultantId,
            })
  
          const secondLead =
            createLeadFixture({
              id:
                "lead-second",
  
              email:
                "outro.lead.update@example.com",
  
              phone:
                "(41) 99999-7002",
  
              consultantId,
            })
  
          repository.createLead(
            firstLead,
          )
  
          repository.createLead(
            secondLead,
          )
  
          expect(
            () =>
              new UpdateLead(
                repository,
              ).execute({
                leadId:
                  secondLead.id,
  
                phone:
                  "41999997001",
              }),
          ).toThrow(
            "Já existe um lead cadastrado com o telefone informado.",
          )
        },
      )
  
      it(
        "deve preservar os campos controlados por outros fluxos",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
  
              status:
                "qualified",
  
              pipelineStageId:
                "pipeline-qualified",
  
              score:
                80,
  
              lostReason:
                "Motivo anterior",
  
              convertedClientId:
                "client-converted",
  
              lastContactAt:
                "2026-07-22T10:00:00.000Z",
  
              createdAt:
                "2025-12-01T10:00:00.000Z",
            })
  
          repository.createLead(
            lead,
          )
  
          const result =
            new UpdateLead(
              repository,
              {
                now:
                  updateDate,
              },
            ).execute({
              leadId:
                lead.id,
  
              notes:
                "Nova observação",
            })
  
          expect(
            result.lead.status,
          ).toBe(
            "qualified",
          )
  
          expect(
            result.lead.pipelineStageId,
          ).toBe(
            "pipeline-qualified",
          )
  
          expect(
            result.lead.score,
          ).toBe(
            80,
          )
  
          expect(
            result.lead.lostReason,
          ).toBe(
            "Motivo anterior",
          )
  
          expect(
            result.lead.convertedClientId,
          ).toBe(
            "client-converted",
          )
  
          expect(
            result.lead.lastContactAt,
          ).toBe(
            "2026-07-22T10:00:00.000Z",
          )
  
          expect(
            result.lead.createdAt,
          ).toBe(
            "2025-12-01T10:00:00.000Z",
          )
        },
      )
  
      it(
        "deve persistir o lead atualizado no repositório",
        () => {
          const lead =
            createLeadFixture({
              consultantId,
            })
  
          repository.createLead(
            lead,
          )
  
          new UpdateLead(
            repository,
            {
              now:
                updateDate,
            },
          ).execute({
            leadId:
              lead.id,
  
            name:
              "Lead Persistido",
          })
  
          const persistedLead =
            repository
              .getLeadById(
                lead.id,
              )
  
          expect(
            persistedLead?.name,
          ).toBe(
            "Lead Persistido",
          )
  
          expect(
            persistedLead?.updatedAt,
          ).toBe(
            updateDate.toISOString(),
          )
        },
      )
    },
  )