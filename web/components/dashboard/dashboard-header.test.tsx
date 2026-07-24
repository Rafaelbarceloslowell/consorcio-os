// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DashboardHeader } from "./dashboard-header"
import type { User } from "@/types/dashboard"

const user: User = {
  id: "user-1",
  name: "Rafael",
}

describe("DashboardHeader", () => {
  it("deve renderizar a saudação com o nome do usuário", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T09:00:00"))

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", { name: "Bom dia, Rafael" })
    ).toBeInTheDocument()

    vi.useRealTimers()
  })

  it("deve renderizar a saudação da tarde", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T15:00:00"))

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", { name: "Boa tarde, Rafael" })
    ).toBeInTheDocument()

    vi.useRealTimers()
  })

  it("deve renderizar a saudação da noite", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T20:00:00"))

    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", { name: "Boa noite, Rafael" })
    ).toBeInTheDocument()

    vi.useRealTimers()
  })

  it("deve renderizar o resumo informado", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Você possui 12 tarefas pendentes"
      />
    )

    expect(
      screen.getByText("Você possui 12 tarefas pendentes")
    ).toBeInTheDocument()
  })

  it("deve renderizar a saudação como título principal", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading", { level: 1 })
    ).toBeInTheDocument()
  })

  it("deve preservar nomes completos do usuário", () => {
    const completeUser: User = {
      id: "user-2",
      name: "Rafael Barcelos",
    }

    render(
      <DashboardHeader
        user={completeUser}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading")
    ).toHaveTextContent("Rafael Barcelos")
  })

  it("deve renderizar o resumo dentro de um parágrafo", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    const summary = screen.getByText("Resumo comercial")

    expect(summary.tagName).toBe("P")
  })

  it("deve aplicar as classes visuais do título", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByRole("heading")
    ).toHaveClass(
      "text-2xl",
      "font-bold",
      "tracking-tight",
      "sm:text-3xl"
    )
  })

  it("deve aplicar a classe visual do resumo", () => {
    render(
      <DashboardHeader
        user={user}
        summary="Resumo comercial"
      />
    )

    expect(
      screen.getByText("Resumo comercial")
    ).toHaveClass("text-muted-foreground")
  })
})