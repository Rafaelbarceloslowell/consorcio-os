// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  authClient,
} from "@/lib/auth/auth-client"

import {
  GoogleLoginButton,
} from "./google-login-button"

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}))

const socialMock = vi.mocked(authClient.signIn.social)

describe("GoogleLoginButton", () => {
  beforeEach(() => {
    socialMock.mockReset()
    socialMock.mockResolvedValue({ data: null, error: null })
  })

  it("mantém o acesso desativado sem configuração", () => {
    render(<GoogleLoginButton configured={false} />)
    expect(screen.getByRole("button", { name: /Google aguardando/i })).toBeDisabled()
  })

  it("inicia o Google OAuth real com callbacks seguros", async () => {
    render(<GoogleLoginButton configured />)
    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }))

    await waitFor(() => expect(socialMock).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/acesso-negado",
    }))
  })

  it("expõe estado de carregamento e evita segundo clique", async () => {
    let finish: ((value: { data: null; error: null }) => void) | undefined
    socialMock.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    render(<GoogleLoginButton configured />)

    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }))
    expect(await screen.findByRole("button", { name: "Abrindo Google..." })).toBeDisabled()
    finish?.({ data: null, error: null })
  })

  it("anuncia erro devolvido pelo provedor", async () => {
    socialMock.mockResolvedValue({
      data: null,
      error: { message: "Google indisponível" },
    } as never)
    render(<GoogleLoginButton configured />)
    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Google indisponível")
  })
})
