// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  SettingsPanel,
} from "./settings-panel"

const action =
  vi.fn(async () => {})

describe(
  "SettingsPanel",
  () => {
    it(
      "renderiza identidade real, reporte direto e separação de leads",
      () => {
        render(
          <SettingsPanel
            view={{
              workspace: {
                id: "workspace-1",
                name:
                  "Seal’s Consultoria",
                slug:
                  "consorcio-os",
                statusLabel:
                  "Ativo",
              },
              currentConsultant: {
                id: "consultant-1",
                name:
                  "Rafael Ramos Barcelos",
                email:
                  "rafaelbconsorcio@gmail.com",
                phone: "",
                accessRoleLabel:
                  "Consultor",
                positionTitle:
                  "Consultor",
                team: "",
                teamLabel:
                  "Não informado",
                reportingLineLabel:
                  "Não informado",
                region: "",
                regionLabel:
                  "Não informado",
                statusLabel:
                  "Ativo",
                monthlySalesTargetInput:
                  "10000000.00",
                monthlySalesTargetLabel:
                  "R$ 10.000.000,00",
                monthlyLeadsTarget:
                  0,
              },
              users: [
                {
                  id:
                    "consultant-1",
                  name:
                    "Rafael Ramos Barcelos",
                  email:
                    "rafaelbconsorcio@gmail.com",
                  phone: "",
                  accessRoleLabel:
                    "Consultor",
                  positionTitle:
                    "Consultor",
                  team: "",
                  teamLabel:
                    "Não informado",
                  reportingLineLabel:
                    "Não informado",
                  region: "",
                  regionLabel:
                    "Não informado",
                  statusLabel:
                    "Ativo",
                  monthlySalesTargetInput:
                    "10000000.00",
                  monthlySalesTargetLabel:
                    "R$ 10.000.000,00",
                  monthlyLeadsTarget:
                    0,
                },
              ],
              leadOperation: {
                companyDailyNewLeads:
                  40,
                personalTargetModeLabel:
                  "Calculada pela distribuição real",
                legacyLeadTreatmentLabel:
                  "Reativados",
                newLeadDefinition:
                  "Pessoa que entrou agora na base.",
                reactivatedLeadDefinition:
                  "Pessoa antiga que voltou a ser trabalhada.",
              },
              integrations: [
                {
                  id: "maestro",
                  name: "Maestro",
                  status:
                    "NOT_CONFIGURED",
                  statusLabel:
                    "Não configurado",
                  description:
                    "Aguardando credenciais.",
                },
                {
                  id:
                    "whatsapp",
                  name:
                    "WhatsApp",
                  status:
                    "NOT_CONFIGURED",
                  statusLabel:
                    "Não configurado",
                  description:
                    "Aguardando credenciais.",
                },
              ],
            }}
            updateWorkspaceAction={
              action
            }
            updateProfileAction={
              action
            }
            updateGoalsAction={
              action
            }
          />,
        )

        expect(
          screen.getByDisplayValue(
            "Seal’s Consultoria",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByDisplayValue(
            "rafaelbconsorcio@gmail.com",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getAllByText(
            "Consultor",
          ).length,
        ).toBeGreaterThan(0)
        expect(
          screen.getAllByText(
            "Não informado",
          ).length,
        ).toBeGreaterThan(0)
        expect(
          screen.getByRole(
            "textbox",
            { name: "Telefone" },
          ),
        ).toHaveValue("")
        expect(
          screen.getByText(
            "40 novos leads por dia",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "Reativados",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            "1 usuário cadastrado na empresa",
          ),
        ).toBeInTheDocument()
      },
    )
  },
)
