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
  ProposalCreateForm,
} from "./proposal-create-form"

describe("ProposalCreateForm", () => {
  it("apresenta criação vinculada a lead e sem venda", () => {
    render(
      <ProposalCreateForm
        view={{
          leads: [
            {
              id: "lead-1",
              name: "Rosecleia",
              desiredCreditValue:
                "500000",
              desiredTermMonths:
                200,
            },
          ],
          consortiums: [
            {
              id: "consortium-1",
              label:
                "HS · Imóvel · Grupo 100",
              defaultTermMonths:
                200,
              administrationFeePercent:
                "20",
              reserveFundPercent:
                "2",
              minCreditValue:
                "100000",
              maxCreditValue:
                "1000000",
            },
          ],
        }}
        action={vi.fn(
          async () => ({
            status: "idle" as const,
            message: null,
          }),
        )}
      />,
    )

    expect(
      screen.getByRole("heading", {
        name: "Nova proposta",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("Lead"),
    ).toHaveValue("lead-1")
    expect(
      screen.getByText(
        /não cria cliente nem registra venda/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Criar proposta",
      }),
    ).toBeEnabled()
  })

  it("bloqueia quando não há lead ou grupo ativo", () => {
    render(
      <ProposalCreateForm
        view={{
          leads: [],
          consortiums: [],
        }}
        action={vi.fn(
          async () => ({
            status: "idle" as const,
            message: null,
          }),
        )}
      />,
    )

    expect(
      screen.getByRole("status"),
    ).toHaveTextContent(
      "lead ativo e um consórcio ativo",
    )
    expect(
      screen.getByRole("button", {
        name: "Criar proposta",
      }),
    ).toBeDisabled()
  })
})
