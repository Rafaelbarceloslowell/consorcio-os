// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CardContent } from "./card"
import { GlassCard } from "./glass-card"

describe("GlassCard", () => {
  it("deve renderizar o conteúdo", () => {
    render(
      <GlassCard>
        <CardContent>
          Resumo operacional
        </CardContent>
      </GlassCard>
    )

    expect(
      screen.getByText("Resumo operacional")
    ).toBeInTheDocument()
  })

  it("deve aplicar o data-slot do glass card", () => {
    render(
      <GlassCard data-testid="glass-card">
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveAttribute(
      "data-slot",
      "glass-card"
    )
  })

  it("deve habilitar o modo glass do card base", () => {
    render(
      <GlassCard data-testid="glass-card">
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveAttribute(
      "data-glass",
      "true"
    )
  })

  it("deve usar a elevação resting por padrão", () => {
    render(
      <GlassCard data-testid="glass-card">
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveAttribute(
      "data-elevation",
      "resting"
    )
  })

  it("deve aceitar a elevação flat", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        elevation="flat"
      >
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveAttribute(
      "data-elevation",
      "flat"
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "[--card-shadow:none]"
    )
  })

  it("deve aceitar a elevação raised", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        elevation="raised"
      >
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveAttribute(
      "data-elevation",
      "raised"
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "[--card-shadow:var(--glass-card-shadow-raised)]"
    )
  })

  it("deve aceitar a elevação floating", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        elevation="floating"
      >
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveAttribute(
      "data-elevation",
      "floating"
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "[--card-shadow:var(--glass-card-shadow-floating)]"
    )
  })

  it("não deve ser interativo por padrão", () => {
    render(
      <GlassCard data-testid="glass-card">
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).not.toHaveAttribute(
      "data-interactive"
    )

    expect(
      screen.getByTestId("glass-card")
    ).not.toHaveClass(
      "cursor-pointer"
    )
  })

  it("deve aplicar os estados físicos quando interativo", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        interactive
      >
        Conteúdo
      </GlassCard>
    )

    const glassCard =
      screen.getByTestId("glass-card")

    expect(glassCard).toHaveAttribute(
      "data-interactive",
      "true"
    )

    expect(glassCard).toHaveClass(
      "cursor-pointer",
      "hover:-translate-y-1",
      "active:translate-y-0",
      "active:scale-[0.99]",
      "focus-visible:outline-none"
    )
  })

  it("deve aplicar padding compacto ao conteúdo", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        padding="compact"
      >
        <CardContent>
          Conteúdo
        </CardContent>
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "[&>[data-slot=card-content]]:p-4"
    )
  })

  it("deve aplicar padding padrão ao conteúdo", () => {
    render(
      <GlassCard data-testid="glass-card">
        <CardContent>
          Conteúdo
        </CardContent>
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "[&>[data-slot=card-content]]:p-6"
    )
  })

  it("deve aplicar padding espaçoso ao conteúdo", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        padding="spacious"
      >
        <CardContent>
          Conteúdo
        </CardContent>
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "[&>[data-slot=card-content]]:p-8"
    )
  })

  it("deve aceitar classes personalizadas", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        className="custom-glass-card"
      >
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "custom-glass-card"
    )
  })

  it("deve manter as classes padrão ao receber classes personalizadas", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        className="mt-8"
      >
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByTestId("glass-card")
    ).toHaveClass(
      "relative",
      "overflow-hidden",
      "backdrop-blur-xl",
      "mt-8"
    )
  })

  it("deve encaminhar atributos HTML", () => {
    render(
      <GlassCard
        id="operation-summary"
        aria-label="Resumo da operação"
      >
        Conteúdo
      </GlassCard>
    )

    expect(
      screen.getByLabelText(
        "Resumo da operação"
      )
    ).toHaveAttribute(
      "id",
      "operation-summary"
    )
  })

  it("deve expor as variáveis de sombra", () => {
    render(
      <GlassCard data-testid="glass-card">
        Conteúdo
      </GlassCard>
    )

    const glassCard =
      screen.getByTestId("glass-card")

    expect(
      glassCard.style.getPropertyValue(
        "--glass-card-shadow-resting"
      )
    ).not.toBe("")

    expect(
      glassCard.style.getPropertyValue(
        "--glass-card-shadow-hover"
      )
    ).not.toBe("")

    expect(
      glassCard.style.getPropertyValue(
        "--glass-card-shadow-pressed"
      )
    ).not.toBe("")
  })

  it("deve aceitar estilos personalizados sem remover os tokens internos", () => {
    render(
      <GlassCard
        data-testid="glass-card"
        style={{
          minHeight: "200px",
        }}
      >
        Conteúdo
      </GlassCard>
    )

    const glassCard =
      screen.getByTestId("glass-card")

    expect(glassCard).toHaveStyle({
      minHeight: "200px",
    })

    expect(
      glassCard.style.getPropertyValue(
        "--glass-card-shadow-resting"
      )
    ).not.toBe("")
  })
})