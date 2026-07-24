import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    mockLeads,
  } from "@/data/mock-crm"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    GetLead,
  } from "./get-lead"
  
  describe(
    "GetLead",
    () => {
      it(
        "deve buscar um lead pelo ID",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getLead =
            new GetLead(
              crmRepository,
            )
  
          const lead =
            mockLeads[0]
  
          const result =
            getLead.execute({
              leadId:
                lead.id,
            })
  
          expect(
            result.lead,
          ).toEqual(
            lead,
          )
        },
      )
  
      it(
        "deve remover espaços do ID antes de buscar o lead",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getLead =
            new GetLead(
              crmRepository,
            )
  
          const lead =
            mockLeads[0]
  
          const result =
            getLead.execute({
              leadId:
                `  ${lead.id}  `,
            })
  
          expect(
            result.lead,
          ).toEqual(
            lead,
          )
        },
      )
  
      it(
        "deve rejeitar um ID vazio",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getLead =
            new GetLead(
              crmRepository,
            )
  
          expect(
            () =>
              getLead.execute({
                leadId: "",
              }),
          ).toThrowError(
            "O ID do lead é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um ID contendo somente espaços",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getLead =
            new GetLead(
              crmRepository,
            )
  
          expect(
            () =>
              getLead.execute({
                leadId: "   ",
              }),
          ).toThrowError(
            "O ID do lead é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um lead inexistente",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const getLead =
            new GetLead(
              crmRepository,
            )
  
          expect(
            () =>
              getLead.execute({
                leadId:
                  "lead-inexistente",
              }),
          ).toThrowError(
            'Lead não encontrado para o ID "lead-inexistente".',
          )
        },
      )
    },
  )