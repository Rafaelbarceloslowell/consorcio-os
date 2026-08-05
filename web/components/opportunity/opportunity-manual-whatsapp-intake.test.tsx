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
  OpportunityManualWhatsAppIntake,
} from "./opportunity-manual-whatsapp-intake"

const writeText = vi.fn()

describe(
  "OpportunityManualWhatsAppIntake",
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
      "explica o modo assistido e mantém análise desabilitada sem texto",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
          />,
        )

        expect(
          screen.getByRole("region", {
            name: "Analisar mensagem recebida",
          }),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /não lê o WhatsApp e salva apenas/i,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        ).toBeDisabled()
        expect(
          screen.queryByRole("button", {
            name: /enviar/i,
          }),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "pede as últimas mensagens quando a oportunidade é uma reativação",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Sarah"
            approachType="reactivation"
          />,
        )

        expect(
          screen.getByRole("region", {
            name:
              "Informar contexto recente",
          }),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            /últimas mensagens trocadas entre você e o cliente/i,
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByRole("textbox", {
            name:
              "Últimas mensagens da conversa",
          }).getAttribute(
            "placeholder",
          ),
        ).toContain(
          "Cliente: Ainda quero analisar.",
        )

        expect(
          screen.getByRole("button", {
            name:
              "Analisar contexto",
          }),
        ).toBeDisabled()
      },
    )

    it(
      "entende que o cliente nunca respondeu e prepara uma nova abertura",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
            approachType="reactivation"
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name:
              "Últimas mensagens da conversa",
          }),
          {
            target: {
              value:
                "O cliente nunca me respondeu.",
            },
          },
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar contexto",
          }),
        )

        expect(
          screen.getByText(
            "Cliente ainda não respondeu",
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByRole("textbox", {
            name: "Resposta preparada pelo R2",
          }),
        ).toHaveValue(
          "Oi, Janaina, tudo bem? Tentei falar com você há um tempo, mas ainda não conseguimos conversar. Hoje você está buscando imóvel, veículo ou quer entender o consórcio como investimento?",
        )
      },
    )

    it(
      "analisa mensagem e prepara resposta editável",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          }),
          {
            target: {
              value:
                "Qual o valor da parcela?",
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        )

        expect(
          screen.getByText(
            "Dúvida sobre condição",
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("textbox", {
            name: "Resposta preparada pelo R2",
          }),
        ).toHaveValue(
          "Claro, Janaina. Para eu te passar uma condição que realmente faça sentido, posso confirmar qual valor você pretende alcançar e em quanto tempo quer realizar esse objetivo?",
        )
      },
    )

    it(
      "descarta análise anterior quando a mensagem recebida é alterada",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
          />,
        )

        const incomingMessage =
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          })

        fireEvent.change(
          incomingMessage,
          {
            target: {
              value:
                "Qual o valor da parcela?",
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        )

        expect(
          screen.getByTestId(
            "manual-whatsapp-analysis",
          ),
        ).toBeInTheDocument()

        fireEvent.change(
          incomingMessage,
          {
            target: {
              value: "Me chama depois.",
            },
          },
        )

        expect(
          screen.queryByTestId(
            "manual-whatsapp-analysis",
          ),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByRole("textbox", {
            name: "Resposta preparada pelo R2",
          }),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "copia a resposta revisada pelo consultor",
      async () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          }),
          {
            target: {
              value: "Me chama depois.",
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        )

        const reply = screen.getByRole(
          "textbox",
          {
            name: "Resposta preparada pelo R2",
          },
        )
        fireEvent.change(reply, {
          target: {
            value: "Resposta revisada.",
          },
        })
        fireEvent.click(
          screen.getByRole("button", {
            name: "Copiar resposta",
          }),
        )

        await waitFor(() => {
          expect(writeText).toHaveBeenCalledWith(
            "Resposta revisada.",
          )
        })
        expect(
          await screen.findByText(
            /revise antes de enviar manualmente/i,
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "mantém resposta disponível quando clipboard falha",
      async () => {
        writeText.mockRejectedValue(
          new Error("Falha"),
        )

        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          }),
          {
            target: {
              value: "Tenho interesse.",
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Copiar resposta",
          }),
        )

        expect(
          await screen.findByText(
            /copie manualmente/i,
          ),
        ).toBeInTheDocument()
        expect(
          screen.getByRole("textbox", {
            name: "Resposta preparada pelo R2",
          }),
        ).not.toHaveValue("")
      },
    )

    it(
      "limpa mensagem, análise e resposta",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          }),
          {
            target: {
              value: "Me chama depois.",
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Limpar",
          }),
        )

        expect(
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          }),
        ).toHaveValue("")
        expect(
          screen.queryByTestId(
            "manual-whatsapp-analysis",
          ),
        ).not.toBeInTheDocument()
      },
    )
  },
)
