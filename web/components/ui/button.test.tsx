// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Button, buttonVariants } from "./button"

describe("Button", () => {
  it("deve renderizar um botão com o conteúdo informado", () => {
    render(<Button>Salvar</Button>)

    expect(
      screen.getByRole("button", { name: "Salvar" })
    ).toBeInTheDocument()
  })

  it("deve aplicar o data-slot correto", () => {
    render(<Button>Continuar</Button>)

    expect(
      screen.getByRole("button", { name: "Continuar" })
    ).toHaveAttribute("data-slot", "button")
  })

  it("deve aplicar as variantes padrão quando nenhuma opção for informada", () => {
    render(<Button>Confirmar</Button>)

    const button = screen.getByRole("button", { name: "Confirmar" })

    expect(button).toHaveClass(
      "bg-primary",
      "text-primary-foreground",
      "h-8"
    )
  })

  it("deve aplicar a variante outline", () => {
    render(<Button variant="outline">Editar</Button>)

    const button = screen.getByRole("button", { name: "Editar" })

    expect(button).toHaveClass(
      "border-border",
      "bg-background"
    )
  })

  it("deve aplicar a variante destructive", () => {
    render(<Button variant="destructive">Excluir</Button>)

    const button = screen.getByRole("button", { name: "Excluir" })

    expect(button).toHaveClass(
      "bg-destructive/10",
      "text-destructive"
    )
  })

  it("deve aplicar o tamanho informado", () => {
    render(<Button size="lg">Avançar</Button>)

    expect(
      screen.getByRole("button", { name: "Avançar" })
    ).toHaveClass("h-9")
  })

  it("deve aceitar classes personalizadas", () => {
    render(<Button className="custom-button">Personalizado</Button>)

    expect(
      screen.getByRole("button", { name: "Personalizado" })
    ).toHaveClass("custom-button")
  })

  it("deve preservar a classe personalizada ao combinar variantes", () => {
    render(
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
      >
        Simular
      </Button>
    )

    const button = screen.getByRole("button", { name: "Simular" })

    expect(button).toHaveClass(
      "bg-secondary",
      "h-7",
      "w-full"
    )
  })

  it("deve executar o evento de clique", () => {
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Clicar</Button>)

    fireEvent.click(screen.getByRole("button", { name: "Clicar" }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("não deve executar clique quando estiver desabilitado", () => {
    const handleClick = vi.fn()

    render(
      <Button disabled onClick={handleClick}>
        Bloqueado
      </Button>
    )

    const button = screen.getByRole("button", { name: "Bloqueado" })

    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it("deve encaminhar atributos HTML para o elemento", () => {
    render(
      <Button
        type="submit"
        aria-label="Enviar proposta"
        data-testid="proposal-button"
      >
        Enviar
      </Button>
    )

    const button = screen.getByTestId("proposal-button")

    expect(button).toHaveAttribute("type", "submit")
    expect(button).toHaveAccessibleName("Enviar proposta")
  })
})

describe("buttonVariants", () => {
  it("deve gerar as classes das variantes informadas", () => {
    const classes = buttonVariants({
      variant: "ghost",
      size: "icon-lg",
    })

    expect(classes).toContain("hover:bg-muted")
    expect(classes).toContain("size-9")
  })

  it("deve incluir classes personalizadas", () => {
    const classes = buttonVariants({
      className: "my-custom-class",
    })

    expect(classes).toContain("my-custom-class")
  })
})