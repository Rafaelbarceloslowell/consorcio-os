// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  resolveR2Intelligence,
} from "@/application/r2/resolve-r2-intelligence"

import {
  OpportunityR2ConsultantFeedback,
} from "./opportunity-r2-consultant-feedback"

const fetchMock = vi.fn()
let uuidIndex = 0

const intelligence = resolveR2Intelligence({
  recommendationId: "recommendation-a",
  workspaceId: "workspace-1",
  opportunityId: "journey-1",
  approachType: "new",
  analysis: {
    intent: "pricing_question",
    stage: "qualification",
    label: "Pergunta de valor",
    summary: "O cliente perguntou por valores.",
    recommendedAction: "Confirmar capacidade mensal.",
  },
  profile: {
    assetCategory: "real_estate",
    desiredCredit: 1_000_000,
    targetTimelineMonths: 180,
  },
  candidates: [],
  commercialEvents: [],
  now: new Date("2026-08-15T12:00:00.000Z"),
})

function response(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function renderFeedback(
  onRevision = vi.fn(),
) {
  render(
    <OpportunityR2ConsultantFeedback
      opportunityId="journey-1"
      intelligence={intelligence}
      onRevision={onRevision}
    />,
  )

  return { onRevision }
}

function fillDisagreement(): void {
  fireEvent.change(
    screen.getByLabelText("Tipo do erro"),
    {
      target: {
        value: "WRONG_COMMERCIAL_STRATEGY",
      },
    },
  )
  fireEvent.change(
    screen.getByLabelText("O que o R2 entendeu errado?"),
    {
      target: {
        value: "A capacidade mensal já foi informada.",
      },
    },
  )
  fireEvent.change(
    screen.getByLabelText("Qual seria o caminho correto?"),
    {
      target: {
        value: "Compare opções e conduza para reunião.",
      },
    },
  )
}

describe("OpportunityR2ConsultantFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uuidIndex = 0
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("crypto", {
      randomUUID: () => `ui-key-${++uuidIndex}`,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("exibe ações opcionais Faz sentido e Discordo", () => {
    renderFeedback()

    expect(screen.getByRole("button", {
      name: "Faz sentido",
    })).toBeEnabled()
    expect(screen.getByRole("button", {
      name: "Discordo",
    })).toBeEnabled()
  })

  it("registra feedback positivo e evita duplo submit durante loading", async () => {
    let release: (value: Response) => void = () => {
      throw new Error("response resolver unavailable")
    }
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => {
      release = resolve
    }))
    renderFeedback()

    const button = screen.getByRole("button", {
      name: "Faz sentido",
    })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    release(response({
      status: "ACCEPTED",
      feedbackId: "r2-feedback-ui-key-1",
    }))

    expect(await screen.findByText("Feedback registrado.")).toBeVisible()
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      action: "ACCEPT",
      recommendationId: "recommendation-a",
      idempotencyKey: "ui-key-1",
    })
  })

  it("abre diálogo simples com categoria e dois textos obrigatórios", () => {
    renderFeedback()
    fireEvent.click(screen.getByRole("button", {
      name: "Discordo",
    }))

    expect(screen.getByRole("dialog", {
      name: "Onde o R2 errou?",
    })).toBeVisible()
    expect(screen.getByLabelText("Tipo do erro")).toBeVisible()
    expect(screen.getByLabelText(
      "O que o R2 entendeu errado?",
    )).toBeVisible()
    expect(screen.getByLabelText(
      "Qual seria o caminho correto?",
    )).toBeVisible()
    expect(screen.getByRole("button", {
      name: "Corrigir R2",
    })).toBeDisabled()
  })

  it("mostra sucesso, entrega a recomendação revisada e limpa o formulário", async () => {
    const revised = {
      ...intelligence,
      recommendationId: "recommendation-b",
      explanation:
        "Correção aplicada neste caso e registrada para avaliação.",
    }
    fetchMock.mockResolvedValue(response({
      status: "CORRECTION_APPLIED",
      feedbackPersisted: true,
      feedbackId: "r2-feedback-ui-key-1",
      message:
        "Correção aplicada neste caso e registrada para avaliação de aprendizado.",
      intelligence: revised,
      analysis: {
        intent: "interested",
        stage: "strategy",
        label: "Contexto corrigido",
        summary: "Compare opções.",
        recommendedAction: "Conduza para reunião.",
      },
      reply: "Vamos comparar as opções.",
      evidence: null,
      safetyCheck: null,
    }))
    const { onRevision } = renderFeedback()
    fireEvent.click(screen.getByRole("button", {
      name: "Discordo",
    }))
    fillDisagreement()
    fireEvent.click(screen.getByRole("button", {
      name: "Corrigir R2",
    }))

    expect(await screen.findByText(
      "Correção aplicada neste caso e registrada para avaliação de aprendizado.",
    )).toBeVisible()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(onRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        intelligence: expect.objectContaining({
          recommendationId: "recommendation-b",
        }),
        reply: "Vamos comparar as opções.",
      }),
    )
    expect(screen.getByText(
      "Essa orientação funcionou?",
    )).toBeVisible()
  })

  it("mantém os textos e a mesma chave idempotente após erro para retry", async () => {
    fetchMock
      .mockResolvedValueOnce(response({
        error: "O feedback foi salvo, mas a regeneração falhou.",
        feedbackPersisted: true,
        feedbackId: "r2-feedback-ui-key-1",
      }, 500))
      .mockResolvedValueOnce(response({
        status: "CORRECTION_APPLIED",
        feedbackPersisted: true,
        feedbackId: "r2-feedback-ui-key-1",
        message: "Correção aplicada.",
      }))
    renderFeedback()
    fireEvent.click(screen.getByRole("button", {
      name: "Discordo",
    }))
    fillDisagreement()
    fireEvent.click(screen.getByRole("button", {
      name: "Corrigir R2",
    }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O feedback foi salvo, mas a regeneração falhou.",
    )
    expect(screen.getByLabelText(
      "O que o R2 entendeu errado?",
    )).toHaveValue("A capacidade mensal já foi informada.")
    expect(screen.getByLabelText(
      "Qual seria o caminho correto?",
    )).toHaveValue("Compare opções e conduza para reunião.")

    fireEvent.click(screen.getByRole("button", {
      name: "Corrigir R2",
    }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const first = JSON.parse(fetchMock.mock.calls[0][1].body)
    const second = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
  })

  it("informa bloqueio de safety sem executar literalmente a orientação", async () => {
    fetchMock.mockResolvedValue(response({
      status: "BLOCKED_BY_SAFETY",
      feedbackPersisted: true,
      feedbackId: "r2-feedback-ui-key-1",
      message:
        "A estratégia foi registrada, mas não pode ser aplicada porque ultrapassa os guardrails.",
    }, 422))
    renderFeedback()
    fireEvent.click(screen.getByRole("button", {
      name: "Discordo",
    }))
    fillDisagreement()
    fireEvent.click(screen.getByRole("button", {
      name: "Corrigir R2",
    }))

    expect(await screen.findByText(
      "A estratégia foi registrada, mas não pode ser aplicada porque ultrapassa os guardrails.",
    )).toBeVisible()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("registra resultado posterior de forma discreta", async () => {
    fetchMock
      .mockResolvedValueOnce(response({
        status: "ACCEPTED",
        feedbackId: "r2-feedback-ui-key-1",
      }))
      .mockResolvedValueOnce(response({
        status: "OUTCOME_RECORDED",
        feedbackId: "r2-feedback-ui-key-1",
      }))
    renderFeedback()
    fireEvent.click(screen.getByRole("button", {
      name: "Faz sentido",
    }))
    await screen.findByText("Feedback registrado.")
    fireEvent.click(screen.getByRole("button", {
      name: "Parcialmente",
    }))

    expect(await screen.findByText("Resultado registrado.")).toBeVisible()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      action: "OUTCOME",
      feedbackId: "r2-feedback-ui-key-1",
      outcome: "PARTIALLY_WORKED",
    })
  })
})
