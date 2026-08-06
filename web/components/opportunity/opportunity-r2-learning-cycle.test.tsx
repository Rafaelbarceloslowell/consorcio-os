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
  OpportunityR2LearningCycle,
} from "./opportunity-r2-learning-cycle"

const fetchMock =
  vi.fn()

function renderComponent(
  overrides:
    Partial<
      Parameters<
        typeof OpportunityR2LearningCycle
      >[0]
    > = {},
) {
  render(
    <OpportunityR2LearningCycle
      opportunityId="journey-1"
      consultantId="consultant-1"
      contactName="Marina"
      initialSuggestion="Podemos conversar?"
      sourceIncomingMessage="Como funciona?"
      intent="interested"
      stage="discovery"
      goal="understand_timing"
      {...overrides}
    />,
  )
}

describe(
  "OpportunityR2LearningCycle",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          message:
            "Observação registrada.",
          learning: {
            consultantEdited:
              true,
            signal:
              "POSITIVE",
            automaticModelUpdateApplied:
              false,
            humanReviewRequired:
              true,
          },
        }),
      })
      vi.stubGlobal(
        "fetch",
        fetchMock,
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it(
      "deixa explícito que não envia mensagem nem altera o modelo sozinho",
      () => {
        renderComponent()

        expect(
          screen.getByText(
            /Nenhuma mensagem é enviada por esta tela/i,
          ),
        ).toBeTruthy()

        expect(
          screen.getByText(
            /modelo não se altera sozinho/i,
          ),
        ).toBeTruthy()

        expect(
          screen.queryByRole(
            "button",
            {
              name:
                /enviar whatsapp/i,
            },
          ),
        ).toBeNull()
      },
    )

    it(
      "protege a sugestão original já salva",
      () => {
        renderComponent()

        expect(
          screen.getByRole(
            "textbox",
            {
              name:
                "Sugestão original do R2",
            },
          ).hasAttribute(
            "readonly",
          ),
        ).toBe(true)
      },
    )

    it(
      "exige confirmação de envio manual",
      () => {
        renderComponent()

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Registrar observação para revisão",
            },
          ),
        )

        expect(
          screen.getByText(
            "Confirme que a mensagem foi enviada manualmente.",
          ),
        ).toBeTruthy()

        expect(
          fetchMock,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "registra sugestão, mensagem final, resposta e resultado",
      async () => {
        renderComponent()

        fireEvent.change(
          screen.getByRole(
            "textbox",
            {
              name:
                "Mensagem realmente enviada",
            },
          ),
          {
            target: {
              value:
                "Marina, podemos conversar amanhã?",
            },
          },
        )

        fireEvent.change(
          screen.getByRole(
            "textbox",
            {
              name:
                "Resposta recebida do cliente",
            },
          ),
          {
            target: {
              value:
                "Sim, amanhã funciona.",
            },
          },
        )

        fireEvent.click(
          screen.getByRole(
            "checkbox",
          ),
        )

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Registrar observação para revisão",
            },
          ),
        )

        await waitFor(() => {
          expect(
            fetchMock,
          ).toHaveBeenCalledWith(
            "/api/opportunities/journey-1/learning-observations",
            expect.objectContaining({
              method:
                "POST",
            }),
          )
        })

        const options =
          fetchMock.mock
            .calls[0][1]

        expect(
          JSON.parse(
            options.body,
          ),
        ).toMatchObject({
          consultantId:
            "consultant-1",
          contactName:
            "Marina",
          sourceIncomingMessage:
            "Como funciona?",
          originalSuggestion:
            "Podemos conversar?",
          finalSentMessage:
            "Marina, podemos conversar amanhã?",
          customerResponse:
            "Sim, amanhã funciona.",
          outcome:
            "POSITIVE_RESPONSE",
        })

        expect(
          await screen.findByTestId(
            "r2-learning-success",
          ),
        ).toBeTruthy()

        expect(
          screen.getByText(
            "Não aplicado",
          ),
        ).toBeTruthy()
      },
    )

    it(
      "registra ausência de resposta sem criar fala do cliente",
      async () => {
        renderComponent()

        fireEvent.change(
          screen.getByRole(
            "combobox",
            {
              name:
                "Resultado comercial",
            },
          ),
          {
            target: {
              value:
                "NO_RESPONSE",
            },
          },
        )

        expect(
          screen.getByTestId(
            "r2-learning-no-response",
          ),
        ).toBeTruthy()

        expect(
          screen.queryByRole(
            "textbox",
            {
              name:
                "Resposta recebida do cliente",
            },
          ),
        ).toBeNull()

        fireEvent.click(
          screen.getByRole(
            "checkbox",
          ),
        )

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Registrar observação para revisão",
            },
          ),
        )

        await waitFor(() => {
          expect(
            fetchMock,
          ).toHaveBeenCalled()
        })

        const options =
          fetchMock.mock
            .calls[0][1]

        expect(
          JSON.parse(
            options.body,
          ),
        ).toMatchObject({
          outcome:
            "NO_RESPONSE",
          customerResponse:
            null,
        })
      },
    )
  },
)
