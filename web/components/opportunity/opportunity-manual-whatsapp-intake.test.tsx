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

import {
  analyzeManualWhatsAppMessage,
} from "@/application/opportunity/analyze-manual-whatsapp-message"

import {
  resolveR2Intelligence,
} from "@/application/r2/resolve-r2-intelligence"

const writeText = vi.fn()
const fetchMock = vi.fn()

describe(
  "OpportunityManualWhatsAppIntake",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      writeText.mockResolvedValue(undefined)
      fetchMock.mockReset()
      vi.stubGlobal(
        "fetch",
        fetchMock,
      )
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
            /últimas mensagens ou escreva um resumo do histórico/i,
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByRole("textbox", {
            name:
              "Últimas mensagens ou resumo do histórico",
          }).getAttribute(
            "placeholder",
          ),
        ).toContain(
          "O cliente buscava um Corolla.",
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
              "Últimas mensagens ou resumo do histórico",
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
      "usa o contexto do Corolla e nao confunde tentativa de reuniao com aceite do cliente",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Diego Fernandes"
            approachType="reactivation"
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name:
              "Últimas mensagens ou resumo do histórico",
          }),
          {
            target: {
              value:
                "O cliente estava a procura de um automovel corola. Tentei marcar uma reunião, mas ele não respondeu mais. A última mensagem foi no dia 23/04/2026.",
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
            "Conversa interrompida sem resposta",
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            /O cliente buscava um Corolla/i,
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            /último movimento do consultor foi uma tentativa de agendar uma reunião/i,
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            /não respondeu mais depois do contato de 23\/04\/2026/i,
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByRole("textbox", {
            name: "Resposta preparada pelo R2",
          }),
        ).toHaveValue(
          "Oi, Diego, tudo bem? Quando conversamos em 23/04/2026, você estava buscando um Corolla. Esse projeto ainda está de pé ou seus planos mudaram desde então?",
        )

        expect(
          (
            screen.getByRole("textbox", {
              name: "Resposta preparada pelo R2",
            }) as HTMLTextAreaElement
          ).value,
        ).not.toContain(
          "Qual horário funciona melhor?",
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
      "mostra a técnica comercial e pede prova social ao consultor",
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
            "Script Comercial da Seal’s",
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            "SPIN Selling",
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            /Construção de valor/,
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByTestId(
            "r2-social-proof-consultant-prompt",
          ),
        ).toHaveTextContent(
          "histórico da Seal’s",
        )

        expect(
          screen.getByTestId(
            "r2-social-proof-consultant-prompt",
          ),
        ).toHaveTextContent(
          "caso real, semelhante e autorizado",
        )

        expect(
          screen.getByText(
            "Descobrir objetivo, valor, prazo e capacidade antes de apresentar condição.",
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            "Termine com uma pergunta simples ou um compromisso concreto coerente com o estágio atual.",
          ),
        ).toBeInTheDocument()
      },
    )

    it(
      "consome a inteligência unificada e depois salva a memória comercial",
      async () => {
        const incomingMessage =
          "Qual o valor da parcela?"
        const serverAnalysis =
          analyzeManualWhatsAppMessage(
            incomingMessage,
            { approachType: "new" },
          )

        expect(serverAnalysis).not.toBeNull()

        const intelligence =
          resolveR2Intelligence({
            recommendationId:
              "recommendation-1",
            workspaceId: "workspace-1",
            opportunityId: "journey-1",
            approachType: "new",
            analysis: serverAnalysis!,
            profile: {
              assetCategory:
                "real_estate",
            },
            candidates: [],
            commercialEvents: [],
            now: new Date(
              "2026-08-08T15:00:00.000Z",
            ),
          })

        fetchMock
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              analysis: serverAnalysis,
              reply:
                "Resposta segura do servidor.",
              intelligence,
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              message: "saved",
            }),
          })

        render(
          <OpportunityManualWhatsAppIntake
            opportunityId="journey-1"
            contactName="Janaina Rodrigues"
          />,
        )

        fireEvent.change(
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          }),
          {
            target: {
              value: incomingMessage,
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        )

        expect(
          await screen.findByTestId(
            "opportunity-r2-intelligence",
          ),
        ).toHaveTextContent(
          intelligence.nextBestAction.title,
        )
        expect(
          screen.getByRole("textbox", {
            name: "Resposta preparada pelo R2",
          }),
        ).toHaveValue(
          "Resposta segura do servidor.",
        )
        await waitFor(() => {
          expect(fetchMock).toHaveBeenCalledTimes(2)
        })
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
          "/api/opportunities/journey-1/r2-intelligence",
        )
        expect(fetchMock.mock.calls[1]?.[0]).toBe(
          "/api/opportunities/journey-1/conversation-memory",
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
