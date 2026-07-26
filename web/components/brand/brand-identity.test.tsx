// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { BrandIdentity, BrandMarkSlot } from "./brand-identity"

describe("BrandIdentity", () => {
  afterEach(() => {
    document.documentElement.classList.remove("gorila-light", "gorila-night")
  })

  it("padroniza o nome da aplicação", () => {
    render(<BrandIdentity />)

    expect(screen.getByText("Gorila OS")).toBeInTheDocument()
    expect(screen.getByText("Centro de operações")).toBeInTheDocument()
  })

  it("alterna a GorillaMark de acordo com o tema ativo", async () => {
    document.documentElement.classList.add("gorila-night")
    const { container } = render(<BrandMarkSlot />)
    const slot = container.querySelector("[data-brand-mark-slot]")
    const image = slot?.querySelector("img")

    expect(slot).toBeInTheDocument()
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute("src", "/brand/GorillaMark_Dark.svg")
    expect(image).toHaveAttribute("alt", "")

    act(() => {
      document.documentElement.classList.replace(
        "gorila-night",
        "gorila-light"
      )
    })

    await waitFor(() => {
      expect(image).toHaveAttribute("src", "/brand/GorillaMark_Light.svg")
    })
  })

  it("mantém apenas o slot visual no modo compacto", () => {
    document.documentElement.classList.add("gorila-light")
    const { container } = render(<BrandIdentity compact />)
    const slot = container.querySelector("[data-brand-mark-slot]")

    expect(slot).toBeInTheDocument()
    expect(slot?.querySelector("img")).toHaveAttribute(
      "src",
      "/brand/GorillaMark_Light.svg"
    )
    expect(screen.queryByText("Gorila OS")).not.toBeInTheDocument()
  })
})
