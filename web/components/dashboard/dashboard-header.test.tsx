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
  R2Behavior,
} from "@/components/dashboard/3d/r2-behavior"
import type {
  GorilaR2Briefing,
} from "@/types/dashboard"

import {
  DashboardHeader,
} from "./dashboard-header"

vi.mock("@/components/dashboard/r2-pilot-actions", () => ({
  R2PilotActions: () => <div data-testid="pilot-actions" />,
}))

vi.mock("@/components/dashboard/r2-pending-action-controls", () => ({
  R2PendingActionControls: () => <div data-testid="pending-actions" />,
}))

const user = {
  id: "consultant-1",
  name: "Rafael Ramos Barcelos",
  positionTitle: "Consultor Sênior",
}

const briefing: GorilaR2Briefing = {
  greeting: "Boa tarde, Rafael.",
  analysis: "A operação tem uma prioridade comercial aberta.",
  recommendation: "Comece pelo contato com maior potencial.",
  reason: "O lead aguarda o primeiro atendimento.",
  confidence: "high",
  nextAction: {
    title: "Ligar para o lead",
    priority: "high",
  },
  pilotAction: {
    recommendationId: "recommendation-1",
    journeyId: "journey-1",
    journeyTitle: "Consórcio de Ana Martins",
    opportunityHref: "/opportunities/journey-1",
    actionType: "SEND_MESSAGE",
    title: "Fazer primeiro contato",
    description: "Lead novo com intenção de compra registrada.",
    reason: "Maior prioridade da fila.",
    priority: "HIGH",
    confidence: 0.92,
  },
  generatedAt: "2026-08-08T12:00:00.000Z",
}

const contextualBriefing: GorilaR2Briefing = {
  ...briefing,
  pilotAction: undefined,
  actionContext: {
    actionId: "task-1",
    opportunityId: "journey-1",
    personName: "Ana Martins",
    contextLabel: "Aquisição · Lead ativo",
    actionTitle: "Ana Martins está sem próxima ação",
    actionReason: "A oportunidade está ativa sem atividade pendente.",
    whyNow: "Não existe compromisso futuro ou espera explícita válida.",
    lastRelevantInteraction: "Quero entender melhor a parcela.",
    lastInteractionAt: "2026-08-15T12:00:00.000Z",
    r2Recommendation: "Defina o próximo passo e registre o resultado.",
    priority: "HIGH",
    actionType: "R2_REVIEW",
    href: "/opportunities/journey-1#r2-action-controls",
  },
}

describe("DashboardHeader premium R2 hero", () => {
  it("usa o nome real no cumprimento e apresenta a função do R2", () => {
    render(<DashboardHeader user={user} summary="Resumo" />)

    expect(screen.getByText(/(?:Bom dia|Boa tarde|Boa noite), Rafael Ramos Barcelos/i)).toBeInTheDocument()
    expect(screen.getByText(/R2 está monitorando sua operação/i)).toBeInTheDocument()
  })

  it("consome a melhor ação real sem copiar dados da referência", () => {
    render(<DashboardHeader user={user} summary="Resumo" gorilaR2={briefing} workspaceId="workspace-1" />)

    expect(screen.getByRole("heading", { name: "Consórcio de Ana Martins" })).toBeInTheDocument()
    expect(screen.getByText("Fazer primeiro contato")).toBeInTheDocument()
    expect(screen.getByText("Lead novo com intenção de compra registrada.")).toBeInTheDocument()
    expect(screen.queryByText("João Silva")).not.toBeInTheDocument()
  })

  it("mantém os CTAs semânticos conectados à oportunidade", () => {
    render(<DashboardHeader user={user} summary="Resumo" gorilaR2={briefing} workspaceId="workspace-1" />)

    expect(screen.getByRole("link", { name: /Abrir ação/i })).toHaveAttribute("href", "/opportunities/journey-1")
    expect(screen.getByRole("link", { name: /Ver detalhes/i })).toHaveAttribute("href", "/opportunities/journey-1")
    expect(screen.getByTestId("pilot-actions")).toBeInTheDocument()
  })

  it("expõe quem, contexto, motivo, recomendação e interação antes do clique", () => {
    render(<DashboardHeader user={user} summary="Resumo" gorilaR2={contextualBriefing} />)

    expect(screen.getByRole("heading", { name: "Ana Martins está sem próxima ação" })).toBeInTheDocument()
    expect(screen.getByText("Aquisição · Lead ativo")).toBeInTheDocument()
    expect(screen.getByText("A oportunidade está ativa sem atividade pendente.")).toBeInTheDocument()
    expect(screen.getByText("Não existe compromisso futuro ou espera explícita válida.")).toBeInTheDocument()
    expect(screen.getByText("Defina o próximo passo e registre o resultado.")).toBeInTheDocument()
    expect(screen.getByText(/Quero entender melhor a parcela/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Abrir ação" })).toHaveAttribute(
      "href",
      "/opportunities/journey-1#r2-action-controls",
    )
  })

  it("usa fallback operacional legítimo quando não há ação", () => {
    render(<DashboardHeader user={user} summary="Operação estável" />)

    expect(screen.getByRole("heading", { name: "Operação acompanhada pelo R2" })).toBeInTheDocument()
    expect(screen.getByText("Operação estável")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Ver pipeline/i })).toHaveAttribute("href", "#pipeline")
  })

  it.each<[
    R2Behavior["mood"],
    R2Behavior["animation"],
    string,
  ]>([
    ["idle", "breathing", "neutral"],
    ["thinking", "thinking", "working"],
    ["alert", "warning", "alert"],
    ["success", "celebrating", "celebrating"],
  ])("mapeia o estado %s para %s", (mood, animation, expectedState) => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo"
        behavior={{ mood, animation, message: "Estado real" }}
      />,
    )

    expect(screen.getByTestId("r2-visual-state")).toHaveAttribute("data-state", expectedState)
    expect(screen.getByTestId("gorila-r2-static-avatar")).toHaveAttribute("data-r2-state", expectedState)
  })

  it("representa waiting quando existe recomendação aguardando decisão", () => {
    render(<DashboardHeader user={user} summary="Resumo" gorilaR2={briefing} />)
    expect(screen.getByTestId("r2-visual-state")).toHaveAttribute("data-state", "waiting")
  })

  it("renderiza o asset oficial do R2 pelo caminho estável", () => {
    render(<DashboardHeader user={user} summary="Resumo" />)
    expect(screen.getByAltText("GorilaR2 usando o uniforme verde do GorillaOS")).toHaveAttribute(
      "src",
      "/images/r2/gorila-r2-static-oficial.png",
    )
  })
})
