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
  },
)