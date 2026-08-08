// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
} from "vitest"

import {
  PipelineOverview,
} from "./pipeline-overview"

describe("PipelineOverview", () => {
  it("renderiza etapas, volumes e quantidades recebidos do runtime", () => {
    render(
      <PipelineOverview pipeline={[
        { id: "one", name: "Prospecção", count: 3, value: 750000 },
        { id: "two", name: "Negociação", count: 1, value: 250000 },
      ]} />,
    )

    expect(screen.getByRole("heading", { name: "Pipeline de oportunidades" })).toBeInTheDocument()
    expect(screen.getByText("Prospecção")).toBeInTheDocument()
    expect(screen.getByText("3 oportunidades")).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*750 mil/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Nova oportunidade/i })).toHaveAttribute("href", "/opportunities/new")
  })

  it("não fabrica etapas quando o pipeline está vazio", () => {
    render(<PipelineOverview pipeline={[]} />)
    expect(screen.getByText(/Nenhuma etapa comercial disponível/i)).toBeInTheDocument()
  })
})
