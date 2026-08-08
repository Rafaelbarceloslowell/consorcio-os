import {
  NextRequest,
} from "next/server"

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getContext: vi.fn(),
  findWorkspace: vi.fn(),
}))

vi.mock("@/lib/auth/auth", () => ({
  getAuth: () => ({
    api: {
      getSession: mocks.getSession,
    },
  }),
}))

vi.mock(
  "@/lib/auth/auth-configuration",
  () => ({
    getAuthConfigurationState: () => ({
      configured: true,
      missing: [],
    }),
  }),
)

vi.mock(
  "@/lib/auth/get-authenticated-commercial-context",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/lib/auth/get-authenticated-commercial-context")
      >()

    return {
      ...original,
      getCommercialContextForUserId:
        mocks.getContext,
    }
  },
)

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findUnique:
          mocks.findWorkspace,
      },
    },
  }),
)

import {
  proxy,
} from "./proxy"

function request(
  path: string,
): NextRequest {
  return new NextRequest(
    `http://localhost${path}`,
  )
}

describe("authenticated workspace proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1" },
    })
    mocks.getContext.mockResolvedValue({
      userId: "user-1",
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      role: "CONSULTANT",
    })
    mocks.findWorkspace.mockResolvedValue({
      id: "workspace-1",
    })
  })

  it("permite rotas públicas sem sessão", async () => {
    mocks.getSession.mockResolvedValue(null)

    const response =
      await proxy(request("/login"))

    expect(response.headers.get("location")).toBeNull()
    expect(mocks.getSession).not.toHaveBeenCalled()
  })

  it("redireciona sessão ausente para login", async () => {
    mocks.getSession.mockResolvedValue(null)

    const response =
      await proxy(request("/leads"))

    expect(response.headers.get("location"))
      .toBe("http://localhost/login")
  })

  it("permite usuário vinculado ao workspace do piloto", async () => {
    const response =
      await proxy(request("/leads"))

    expect(response.headers.get("location")).toBeNull()
    expect(mocks.getContext)
      .toHaveBeenCalledExactlyOnceWith("user-1")
  })

  it("bloqueia usuário de outro workspace", async () => {
    mocks.getContext.mockResolvedValue({
      userId: "user-2",
      workspaceId: "workspace-2",
      consultantId: "consultant-2",
      role: "CONSULTANT",
    })

    const response =
      await proxy(request("/clients/client-1"))

    expect(response.headers.get("location"))
      .toBe("http://localhost/acesso-negado")
  })
})
