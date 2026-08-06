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

import type {
  LeadUpdateFormView,
} from "@/types/lead-update"

import {
  LeadUpdateForm,
} from "./lead-update-form"

const lead: LeadUpdateFormView = {
  id: "lead-1",
  name: "alex silva",
  email: "alex@example.com",
  phoneCountryCode: "55",
  phone: "41999999999",
  document: "12345678901",
  companyName: "",
  source: "referral",
  consortiumType: "real_estate",
  desiredCreditValue: "500000",
  desiredTermMonths: "200",
  consultantId: "consultant-1",
  notes: "Projeto de imóvel",
  returnTo: "/opportunities/journey-1",
  consultants: [
    {
      id: "consultant-1",
      name: "Rafael",
    },
  ],
}

describe("LeadUpdateForm", () => {
  it("carrega os dados reais do lead e preserva o retorno para a oportunidade", () => {
    render(
      <LeadUpdateForm
        lead={lead}
        action={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("heading", {
        name: "Editar lead",
      }),
    ).toBeDefined()
    expect(
      screen.getByLabelText(
        "Nome do lead",
      ).getAttribute("value"),
    ).toBe("alex silva")
    expect(
      screen.getByLabelText(
        "E-mail (opcional)",
      ).getAttribute("value"),
    ).toBe("alex@example.com")
    expect(
      screen.getByRole("link", {
        name: "Cancelar e voltar",
      }).getAttribute("href"),
    ).toBe(
      "/opportunities/journey-1",
    )
    expect(
      document.querySelector(
        'input[name="returnTo"]',
      )?.getAttribute("value"),
    ).toBe(
      "/opportunities/journey-1",
    )
  })

  it("expõe todos os campos comerciais editáveis sem alterar histórico", () => {
    render(
      <LeadUpdateForm
        lead={lead}
        action={vi.fn()}
      />,
    )

    for (const label of [
      "Nome do lead",
      "Empresa (opcional)",
      "E-mail (opcional)",
      "Documento (opcional)",
      "Código do país",
      "Telefone",
      "Origem do lead",
      "Tipo de consórcio",
      "Crédito desejado",
      "Prazo desejado em meses",
      "Consultor responsável",
      "Observações (opcional)",
    ]) {
      expect(
        screen.getByLabelText(label),
      ).toBeDefined()
    }

    expect(
      screen.getByText(
        /histórico da conversa, o aprendizado do R2 e a oportunidade comercial serão preservados/i,
      ),
    ).toBeDefined()
  })
})
