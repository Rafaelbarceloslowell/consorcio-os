import {
  describe,
  expect,
  it,
} from "vitest"

import {
  analyzeManualWhatsAppMessage,
} from "./analyze-manual-whatsapp-message"

import {
  buildR2CommercialPlaybookRecommendation,
  formatR2CommercialTechnique,
  R2_COMMERCIAL_TECHNIQUE_LIBRARY,
} from "./build-r2-commercial-playbook-recommendation"

function build({
  message,
  approachType,
}: {
  message: string
  approachType:
    | "new"
    | "reactivation"
}) {
  const analysis =
    analyzeManualWhatsAppMessage(
      message,
      {
        approachType,
      },
    )

  if (!analysis) {
    throw new Error(
      "A análise era obrigatória para este teste.",
    )
  }

  return buildR2CommercialPlaybookRecommendation({
    approachType,
    analysis,
  })
}

describe(
  "R2 commercial playbook",
  () => {
    it(
      "mantem a biblioteca oficial completa e sem ids duplicados",
      () => {
        const ids =
          R2_COMMERCIAL_TECHNIQUE_LIBRARY.map(
            (technique) =>
              technique.id,
          )

        expect(
          new Set(ids).size,
        ).toBe(ids.length)

        expect(ids).toEqual(
          expect.arrayContaining([
            "seals_commercial_script",
            "rapport",
            "aida",
            "spin",
            "ethical_fomo",
            "objection_handling",
            "social_proof",
            "value_building",
            "price_anchoring",
            "next_step_closing",
            "diagnostic_selling",
            "gap_selling",
            "challenger_sale",
            "sandler_selling",
            "bant",
            "gpct",
            "storytelling",
            "three_options",
            "decision_maker_qualification",
            "cost_of_inaction",
            "consultative_closing",
          ]),
        )
      },
    )

    it(
      "usa SPIN e construção de valor quando o cliente pergunta preço",
      () => {
        const recommendation =
          build({
            message:
              "Qual o valor da parcela?",
            approachType:
              "new",
          })

        expect(recommendation).toMatchObject({
          foundation:
            "seals_commercial_script",
          primaryTechnique:
            "spin",
          closingTechnique:
            "next_step_closing",
          socialProof: {
            shouldAskConsultant:
              true,
          },
        })

        expect(
          recommendation.supportingTechniques,
        ).toEqual(
          expect.arrayContaining([
            "value_building",
            "price_anchoring",
            "social_proof",
          ]),
        )

        expect(
          recommendation.socialProof.prompt,
        ).toContain(
          "histórico da Seal’s",
        )

        expect(
          recommendation.socialProof.prompt,
        ).toContain(
          "real, semelhante e autorizado",
        )
      },
    )

    it(
      "reativa pelo contexto e limita o FOMO a consequência real",
      () => {
        const recommendation =
          build({
            message:
              "O cliente queria um Corolla, mas parou de responder.",
            approachType:
              "reactivation",
          })

        expect(recommendation).toMatchObject({
          primaryTechnique:
            "rapport",
          socialProof: {
            shouldAskConsultant:
              false,
          },
        })

        expect(
          recommendation.supportingTechniques,
        ).toEqual(
          expect.arrayContaining([
            "aida",
            "ethical_fomo",
            "cost_of_inaction",
          ]),
        )

        expect(
          recommendation.consultantInstruction,
        ).toContain(
          "consequência real confirmada",
        )
      },
    )

    it(
      "continua do ponto da estrategia quando cliente some apos apresentacao",
      () => {
        const recommendation =
          build({
            message:
              "O objetivo era investimento. Já apresentei o produto e fiz duas propostas com cartas de 500 mil. Depois disso ele não me respondeu mais.",
            approachType:
              "reactivation",
          })

        expect(
          recommendation,
        ).toMatchObject({
          primaryTechnique:
            "diagnostic_selling",
        })

        expect(
          recommendation.objective,
        ).toContain(
          "estratégia comercial apresentada",
        )

        expect(
          recommendation.avoid,
        ).toContain(
          "Voltar à descoberta do zero.",
        )

        expect(
          recommendation.avoid,
        ).toContain(
          "Perguntar novamente um objetivo já conhecido.",
        )
      },
    )

    it(
      "usa SPIN e GPCT quando o cliente confirma que o projeto continua ativo",
      () => {
        const recommendation =
          build({
            message:
              "Boa noite, meus planos continuam de pé.",
            approachType:
              "reactivation",
          })

        expect(recommendation).toMatchObject({
          primaryTechnique:
            "spin",
          objective:
            "Entender prazo, prioridade e cenário atual sem repetir a confirmação do projeto.",
        })

        expect(
          recommendation.supportingTechniques,
        ).toEqual(
          expect.arrayContaining([
            "rapport",
            "gpct",
            "diagnostic_selling",
          ]),
        )

        expect(
          recommendation.avoid,
        ).toContain(
          "Perguntar novamente se o projeto continua ativo.",
        )
      },
    )

    it(
      "não pressiona quando o cliente declara falta de interesse",
      () => {
        const recommendation =
          build({
            message:
              "Não tenho interesse.",
            approachType:
              "reactivation",
          })

        expect(recommendation).toMatchObject({
          primaryTechnique:
            "objection_handling",
        })

        expect(
          recommendation.supportingTechniques,
        ).not.toContain(
          "ethical_fomo",
        )

        expect(
          recommendation.avoid,
        ).toContain(
          "Pressionar.",
        )
      },
    )

    it(
      "explica objetivo e CTA ao tratar uma objeção específica",
      () => {
        const recommendation =
          build({
            message:
              "A parcela ficou alta para mim.",
            approachType:
              "new",
          })

        expect(recommendation).toMatchObject({
          primaryTechnique:
            "objection_handling",
          objective:
            "Compreender e tratar parcela alta sem perder o próximo passo comercial.",
          callToAction:
            "Faça uma pergunta de avanço ligada à objeção e combine o próximo passo somente depois da resposta.",
        })

        expect(
          recommendation.supportingTechniques,
        ).toEqual(
          expect.arrayContaining([
            "rapport",
            "diagnostic_selling",
            "consultative_closing",
          ]),
        )

        expect(
          recommendation.avoid,
        ).toEqual(
          expect.arrayContaining([
            "Inventar taxa, lance, prazo ou regra de administradora.",
            "Garantir contemplação ou aprovação.",
            "Usar prova social sem caso real e autorizado.",
          ]),
        )
      },
    )

    it(
      "não finge continuidade quando o cliente nunca respondeu",
      () => {
        const recommendation =
          build({
            message:
              "O cliente nunca me respondeu.",
            approachType:
              "reactivation",
          })

        expect(recommendation).toMatchObject({
          primaryTechnique:
            "aida",
        })

        expect(
          recommendation.avoid,
        ).toContain(
          "Fingir que já existiu conversa.",
        )
      },
    )

    it(
      "formata os nomes exibidos ao consultor",
      () => {
        expect(
          formatR2CommercialTechnique(
            "seals_commercial_script",
          ),
        ).toBe(
          "Script Comercial da Seal’s",
        )

        expect(
          formatR2CommercialTechnique(
            "ethical_fomo",
          ),
        ).toBe(
          "FOMO ético",
        )
      },
    )

    it(
      "trata organizacao financeira como projeto ativo adiado e nao como contexto incompleto",
      () => {
        const recommendation =
          build({
            message:
              "Consultor: como esta a correria.\n\nCliente: Cara ta uma correria ai, mas o planejamento do consórcio é algo que eu já estou fazendo faz tem, só preciso me organizar com as contas e o que eu tenho a pagar, a partir do ano que vem as coisas já vão ficar melhor então eu quero dar início a esse consórcio, valeu amigo abraço.",
            approachType:
              "reactivation",
          })

        expect(recommendation).toMatchObject({
          primaryTechnique:
            "rapport",
          objective:
            "Entender o horizonte de organização financeira e combinar acompanhamento com permissão.",
        })

        expect(
          recommendation.supportingTechniques,
        ).toEqual(
          expect.arrayContaining([
            "spin",
            "gpct",
            "diagnostic_selling",
            "consultative_closing",
          ]),
        )

        expect(
          recommendation.avoid,
        ).toContain(
          "Perguntar novamente se o projeto continua ativo.",
        )
      },
    )

    it(
      "expõe metadados auditáveis para todas as técnicas",
      () => {
        for (
          const technique of
          R2_COMMERCIAL_TECHNIQUE_LIBRARY
        ) {
          expect(
            technique.appropriateStages.length,
          ).toBeGreaterThan(0)
          expect(
            technique.appropriateIntents.length,
          ).toBeGreaterThan(0)
          expect(
            technique.prerequisites.length,
          ).toBeGreaterThan(0)
          expect(
            technique.supportingSignals.length,
          ).toBeGreaterThan(0)
          expect(
            technique.avoidWhen.length,
          ).toBeGreaterThan(0)
          expect(
            ["LOW", "MEDIUM", "HIGH"],
          ).toContain(
            technique.riskLevel,
          )
          expect(
            technique.customerGoal,
          ).not.toBe("")
          expect(
            technique.commercialGoal,
          ).not.toBe("")
        }
      },
    )

    it(
      "entrega contrato estruturado e explicável sem chain of thought",
      () => {
        const recommendation =
          build({
            message:
              "Qual o valor da parcela?",
            approachType:
              "new",
          })

        expect(
          recommendation,
        ).toMatchObject({
          stage: "qualification",
          intent: "pricing_question",
          strategy:
            recommendation.objective,
          recommendedAction:
            recommendation.consultantInstruction,
          suggestedArgument:
            recommendation.rationale,
          suggestedNextStep:
            recommendation.callToAction,
          socialProofRequirement:
            recommendation.socialProof,
          riskWarnings:
            recommendation.avoid,
          reasoningSummary:
            recommendation.rationale,
          requiresRecentContext:
            false,
        })
      },
    )

    it(
      "bloqueia reativação sem contexto recente",
      () => {
        const recommendation =
          build({
            message: "Oi",
            approachType:
              "reactivation",
          })

        expect(
          recommendation,
        ).toMatchObject({
          intent: "needs_review",
          requiresRecentContext:
            true,
          suggestedNextStep:
            "Obter contexto recente; não produzir mensagem ao cliente ainda.",
        })
        expect(
          recommendation.recommendedAction,
        ).toContain(
          "últimas mensagens",
        )
      },
    )
  },
)
