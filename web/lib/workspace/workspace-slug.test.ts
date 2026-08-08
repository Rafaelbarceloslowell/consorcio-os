import {
  describe,
  expect,
  it,
} from "vitest"

import {
  getWorkspaceSlug,
} from "@/lib/workspace/workspace-slug"

describe("getWorkspaceSlug", () => {
  it("usa o workspace configurado no ambiente", () => {
    expect(
      getWorkspaceSlug({
        WORKSPACE_SLUG:
          "  gorillaos-staging  ",
      }),
    ).toBe("gorillaos-staging")
  })

  it("preserva o workspace oficial como fallback", () => {
    expect(
      getWorkspaceSlug({}),
    ).toBe("consorcio-os")
  })
})
