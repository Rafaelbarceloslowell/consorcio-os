// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { CircleDollarSign } from "lucide-react"
import { describe, expect, it } from "vitest"

import { StatCard } from "./stat-card"

describe("StatCard", () => {
  it("deve renderizar o título informado", () => {
    render(
      <StatCard
        title="Vendas"
        value="R$ 1.250.000"
        icon={CircleDollarSign}
      />
    )

    expect(screen.getByText("Vendas")).toBeInTheDocument()
  })

  it("deve renderizar o valor informado", () => {
    render(
      <StatCard
        title="Vendas"
        value="R$ 1.250.000"
        icon={CircleDollarSign}
      />
    )

    expect(screen.getByText("R$ 1.250.000")).toBeInTheDocument()
  })

  it("deve renderizar o ícone", () => {
    const { container } = render(
      <StatCard
        title="Vendas"
        value="R$ 1.250.000"
        icon={CircleDollarSign}
      />
    )

    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("deve aplicar as classes padrão do título", () => {
    render(
      <StatCard
        title="Leads"
        value="15"
        icon={CircleDollarSign}
      />
    )

    expect(screen.getByText("Leads")).toHaveClass(
      "text-sm",
      "font-medium",
      "text-muted-foreground"
    )
  })

  it("deve aplicar as classes padrão do valor", () => {
    render(
      <StatCard
        title="Leads"
        value="15"
        icon={CircleDollarSign}
      />
    )

    expect(screen.getByText("15")).toHaveClass(
      "text-2xl",
      "font-bold",
      "tracking-tight"
    )
  })

  it("deve aplicar as classes padrão do container do ícone", () => {
    const { container } = render(
      <StatCard
        title="Leads"
        value="15"
        icon={CircleDollarSign}
      />
    )

    const iconContainer = container.querySelector("svg")?.parentElement

    expect(iconContainer).toHaveClass(
      "flex",
      "size-10",
      "items-center",
      "justify-center",
      "rounded-lg",
      "bg-primary/10",
      "text-primary"
    )
  })

  it("deve aplicar classes personalizadas no ícone", () => {
    const { container } = render(
      <StatCard
        title="Leads"
        value="15"
        icon={CircleDollarSign}
        iconClassName="bg-red-500 text-white"
      />
    )

    const iconContainer = container.querySelector("svg")?.parentElement

    expect(iconContainer).toHaveClass(
      "bg-red-500",
      "text-white"
    )
  })

  it("deve renderizar corretamente valores monetários", () => {
    render(
      <StatCard
        title="Faturamento"
        value="R$ 2.500.000"
        icon={CircleDollarSign}
      />
    )

    expect(
      screen.getByText("R$ 2.500.000")
    ).toBeInTheDocument()
  })

  it("deve renderizar corretamente valores numéricos", () => {
    render(
      <StatCard
        title="Leads"
        value="327"
        icon={CircleDollarSign}
      />
    )

    expect(screen.getByText("327")).toBeInTheDocument()
  })

  it("deve renderizar Card e CardContent corretamente", () => {
    const { container } = render(
      <StatCard
        title="Leads"
        value="327"
        icon={CircleDollarSign}
      />
    )

    expect(
      container.querySelector('[data-slot="card"]')
    ).toBeInTheDocument()

    expect(
      container.querySelector('[data-slot="card-content"]')
    ).toBeInTheDocument()
  })
})