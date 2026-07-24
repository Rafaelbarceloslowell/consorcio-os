// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card"

describe("Card", () => {
  it("deve renderizar a estrutura completa do card", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Resumo comercial</CardTitle>
          <CardDescription>
            Indicadores da operação
          </CardDescription>
        </CardHeader>

        <CardContent>
          R$ 1.000.000 em vendas
        </CardContent>
      </Card>
    )

    expect(screen.getByText("Resumo comercial")).toBeInTheDocument()
    expect(screen.getByText("Indicadores da operação")).toBeInTheDocument()
    expect(screen.getByText("R$ 1.000.000 em vendas")).toBeInTheDocument()
  })

  it("deve aplicar o data-slot no card principal", () => {
    render(<Card data-testid="card">Conteúdo</Card>)

    expect(screen.getByTestId("card")).toHaveAttribute(
      "data-slot",
      "card"
    )
  })

  it("deve aplicar o data-slot no cabeçalho", () => {
    render(
      <CardHeader data-testid="card-header">
        Cabeçalho
      </CardHeader>
    )

    expect(screen.getByTestId("card-header")).toHaveAttribute(
      "data-slot",
      "card-header"
    )
  })

  it("deve aplicar o data-slot no título", () => {
    render(
      <CardTitle data-testid="card-title">
        Título
      </CardTitle>
    )

    expect(screen.getByTestId("card-title")).toHaveAttribute(
      "data-slot",
      "card-title"
    )
  })

  it("deve aplicar o data-slot na descrição", () => {
    render(
      <CardDescription data-testid="card-description">
        Descrição
      </CardDescription>
    )

    expect(screen.getByTestId("card-description")).toHaveAttribute(
      "data-slot",
      "card-description"
    )
  })

  it("deve aplicar o data-slot no conteúdo", () => {
    render(
      <CardContent data-testid="card-content">
        Conteúdo
      </CardContent>
    )

    expect(screen.getByTestId("card-content")).toHaveAttribute(
      "data-slot",
      "card-content"
    )
  })

  it("deve aplicar as classes padrão do card", () => {
    render(<Card data-testid="card">Conteúdo</Card>)

    expect(screen.getByTestId("card")).toHaveClass(
      "bg-card",
      "text-card-foreground",
      "flex",
      "rounded-xl",
      "border",
      "shadow-sm"
    )
  })

  it("deve aceitar classes personalizadas no card", () => {
    render(
      <Card
        data-testid="card"
        className="custom-card"
      >
        Conteúdo
      </Card>
    )

    expect(screen.getByTestId("card")).toHaveClass(
      "custom-card"
    )
  })

  it("deve aceitar classes personalizadas em todos os subcomponentes", () => {
    render(
      <Card>
        <CardHeader
          data-testid="header"
          className="custom-header"
        >
          <CardTitle
            data-testid="title"
            className="custom-title"
          >
            Título
          </CardTitle>

          <CardDescription
            data-testid="description"
            className="custom-description"
          >
            Descrição
          </CardDescription>
        </CardHeader>

        <CardContent
          data-testid="content"
          className="custom-content"
        >
          Conteúdo
        </CardContent>
      </Card>
    )

    expect(screen.getByTestId("header")).toHaveClass("custom-header")
    expect(screen.getByTestId("title")).toHaveClass("custom-title")
    expect(screen.getByTestId("description")).toHaveClass(
      "custom-description"
    )
    expect(screen.getByTestId("content")).toHaveClass("custom-content")
  })

  it("deve encaminhar atributos HTML para os componentes", () => {
    render(
      <Card
        id="dashboard-card"
        aria-label="Card do dashboard"
      >
        Conteúdo
      </Card>
    )

    const card = screen.getByLabelText("Card do dashboard")

    expect(card).toHaveAttribute("id", "dashboard-card")
  })

  it("deve manter as classes padrão ao receber classes personalizadas", () => {
    render(
      <Card
        data-testid="card"
        className="mt-4"
      >
        Conteúdo
      </Card>
    )

    const card = screen.getByTestId("card")

    expect(card).toHaveClass("bg-card", "rounded-xl", "mt-4")
  })
})