// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  MissionControlOpportunityView,
} from "@/types/dashboard"

import {
  IntelligenceRail,
} from "./intelligence-rail"

vi.mock("@/components/finance/market-pulse", () => ({
  MarketPulse: ({ compact }: { compact?: boolean }) => (
    <div data-compact={compact} data-testid="market-pulse-mock" />
  ),
}))

function opportunity(
  id: string,
  originName: string,
  updatedAt: string,
): MissionControlOpportunityView {
  return {
    id,
    title: `Oportunidade ${originName}`,
    origin: "lead",
    originName,
    consultantName: "Rafael Ramos",
    priority: "NORMAL",
    score: 70,
    phaseName: "Qualificação",
    stateName: "Em andamento",
    consortiumType: "real_estate",
    lastInteractionAt: null,
    updatedAt,
    status: "open",
    outcome: null,
  }
}

describe("IntelligenceRail", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("identifica semanticamente a região de inteligência comercial", () => {
    render(<IntelligenceRail opportunities={[]} criticalCount={0} importantCount={0} monitoringCount={0} />)

    expect(screen.getByRole("complementary", { name: "Inteligência comercial" })).toBeInTheDocument()
  })

  it("usa a variante compacta do Market Pulse na lateral", () => {
    render(<IntelligenceRail opportunities={[]} criticalCount={0} importantCount={0} monitoringCount={0} />)

    expect(screen.getByTestId("market-pulse-mock")).toHaveAttribute("data-compact", "true")
  })

  it("exibe um estado vazio sem fabricar movimentações", () => {
    render(<IntelligenceRail opportunities={[]} criticalCount={0} importantCount={0} monitoringCount={0} />)

    expect(screen.getByText("Nenhuma movimentação recente registrada.")).toBeInTheDocument()
  })

  it("ordena as oportunidades pela atualização mais recente", () => {
    render(
      <IntelligenceRail
        opportunities={[
          opportunity("old", "Contato antigo", "2026-08-08T11:00:00.000Z"),
          opportunity("new", "Contato recente", "2026-08-08T14:00:00.000Z"),
        ]}
        criticalCount={0}
        importantCount={0}
        monitoringCount={0}
      />,
    )

    const links = screen.getAllByRole("link")
    expect(links[0]).toHaveTextContent("Contato recente")
    expect(links[1]).toHaveTextContent("Contato antigo")
  })

  it("limita a atividade recente a quatro oportunidades", () => {
    render(
      <IntelligenceRail
        opportunities={Array.from({ length: 6 }, (_, index) => (
          opportunity(String(index), `Contato ${index}`, `2026-08-08T1${index}:00:00.000Z`)
        ))}
        criticalCount={0}
        importantCount={0}
        monitoringCount={0}
      />,
    )

    expect(screen.getAllByRole("link")).toHaveLength(4)
  })

  it("leva cada atividade para a oportunidade real", () => {
    render(
      <IntelligenceRail
        opportunities={[opportunity("lead/42", "João Silva", "2026-08-08T14:00:00.000Z")]}
        criticalCount={0}
        importantCount={0}
        monitoringCount={0}
      />,
    )

    expect(screen.getByRole("link", { name: /João Silva/i })).toHaveAttribute(
      "href",
      "/opportunities/lead%2F42",
    )
  })

  it("mostra o ritmo apenas com as contagens reais recebidas", () => {
    render(<IntelligenceRail opportunities={[]} criticalCount={2} importantCount={5} monitoringCount={8} />)

    expect(screen.getByText("Críticas").previousElementSibling).toHaveTextContent("2")
    expect(screen.getByText("Importantes").previousElementSibling).toHaveTextContent("5")
    expect(screen.getByText("Monitorar").previousElementSibling).toHaveTextContent("8")
    expect(screen.getByText(/baseada somente nas ações abertas/i)).toBeInTheDocument()
  })
})
