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
  GorilaR2Avatar3D,
} from "./gorila-r2-avatar-3d"

describe(
  "GorilaR2Avatar3D static visual",
  () => {
    it(
      "renders the official static image instead of a 3D Canvas",
      () => {
        render(
          <GorilaR2Avatar3D
            size="hero"
            workspaceId="workspace-a"
            userId="user-a"
            status="online"
          />,
        )

        const avatar =
          screen.getByTestId(
            "gorila-r2-static-avatar",
          )

        expect(avatar).toHaveAttribute(
          "data-r2-render-mode",
          "static-image",
        )

        expect(avatar).toHaveAttribute(
          "data-workspace-id",
          "workspace-a",
        )

        expect(avatar).toHaveAttribute(
          "data-user-id",
          "user-a",
        )

        expect(avatar).toHaveAttribute(
          "data-r2-status",
          "online",
        )

        const image =
          screen.getByRole("img", {
            name:
              "GorilaR2 usando o uniforme verde do GorillaOS",
          })

        expect(
          image.getAttribute("src"),
        ).toContain(
          "gorila-r2-static-oficial.png",
        )

        expect(
          document.querySelector("canvas"),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "preserves the hero dimensions",
      () => {
        render(
          <GorilaR2Avatar3D size="hero" />,
        )

        expect(
          screen.getByTestId(
            "gorila-r2-static-avatar",
          ),
        ).toHaveClass(
          "w-full",
          "min-h-[320px]",
          "xl:min-h-[420px]",
        )
      },
    )

    it(
      "preserves the compact dimensions",
      () => {
        render(
          <GorilaR2Avatar3D size="compact" />,
        )

        expect(
          screen.getByTestId(
            "gorila-r2-static-avatar",
          ),
        ).toHaveClass(
          "size-11",
        )
      },
    )
  },
)
