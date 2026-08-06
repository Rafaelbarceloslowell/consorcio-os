import {
  describe,
  expect,
  it,
} from "vitest"

import {
  analyzeManualWhatsAppMessage,
} from "./analyze-manual-whatsapp-message"

describe(
  "analyzeManualWhatsAppMessage",
  () => {
    it(
      "nao analisa conteudo vazio",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "   ",
          ),
        ).toBeNull()
      },
    )

    it(
      "entende quando o cliente nunca respondeu",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "O cliente nunca me respondeu.",
            {
              approachType:
                "reactivation",
            },
          ),
        ).toMatchObject({
          intent:
            "no_previous_response",
          stage:
            "opening",
          label:
            "Cliente ainda não respondeu",
          context: {
            customerResponseState:
              "never_replied",
          },
        })
      },
    )

    it(
      "entende resumo de reativacao sem confundir acao do consultor com resposta do cliente",
      () => {
        const analysis =
          analyzeManualWhatsAppMessage(
            "O cliente estava a procura de um automovel corola. Tentei marcar uma reunião, mas ele não respondeu mais. A última mensagem foi no dia 23/04/2026.",
            {
              approachType:
                "reactivation",
            },
          )

        expect(
          analysis,
        ).toMatchObject({
          intent:
            "stopped_replying",
          stage:
            "follow_up",
          label:
            "Conversa interrompida sem resposta",
          context: {
            customerInterest:
              "um Corolla",
            previousConsultantAction:
              "tentativa de agendar uma reunião",
            customerResponseState:
              "stopped_replying",
            lastContactDate:
              "23/04/2026",
          },
        })

        expect(
          analysis?.summary,
        ).toContain(
          "O cliente buscava um Corolla.",
        )

        expect(
          analysis?.summary,
        ).toContain(
          "O último movimento do consultor foi uma tentativa de agendar uma reunião.",
        )
      },
    )

    it(
      "analisa somente falas do cliente quando o contexto usa marcadores de papel",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Cliente: Ainda estou analisando o Corolla.\nConsultor: Podemos marcar uma reunião?",
            {
              approachType:
                "reactivation",
            },
          ),
        ).toMatchObject({
          intent:
            "interest_area",
          stage:
            "discovery",
        })
      },
    )

    it(
      "identifica falta de interesse com prioridade",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Nao tenho interesse agora, obrigado.",
          ),
        ).toMatchObject({
          intent:
            "not_interested",
          stage:
            "call_to_action",
        })
      },
    )

    it(
      "identifica pedido de retorno",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Agora nao posso, me chama depois.",
          ),
        ).toMatchObject({
          intent:
            "callback_requested",
          stage:
            "call_to_action",
        })
      },
    )

    it(
      "identifica abertura para reuniao",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Podemos conversar, pode me ligar amanha?",
          ),
        ).toMatchObject({
          intent:
            "meeting_interest",
          stage:
            "call_to_action",
        })
      },
    )

    it(
      "identifica duvida de valor como etapa de qualificacao",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "QUAL O PRECO E O VALOR DA PARCELA?",
          ),
        ).toMatchObject({
          intent:
            "pricing_question",
          stage:
            "qualification",
        })
      },
    )

    it(
      "identifica interesse explicito como descoberta",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Tenho interesse e quero entender como funciona.",
          ),
        ).toMatchObject({
          intent:
            "interested",
          stage:
            "discovery",
        })
      },
    )

    it(
      "reconhece que o projeto continua ativo e avanca para diagnostico",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Boa noite, meus planos continuam de pé.",
            {
              approachType:
                "reactivation",
            },
          ),
        ).toMatchObject({
          intent:
            "interested",
          stage:
            "diagnosis",
          label:
            "Projeto continua ativo",
          context: {
            projectActiveConfirmed:
              true,
          },
        })
      },
    )

    it(
      "preserva pedido de retorno mesmo com projeto ativo",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Meus planos continuam de pé, mas me chama depois.",
            {
              approachType:
                "reactivation",
            },
          ),
        ).toMatchObject({
          intent:
            "callback_requested",
          stage:
            "call_to_action",
        })
      },
    )

    it(
      "reconhece confirmacao curta somente na fala do cliente",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Consultor: O projeto ainda está de pé?\nCliente: Sim, continua.",
            {
              approachType:
                "reactivation",
            },
          ),
        ).toMatchObject({
          stage:
            "diagnosis",
          context: {
            projectActiveConfirmed:
              true,
          },
        })
      },
    )

    it(
      "identifica resposta sobre imovel como descoberta",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Estou pensando em comprar um imovel.",
          ),
        ).toMatchObject({
          intent:
            "interest_area",
          stage:
            "discovery",
        })
      },
    )

    it(
      "mantem leitura manual quando nao ha sinal claro",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Recebi sua mensagem.",
          ),
        ).toMatchObject({
          intent:
            "needs_review",
          stage:
            "opening",
        })
      },
    )

    it(
      "reconhece projeto ativo adiado por organizacao financeira sem repetir a qualificacao",
      () => {
        expect(
          analyzeManualWhatsAppMessage(
            "Consultor: como esta a correria.\n\nCliente: Cara ta uma correria ai, mas o planejamento do consórcio é algo que eu já estou fazendo faz tem, só preciso me organizar com as contas e o que eu tenho a pagar, a partir do ano que vem as coisas já vão ficar melhor então eu quero dar início a esse consórcio, valeu amigo abraço.",
            {
              approachType:
                "reactivation",
            },
          ),
        ).toMatchObject({
          intent:
            "interested",
          stage:
            "follow_up",
          label:
            "Projeto ativo com início adiado",
          context: {
            projectActiveConfirmed:
              true,
            projectTimingDeferred:
              true,
            projectTimingHint:
              "next_year",
          },
        })
      },
    )
  },
)
