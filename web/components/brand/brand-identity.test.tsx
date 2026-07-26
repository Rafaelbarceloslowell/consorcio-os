// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { BrandIdentity, BrandMarkSlot } from "./brand-identity"

describe("BrandIdentity", () => {
  it("padroniza o nome da aplicação", () => {
    render(<BrandIdentity />)

    expect(screen.getByText("Gorila OS")).toBeInTheDocument()
    expect(screen.getByText("Centro de operações")).toBeInTheDocument()
  })

  it("expõe um slot estrutural sem desenhar a GorillaMark", () => {
    const { container } = render(<BrandMarkSlot />)
    const slot = container.querySelector("[data-brand-mark-slot]")

    expect(slot).toBeInTheDocument()
    expect(slot).toBeEmptyDOMElement()
  })

  it("mantém apenas o slot visual no modo compacto", () => {
    const { container } = render(<BrandIdentity compact />)

    expect(container.querySelector("[data-brand-mark-slot]")).toBeInTheDocument()
    expect(screen.queryByText("Gorila OS")).not.toBeInTheDocument()
  })
})
