// @vitest-environment jsdom
/// <reference types="vitest/globals" />

import { render, screen } from "@testing-library/react"

import { DashboardHeader } from "./dashboard-header"

vi.mock("@/components/dashboard/gorila-r2-avatar-3d", () => ({
  GorilaR2Avatar3D: () => <div data-testid="r2-avatar" />,
}))

vi.mock("@/components/search/global-search", () => ({
  GlobalSearch: () => null,
}))

describe("DashboardHeader R2 area", () => {
  it("allocates 42% of the desktop banner and stacks safely below xl", () => {
    render(
      <DashboardHeader
        user={{ id: "user-1", name: "Rafael" }}
        summary="Resumo comercial"
      />,
    )

    expect(screen.getByTestId("r2-hero-layout")).toHaveClass(
      "grid",
      "xl:min-h-[420px]",
      "xl:grid-cols-[minmax(0,42%)_minmax(0,58%)]",
      "2xl:min-h-[460px]",
    )
    expect(screen.getByTestId("r2-avatar")).toBeInTheDocument()
  })
})
