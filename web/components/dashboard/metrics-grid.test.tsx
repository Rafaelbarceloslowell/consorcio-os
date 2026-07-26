// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  DashboardMetrics,
} from "@/types/dashboard"

import {
  MetricsGrid,
} from "./metrics-grid"

const statCardMock = vi.fn()

vi.mock(
  "@/components/dashboard/stat-card",
  () => ({
    StatCard: (props: {
      title: string
      description: string
      value: string
      icon: unknown
      iconClassName: string
      accentClassName: string
    }) => {
      statCardMock(props)

      return (
        <article
          aria-label={props.title}
          data-icon-class={props.iconClassName}
          data-accent-class={props.accentClassName}
        >
          <h3>{props.title}</h3>

          <p>{props.description}</p>

          <span>{props.value}</span>
        </article>
      )
    },
  })
)

const metrics: DashboardMetrics = {
  newLeads: 12,
  meetingsToday: 4,
  monthlySales: 1850000,
  pendingTasks: 7,
}

describe("MetricsGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deve renderizar a seção de visão da operação", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByRole("region", {
        name: "Visão da operação",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar o título principal da seção", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Visão da operação",
      })
    ).toBeInTheDocument()
  })

  it("deve associar corretamente o título à seção", () => {
    const {
      container,
    } = render(
      <MetricsGrid metrics={metrics} />
    )

    const section =
      container.querySelector("section")

    const title =
      screen.getByRole("heading", {
        level: 2,
        name: "Visão da operação",
      })

    expect(section).toHaveAttribute(
      "aria-labelledby",
      "operation-overview-title"
    )

    expect(title).toHaveAttribute(
      "id",
      "operation-overview-title"
    )
  })

  it("deve renderizar o rótulo de desempenho atual", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByText(
        "Desempenho atual"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar a descrição dos indicadores", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByText(
        "Os indicadores que podem exigir uma decisão sua hoje."
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o estado de atualização", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByText(
        "Atualizado agora"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar quatro cartões de métricas", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getAllByRole("article")
    ).toHaveLength(4)
  })

  it("deve renderizar o cartão de novas oportunidades", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByRole("article", {
        name: "Novas oportunidades",
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "Quem entrou hoje e precisa do primeiro contato"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText("12")
    ).toBeInTheDocument()
  })

  it("deve renderizar o cartão de compromissos de hoje", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByRole("article", {
        name: "Compromissos hoje",
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "Conversas que exigem preparação hoje"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText("4")
    ).toBeInTheDocument()
  })

  it("deve renderizar o cartão de produção mensal", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByRole("article", {
        name: "Produção no mês",
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "Quanto a operação já converteu neste mês"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /R\$\s*1\.850\.000/
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar o cartão de ações pendentes", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByRole("article", {
        name: "Ações pendentes",
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "O que ainda bloqueia avanço hoje"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText("7")
    ).toBeInTheDocument()
  })

  it("deve encaminhar as novas oportunidades ao StatCard", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Novas oportunidades",
        description:
          "Quem entrou hoje e precisa do primeiro contato",
        value: "12",
        iconClassName:
          "border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[#43A972]",
        accentClassName:
          "from-[#43A972]/55 via-[#2F8F5B]/15 to-transparent",
      })
    )
  })

  it("deve encaminhar os compromissos ao StatCard", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Compromissos hoje",
        description:
          "Conversas que exigem preparação hoje",
        value: "4",
        iconClassName:
          "border-white/[0.08] bg-white/[0.04] text-[#D6DBE3]",
        accentClassName:
          "from-white/25 via-white/[0.06] to-transparent",
      })
    )
  })

  it("deve encaminhar a produção mensal formatada ao StatCard", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Produção no mês",
        description:
          "Quanto a operação já converteu neste mês",
        value: expect.stringMatching(
          /R\$\s*1\.850\.000/
        ),
        iconClassName:
          "border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[#43A972]",
        accentClassName:
          "from-[#43A972]/55 via-[#2F8F5B]/15 to-transparent",
      })
    )
  })

  it("deve encaminhar as ações pendentes ao StatCard", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Ações pendentes",
        description:
          "O que ainda bloqueia avanço hoje",
        value: "7",
        iconClassName:
          "border-white/[0.08] bg-white/[0.04] text-[#D6DBE3]",
        accentClassName:
          "from-white/25 via-white/[0.06] to-transparent",
      })
    )
  })

  it("deve preservar a ordem comercial das métricas", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    const cards =
      screen.getAllByRole("article")

    expect(cards[0]).toHaveAccessibleName(
      "Novas oportunidades"
    )

    expect(cards[1]).toHaveAccessibleName(
      "Compromissos hoje"
    )

    expect(cards[2]).toHaveAccessibleName(
      "Produção no mês"
    )

    expect(cards[3]).toHaveAccessibleName(
      "Ações pendentes"
    )
  })

  it("deve renderizar corretamente métricas zeradas", () => {
    const zeroMetrics: DashboardMetrics = {
      newLeads: 0,
      meetingsToday: 0,
      monthlySales: 0,
      pendingTasks: 0,
    }

    render(
      <MetricsGrid
        metrics={zeroMetrics}
      />
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Novas oportunidades",
        value: "0",
      })
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Compromissos hoje",
        value: "0",
      })
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Produção no mês",
        value: expect.stringMatching(
          /R\$\s*0/
        ),
      })
    )

    expect(
      statCardMock
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Ações pendentes",
        value: "0",
      })
    )
  })

  it("deve renderizar o grid responsivo das métricas", () => {
    const {
      container,
    } = render(
      <MetricsGrid metrics={metrics} />
    )

    const grid =
      container.querySelector(
        ".grid"
      )

    expect(grid).toHaveClass(
      "grid",
      "gap-4",
      "sm:grid-cols-2",
      "xl:grid-cols-4"
    )
  })

  it("deve aplicar as classes premium ao título", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Visão da operação",
      })
    ).toHaveClass(
      "mt-2",
      "text-xl",
      "font-semibold",
      "tracking-[-0.04em]",
      "text-[#F5F7FA]"
    )
  })

  it("deve aplicar estilo discreto ao indicador de atualização", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    const updateIndicator =
      screen.getByText(
        "Atualizado agora"
      )

    expect(
      updateIndicator
    ).toHaveClass(
      "inline-flex",
      "rounded-full",
      "border",
      "border-white/[0.055]",
      "bg-white/[0.025]",
      "text-[#697384]"
    )
  })

  it("deve chamar o StatCard exatamente quatro vezes", () => {
    render(
      <MetricsGrid metrics={metrics} />
    )

    expect(
      statCardMock
    ).toHaveBeenCalledTimes(4)
  })
})
