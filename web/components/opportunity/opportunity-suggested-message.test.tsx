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
  OpportunitySuggestedMessage,
} from "./opportunity-suggested-message"

const writeText = vi.fn()
const initialMessage =
  "Olá, Janaina! Tudo bem?"

describe(
  "OpportunitySuggestedMessage",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      writeText.mockResolvedValue(undefined)
      vi.stubGlobal(
        "navigator",
        {
          clipboard: {
            writeText,
          },
        },
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it(
      "mostra mensagem editável e informa que não haverá envio automático",
      () => {
        render(
          <OpportunitySuggestedMessage
            initialMessage={initialMessage}
          />,
        )

        expect(
          screen.getByRole("region", {
            name: "Mensagem sugerida pelo R2",
          }),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("textbox", {
            name: "Texto da mensagem",
          }),
        ).toHaveValue(initialMessage)
        expect(
          screen.getByText(
            /não enviará nada automaticamente/i,
          ),
        ).toBeInTheDocument()
        expect(
          screen.queryByText(
            /perguntas comerciais/i,
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByRole("button", {
            name: /enviar/i,
          }),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "copia a versão revisada pelo consultor",
      async () => {
        render(
          <OpportunitySuggestedMessage
            initialMessage={initialMessage}
          />,
        )

        const textarea =
          screen.getByRole("textbox", {
            name: "Texto da mensagem",
          })

        fireEvent.change(textarea, {
          target: {
            value:
              "Mensagem revisada pelo consultor.",
          },
        })
        fireEvent.click(
          screen.getByRole("button", {
            name: "Copiar mensagem",
          }),
        )

        await waitFor(() => {
          expect(writeText).toHaveBeenCalledWith(
            "Mensagem revisada pelo consultor.",
          )
        })
        expect(
          await screen.findByText(
            "Mensagem copiada. Revise antes de usar.",
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "mantém o texto disponível quando o clipboard falha",
      async () => {
        writeText.mockRejectedValue(
          new Error("Falha"),
        )

        render(
          <OpportunitySuggestedMessage
            initialMessage={initialMessage}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Copiar mensagem",
          }),
        )

        expect(
          await screen.findByText(
            /selecione o texto e copie manualmente/i,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("textbox", {
            name: "Texto da mensagem",
          }),
        ).toHaveValue(initialMessage)
      },
    )

    it(
      "desabilita a cópia quando a mensagem fica vazia",
      () => {
        render(
          <OpportunitySuggestedMessage
            initialMessage={initialMessage}
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name: "Texto da mensagem",
          }),
          {
            target: {
              value: "   ",
            },
          },
        )

        expect(
          screen.getByRole("button", {
            name: "Copiar mensagem",
          }),
        ).toBeDisabled()
      },
    )

    it(
      "libera a mensagem quando o contexto do ciclo atual resolve o gate",
      async () => {
        const fetchMock = vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ reactivation: { canRecommendMessage: false } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ reactivation: { canRecommendMessage: true } }),
          })
        vi.stubGlobal("fetch", fetchMock)

        render(
          <OpportunitySuggestedMessage
            initialMessage={initialMessage}
            gateOpportunityId="opportunity-1"
          />,
        )

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
        expect(screen.queryByRole("textbox", { name: "Texto da mensagem" })).not.toBeInTheDocument()

        window.dispatchEvent(new CustomEvent("r2-execution-updated", {
          detail: { opportunityId: "opportunity-1" },
        }))

        expect(await screen.findByRole("textbox", { name: "Texto da mensagem" })).toHaveValue(initialMessage)
        expect(fetchMock).toHaveBeenCalledTimes(2)
      },
    )
  },
)
