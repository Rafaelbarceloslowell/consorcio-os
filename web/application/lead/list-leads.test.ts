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
    ListLeads,
  } from "./list-leads"
  
  describe(
    "ListLeads",
    () => {
      it(
        "deve listar todos os leads ordenados pelo nome",
        () => {
          const listLeads =
            new ListLeads(
              new MockCrmRepository(),
            )
  
          const result =
            listLeads.execute()
  
          expect(
            result.total,
          ).toBe(
            mockLeads.length,
          )
  
          expect(
            result.leads,
          ).toEqual(
            [...mockLeads].sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name,
                  "pt-BR",
                  {
                    sensitivity:
                      "base",
                  },
                ),
            ),
          )
        },
      )
  
      it(
        "deve filtrar pelo consultor",
        () => {
          const consultantId =
            mockLeads[0].consultantId
  
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              consultantId,
            })
  
          expect(
            result.leads.every(
              (lead) =>
                lead.consultantId ===
                consultantId,
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve remover espaços do ID do consultor",
        () => {
          const consultantId =
            mockLeads[0].consultantId
  
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              consultantId: ` ${consultantId} `,
            })
  
          expect(
            result.leads.every(
              (lead) =>
                lead.consultantId ===
                consultantId,
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve filtrar pelo status",
        () => {
          const status =
            mockLeads[0].status
  
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              status,
            })
  
          expect(
            result.leads.every(
              (lead) =>
                lead.status ===
                status,
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve filtrar pela origem",
        () => {
          const source =
            mockLeads[0].source
  
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              source,
            })
  
          expect(
            result.leads.every(
              (lead) =>
                lead.source ===
                source,
            ),
          ).toBe(true)
        },
      )
  
      it(
        "deve buscar pelo nome ignorando acentos e maiúsculas",
        () => {
          const lead =
            mockLeads[0]
  
          const search =
            lead.name
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                "",
              )
              .toUpperCase()
  
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              search,
            })
  
          expect(
            result.leads,
          ).toContainEqual(
            lead,
          )
        },
      )
  
      it(
        "deve buscar pelo e-mail",
        () => {
          const lead =
            mockLeads[0]
  
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              search:
                lead.email,
            })
  
          expect(
            result.leads,
          ).toContainEqual(
            lead,
          )
        },
      )
  
      it(
        "deve buscar pelo telefone ignorando formatação",
        () => {
          const lead =
            mockLeads[0]
  
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              search:
                lead.phone.replace(
                  /\D/g,
                  "",
                ),
            })
  
          expect(
            result.leads,
          ).toContainEqual(
            lead,
          )
        },
      )
  
      it(
        "deve retornar lista vazia quando nenhum lead corresponder",
        () => {
          const result =
            new ListLeads(
              new MockCrmRepository(),
            ).execute({
              search:
                "lead-inexistente-123",
            })
  
          expect(
            result,
          ).toEqual({
            leads: [],
            total: 0,
          })
        },
      )
  
      it(
        "não deve expor o array interno do repositório",
        () => {
          const listLeads =
            new ListLeads(
              new MockCrmRepository(),
            )
  
          const first =
            listLeads.execute()
  
          first.leads.length = 0
  
          const second =
            listLeads.execute()
  
          expect(
            second.total,
          ).toBe(
            mockLeads.length,
          )
        },
      )
    },
  )