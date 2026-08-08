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
  DashboardHeader,
} from "./dashboard-header"

describe("DashboardHeader responsive cockpit layout", () => {
  it("empilha no mobile e reserva duas zonas operacionais no desktop", () => {
    const { container } = render(
      <DashboardHeader
        user={{ id: "user-1", name: "Rafael" }}
        summary="Resumo"
      />,
    )

    expect(container.querySelector(".lg\\:grid-cols-\\[minmax\\(320px\\,0\\.82fr\\)_minmax\\(0\\,1\\.18fr\\)\\]")).toBeInTheDocument()
    expect(screen.getByTestId("gorila-r2-static-avatar")).toBeInTheDocument()
  })
})
