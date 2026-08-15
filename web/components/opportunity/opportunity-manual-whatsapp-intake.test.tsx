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
      "envia contexto do consultor com origem explícita e sem agradecimento por resposta",
      async () => {
        const consultantContext =
          "Cliente nunca respondeu"
        const serverAnalysis =
          analyzeManualWhatsAppMessage(
            consultantContext,
            { approachType: "new" },
          )
        const intelligence =
          resolveR2Intelligence({
            recommendationId:
              "recommendation-context",
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
          })

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            analysis: serverAnalysis,
            reply:
              "Oi, Janaina, tudo bem? Ainda não conseguimos conversar. Seu projeto continua nos planos?",
            intelligence,
          }),
        })

        render(
          <section className="gorila-material overflow-hidden backdrop-blur-xl">
            <OpportunityManualWhatsAppIntake
              opportunityId="journey-1"
              contactName="Janaina Rodrigues"
            />
          </section>,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Contexto do consultor",
          }),
        )
        fireEvent.change(
          screen.getByRole("textbox", {
            name:
              "Contexto registrado pelo consultor",
          }),
          {
            target: {
              value: consultantContext,
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar contexto",
          }),
        )

        expect(
          await screen.findByRole("textbox", {
            name: "Resposta preparada pelo R2",
          }),
        ).not.toHaveValue(
          expect.stringMatching(
            /obrigad[oa].*(?:responder|retorno|resposta)/iu,
          ),
        )
        expect(JSON.parse(
          fetchMock.mock.calls[0]?.[1]
            ?.body as string,
        )).toMatchObject({
          incomingMessage:
            consultantContext,
          sourceType:
            "CONSULTANT_CONTEXT",
        })
      },
    )

    it(
      "mostra ausência de inbound e contexto do consultor em blocos separados",
      () => {
        render(
          <OpportunityManualWhatsAppIntake
            contactName="Janaina Rodrigues"
            initialMemory={{
              id: "memory-1",
              stage: "opening",
              goal: "get_first_response",
              lastIntent:
                "no_previous_response",
              lastIncomingMessage: null,
              customerHasReplied: false,
              responseStatus:
                "NEVER_RESPONDED",
              consultantContext:
                "Cliente nunca respondeu",
              lastSuggestedReply:
                "Oi, Janaina, tudo bem?",
              analyzedAt:
                "2026-08-15T12:00:00.000Z",
              updatedAt:
                "2026-08-15T12:00:00.000Z",
            }}
          />,
        )

        expect(
          screen.getByTestId(
            "commercial-conversation-memory",
          ),
        ).toHaveTextContent(
          "Nenhuma mensagem recebida",
        )
        expect(
          screen.getByTestId(
            "consultant-context-memory",
          ),
        ).toHaveTextContent(
          "Cliente nunca respondeu",
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

        render(
          <section className="gorila-material overflow-hidden backdrop-blur-xl">
            <OpportunityManualWhatsAppIntake
              opportunityId="journey-1"
              contactName="Janaina Rodrigues"
            />
          </section>,
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
        expect(
          screen.getByRole("button", {
            name: "Faz sentido",
          }),
        ).toBeVisible()
        const disagreeButton =
          screen.getByRole("button", {
            name: "Discordo",
          })
        expect(disagreeButton).toBeVisible()
        fireEvent.click(disagreeButton)
        expect(
          screen.getByRole("dialog"),
        ).toHaveTextContent("Onde o R2 errou?")
        const dialogRoot =
          document.querySelector(
            '[data-slot="dialog-root"]',
          )
        const overlay =
          document.querySelector(
            '[data-slot="dialog-overlay"]',
          )
        const dialogContent =
          document.querySelector(
            '[data-slot="dialog-content"]',
          )

        expect(dialogRoot?.parentElement).toBe(
          document.body,
        )
        expect(overlay?.parentElement).toBe(
          dialogRoot,
        )
        expect(dialogContent?.parentElement).toBe(
          dialogRoot,
        )
        expect(dialogContent).toHaveClass("z-10")
        await waitFor(() => {
          expect(fetchMock).toHaveBeenCalledOnce()
        })
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
          "/api/opportunities/journey-1/r2-intelligence",
        )
        expect(
          screen.getByText(
            /memória comercial salva/i,
          ),
        ).toBeInTheDocument()
        expect(fetchMock).not.toHaveBeenCalledWith(
          expect.stringContaining(
            "/conversation-memory",
          ),
          expect.anything(),
        )
      },
    )

    it(
      "mantém feedback visível no incidente de rejeição e submete discordância ao Safety",
      async () => {
        const incomingMessage =
          "Já falei que não quero, que merda."
        const serverAnalysis =
          analyzeManualWhatsAppMessage(
            incomingMessage,
            { approachType: "new" },
          )

        expect(serverAnalysis).toMatchObject({
          intent: "not_interested",
          stage: "closing",
          customerBoundary: {
            terminal: true,
          },
        })

        const intelligence = resolveR2Intelligence({
          recommendationId:
            "recommendation-rejection",
          workspaceId: "workspace-1",
          opportunityId: "journey-1",
          approachType: "new",
          analysis: serverAnalysis!,
          profile: {
            assetCategory: "real_estate",
          },
          candidates: [],
          commercialEvents: [],
        })

        fetchMock
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              analysis: serverAnalysis,
              reply:
                "Entendido. Desculpe pela insistência. Vou encerrar o contato por aqui.",
              intelligence,
            }),
          })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({
              status: "BLOCKED_BY_SAFETY",
              feedbackPersisted: true,
              feedbackId: "feedback-rejection",
              message:
                "A correção foi registrada, mas a boundary continua protegida pelo Safety.",
            }),
          })

        render(
          <OpportunityManualWhatsAppIntake
            opportunityId="journey-1"
            contactName="João"
          />,
        )
        fireEvent.change(
          screen.getByRole("textbox", {
            name: "Mensagem recebida do cliente",
          }),
          { target: { value: incomingMessage } },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Analisar mensagem",
          }),
        )

        expect(
          await screen.findByRole("button", {
            name: "Faz sentido",
          }),
        ).toBeVisible()
        fireEvent.click(
          screen.getByRole("button", {
            name: "Discordo",
          }),
        )
        fireEvent.change(
          screen.getByLabelText("Tipo do erro"),
          {
            target: {
              value: "WRONG_COMMERCIAL_STRATEGY",
            },
          },
        )
        fireEvent.change(
          screen.getByLabelText(
            "O que o R2 entendeu errado?",
          ),
          {
            target: {
              value:
                "Acho que ainda podemos insistir.",
            },
          },
        )
        fireEvent.change(
          screen.getByLabelText(
            "Qual seria o caminho correto?",
          ),
          {
            target: {
              value:
                "Pressionar mais uma vez e perguntar o motivo.",
            },
          },
        )
        fireEvent.click(
          screen.getByRole("button", {
            name: "Corrigir R2",
          }),
        )

        expect(await screen.findByText(
          "A correção foi registrada, mas a boundary continua protegida pelo Safety.",
        )).toBeVisible()
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(JSON.parse(
          fetchMock.mock.calls[1]?.[1]?.body as string,
        )).toMatchObject({
          action: "DISAGREE",
          recommendationId:
            "recommendation-rejection",
          correctPath:
            "Pressionar mais uma vez e perguntar o motivo.",
        })
      },
    )

    it(
      "bloqueia mensagem em conflito e exige correção humana antes de recalcular",
      async () => {
        const correctedContext =
          "Já conversei com o cliente, apresentei a estratégia de investimento e depois ele parou de responder."

        const serverAnalysis =
          analyzeManualWhatsAppMessage(
            correctedContext,
            {
              approachType:
                "reactivation",
            },
          )

        expect(
          serverAnalysis,
        ).not.toBeNull()

        const intelligence =
          resolveR2Intelligence({
            recommendationId:
              "recommendation-conflict-1",
            workspaceId:
              "workspace-1",
            opportunityId:
              "journey-1",
            approachType:
              "reactivation",
            analysis:
              serverAnalysis!,
            profile: {
              assetCategory:
                "real_estate",
            },
            candidates: [],
            commercialEvents: [],
            now: new Date(
              "2026-08-09T16:00:00.000Z",
            ),
          })

        fetchMock
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              reconciliation: {
                status:
                  "CONFLICT",
                reason:
                  "O histórico indica que já houve apresentação comercial, mas a nova observação pode ser interpretada como se o cliente nunca tivesse respondido.",
                savedContext:
                  "Já apresentei o produto e fiz duas propostas. Depois disso ele não me respondeu mais.",
                currentObservation:
                  "Ele não me respondeu.",
                proposedContext:
                  "contexto conflitante",
                effectiveContext:
                  null,
              },
              analysis: null,
              reply: null,
              intelligence: null,
              memorySaved: false,
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              reconciliation: {
                status:
                  "CONSISTENT",
                reason:
                  "Contexto confirmado pelo consultor.",
                savedContext:
                  "contexto anterior",
                currentObservation:
                  correctedContext,
                proposedContext:
                  correctedContext,
                effectiveContext:
                  correctedContext,
              },
              analysis:
                serverAnalysis,
              reply:
                "Resposta recalculada com contexto confirmado.",
              intelligence,
              memorySaved: true,
            }),
          })

        render(
          <OpportunityManualWhatsAppIntake
            opportunityId="journey-1"
            contactName="Laucione Lira"
            approachType="reactivation"
          />,
        )

        fireEvent.change(
          screen.getByRole(
            "textbox",
            {
              name:
                "Últimas mensagens ou resumo do histórico",
            },
          ),
          {
            target: {
              value:
                "Ele não me respondeu.",
            },
          },
        )

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Analisar contexto",
            },
          ),
        )

        const conflict =
          await screen.findByTestId(
            "r2-context-reconciliation",
          )

        expect(
          conflict,
        ).toHaveTextContent(
          "R2 precisa confirmar o contexto",
        )

        expect(
          conflict,
        ).toHaveTextContent(
          "Contexto que já estava salvo",
        )

        expect(
          conflict,
        ).toHaveTextContent(
          "Já apresentei o produto e fiz duas propostas",
        )

        expect(
          conflict,
        ).toHaveTextContent(
          "Nova observação que gerou dúvida",
        )

        expect(
          conflict,
        ).toHaveTextContent(
          "Ele não me respondeu.",
        )

        expect(
          screen.queryByRole(
            "textbox",
            {
              name:
                "Resposta preparada pelo R2",
            },
          ),
        ).not.toBeInTheDocument()

        const correction =
          screen.getByRole(
            "textbox",
            {
              name:
                "Correção / complemento do consultor",
            },
          )

        expect(
          correction,
        ).toHaveValue("")

        const confirmButton =
          screen.getByRole(
            "button",
            {
              name:
                "Confirmar contexto e recalcular",
            },
          )

        expect(
          confirmButton,
        ).toBeDisabled()

        fireEvent.change(
          correction,
          {
            target: {
              value:
                correctedContext,
            },
          },
        )

        expect(
          confirmButton,
        ).toBeEnabled()

        fireEvent.click(
          confirmButton,
        )

        expect(
          await screen.findByRole(
            "textbox",
            {
              name:
                "Resposta preparada pelo R2",
            },
          ),
        ).toHaveValue(
          "Resposta recalculada com contexto confirmado.",
        )

        await waitFor(() => {
          expect(
            fetchMock,
          ).toHaveBeenCalledTimes(2)
        })

        const secondRequest =
          fetchMock.mock
            .calls[1]?.[1] as
            | RequestInit
            | undefined

        expect(
          JSON.parse(
            String(
              secondRequest?.body,
            ),
          ),
        ).toMatchObject({
          incomingMessage:
            correctedContext,
          contextDecision:
            "CONFIRM_CONTEXT",
        })
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
