import {
  describe,
  expect,
  it,
} from "vitest"

import {
  analyzeManualWhatsAppMessage,
} from "./analyze-manual-whatsapp-message"

import {
  buildManualWhatsAppReply,
} from "./build-manual-whatsapp-reply"

function build({
  message,
  approachType,
  contactName =
    "Janaina Rodrigues",
}: {
  message: string
  approachType:
    | "new"
    | "reactivation"
  contactName?: string
}): string | null {
  return buildManualWhatsAppReply({
    contactName,
    incomingMessage:
      message,
    approachType,
    analysis:
      analyzeManualWhatsAppMessage(
        message,
        {
          approachType,
        },
      ),
  })
}

describe(
  "buildManualWhatsAppReply",
  () => {
    it(
      "nao cria resposta sem mensagem",
      () => {
        expect(
          build({
            message: "   ",
            approachType:
              "new",
          }),
        ).toBeNull()
      },
    )

    it(
      "prepara nova abertura quando o cliente nunca respondeu",
      () => {
        expect(
          build({
            message:
              "O cliente nunca me respondeu.",
            approachType:
              "reactivation",
          }),
        ).toBe(
          "Oi, Janaina, tudo bem? Tentei falar com você há um tempo, mas ainda não conseguimos conversar. Hoje você está buscando imóvel, veículo ou quer entender o consórcio como investimento?",
        )
      },
    )

    it(
      "usa interesse conhecido mesmo quando o cliente nunca respondeu",
      () => {
        expect(
          build({
            message:
              "O cliente queria um Corolla, mas nunca me respondeu.",
            approachType:
              "reactivation",
          }),
        ).toBe(
          "Oi, Janaina, tudo bem? Vi que você tinha interesse em um Corolla, mas ainda não conseguimos conversar. Esse projeto continua nos seus planos?",
        )
      },
    )

    it(
      "retoma pelo Corolla e pela data sem pular direto para uma reuniao",
      () => {
        expect(
          build({
            message:
              "O cliente estava a procura de um automovel corola. Tentei marcar uma reunião, mas ele não respondeu mais. A última mensagem foi no dia 23/04/2026.",
            approachType:
              "reactivation",
          }),
        ).toBe(
          "Oi, Janaina, tudo bem? Quando conversamos em 23/04/2026, você estava buscando um Corolla. Esse projeto ainda está de pé ou seus planos mudaram desde então?",
        )
      },
    )

    it(
      "continua o fluxo Seals quando o novo lead responde imovel",
      () => {
        expect(
          build({
            message:
              "Estou pensando em comprar um imovel.",
            approachType:
              "new",
          }),
        ).toBe(
          "Legal, Janaina. Esse imóvel seria para morar, investir ou você já tem algo específico em mente?",
        )
      },
    )

    it(
      "continua a reativacao atualizando o contexto",
      () => {
        expect(
          build({
            message:
              "Ainda estou estudando as possibilidades.",
            approachType:
              "reactivation",
          }),
        ).toBe(
          "Entendi, Janaina. Mudou alguma coisa desde a nossa última conversa ou o objetivo continua o mesmo?",
        )
      },
    )

    it(
      "reconhece projeto ativo, capitaliza o nome e avanca para prazo",
      () => {
        const reply =
          build({
            message:
              "Boa noite, meus planos continuam de pé.",
            approachType:
              "reactivation",
            contactName:
              "alex",
          })

        expect(reply).toBe(
          "Perfeito, Alex. Que bom que o projeto continua de pé. Você já tem uma previsão de quando pretende realizá-lo?",
        )

        expect(reply).not.toContain(
          "esse projeto ainda está de pé",
        )
      },
    )

    it(
      "prepara confirmacao de horario para retorno",
      () => {
        expect(
          build({
            message:
              "Me chama depois.",
            approachType:
              "new",
          }),
        ).toBe(
          "Claro, Janaina. Qual dia e horário ficam melhores para eu retornar sem atrapalhar sua rotina?",
        )
      },
    )

    it(
      "respeita falta de interesse sem pressionar",
      () => {
        expect(
          build({
            message:
              "Nao tenho interesse.",
            approachType:
              "reactivation",
          }),
        ).toContain(
          "respeitar seu momento",
        )
      },
    )

    it(
      "acolhe parcela alta e busca uma faixa confortável",
      () => {
        expect(
          build({
            message:
              "A parcela ficou alta para mim.",
            approachType:
              "new",
          }),
        ).toBe(
          "Entendo, Janaina. Para ajustarmos sem forçar seu orçamento, qual faixa de parcela ficaria confortável hoje?",
        )
      },
    )

    it(
      "não promete contemplação ao tratar esse receio",
      () => {
        const reply = build({
          message:
            "Tenho medo de não contemplar.",
          approachType:
            "new",
        })

        expect(reply).toContain(
          "não existe garantia de data de contemplação",
        )
        expect(reply).toContain(
          "qual prazo seu projeto consegue suportar?",
        )
      },
    )

    it(
      "investiga falta de confiança sem inventar prova social",
      () => {
        const reply = build({
          message:
            "Não confio em consórcio.",
          approachType:
            "reactivation",
        })

        expect(reply).toBe(
          "Sua segurança vem primeiro, Janaina. Qual ponto do consórcio você gostaria de validar antes de continuar?",
        )
        expect(reply).not.toMatch(
          /cliente|contemplado|resultado garantido/iu,
        )
      },
    )

    it(
      "evita passar preco isolado",
      () => {
        expect(
          build({
            message:
              "Qual o valor da parcela?",
            approachType:
              "new",
          }),
        ).toContain(
          "qual valor você pretende alcançar",
        )
      },
    )

    it(
      "nao usa resposta generica quando a reativacao exige atualizacao",
      () => {
        expect(
          build({
            message:
              "Recebi sua mensagem.",
            approachType:
              "reactivation",
          }),
        ).toBe(
          "Obrigado por me responder, Janaina. Só para eu me atualizar: esse projeto ainda está de pé ou seus planos mudaram desde a última vez?",
        )
      },
    )

    it(
      "reconhece projeto ativo adiado e combina acompanhamento sem perguntar se ainda esta de pe",
      () => {
        const reply =
          build({
            message:
              "Consultor: como esta a correria.\n\nCliente: Cara ta uma correria ai, mas o planejamento do consórcio é algo que eu já estou fazendo faz tem, só preciso me organizar com as contas e o que eu tenho a pagar, a partir do ano que vem as coisas já vão ficar melhor então eu quero dar início a esse consórcio, valeu amigo abraço.",
            approachType:
              "reactivation",
            contactName:
              "alex",
          })

        expect(reply).toBe(
          "Entendi, Alex. Faz sentido organizar as contas primeiro. Como você acredita que a partir do ano que vem estará mais tranquilo, posso te chamar no começo do ano para vermos como está?",
        )

        expect(reply).not.toContain(
          "ainda está de pé",
        )
      },
    )
  },
)
