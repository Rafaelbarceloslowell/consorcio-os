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
}: {
  message: string
  approachType:
    | "new"
    | "reactivation"
}): string | null {
  return buildManualWhatsAppReply({
    contactName:
      "Janaina Rodrigues",
    incomingMessage:
      message,
    approachType,
    analysis:
      analyzeManualWhatsAppMessage(
        message,
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
  },
)