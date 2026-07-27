// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  ClientLifecycleActions,
} from "./client-lifecycle-actions"

function createActions() {
  return {
    blockAction:
      vi.fn(async () => {}),
    unblockAction:
      vi.fn(async () => {}),
    deactivateAction:
      vi.fn(async () => {}),
    reactivateAction:
      vi.fn(async () => {}),
  }
}

describe(
  "ClientLifecycleActions",
  () => {
    it("oferece bloqueio e desativação para cliente ativo", () => {
      render(
        <ClientLifecycleActions
          status="active"
          {...createActions()}
        />,
      )

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Ações de lifecycle",
          },
        ),
      ).toBeInTheDocument()

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Bloquear cliente",
          },
        ),
      ).toBeInTheDocument()

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Desativar cliente",
          },
        ),
      ).toBeInTheDocument()

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Desbloquear cliente",
          },
        ),
      ).not.toBeInTheDocument()

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Reativar cliente",
          },
        ),
      ).not.toBeInTheDocument()
    })

    it("oferece desbloqueio e desativação para cliente bloqueado", () => {
      render(
        <ClientLifecycleActions
          status="blocked"
          {...createActions()}
        />,
      )

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Desbloquear cliente",
          },
        ),
      ).toBeInTheDocument()

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Desativar cliente",
          },
        ),
      ).toBeInTheDocument()

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Bloquear cliente",
          },
        ),
      ).not.toBeInTheDocument()

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Reativar cliente",
          },
        ),
      ).not.toBeInTheDocument()
    })

    it("oferece somente reativação para cliente inativo", () => {
      render(
        <ClientLifecycleActions
          status="inactive"
          {...createActions()}
        />,
      )

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Reativar cliente",
          },
        ),
      ).toBeInTheDocument()

      expect(
        screen.getAllByRole(
          "button",
        ),
      ).toHaveLength(1)

      expect(
        screen.queryByRole(
          "button",
          {
            name:
              "Desativar cliente",
          },
        ),
      ).not.toBeInTheDocument()
    })

    it("mantém cada operação em formulário independente", () => {
      const { container } =
        render(
          <ClientLifecycleActions
            status="active"
            {...createActions()}
          />,
        )

      const forms =
        container.querySelectorAll(
          "form",
        )

      expect(forms).toHaveLength(2)

      expect(
        forms[0]?.querySelector(
          "button",
        ),
      ).toHaveTextContent(
        "Bloquear cliente",
      )

      expect(
        forms[1]?.querySelector(
          "button",
        ),
      ).toHaveTextContent(
        "Desativar cliente",
      )
    })
  },
)
