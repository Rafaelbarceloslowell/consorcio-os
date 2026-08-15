import { describe, expect, it } from "vitest"

import { buildR2ActionContext, type BuildR2ActionContextInput } from "./r2-action-context"

const baseInput: BuildR2ActionContextInput = {
  actionId: "task-1",
  opportunityId: "opportunity-1",
  personName: "Ana Martins",
  phaseName: "Aquisi\u00e7\u00e3o",
  stateName: "Lead ativo",
  taskTitle: "Revisar oportunidade sem pr\u00f3xima a\u00e7\u00e3o",
  taskDescription: "Oportunidade ativa sem atividade pendente, compromisso futuro ou espera expl\u00edcita v\u00e1lida.",
  taskReason: "Invariant STALE_OPPORTUNITY detectado.",
  r2Recommendation: "Confirmar o pr\u00f3ximo passo comercial.",
  lastRelevantInteraction: "Quero entender melhor o valor da parcela.",
  lastInteractionAt: "2026-08-15T12:00:00.000Z",
  priority: "HIGH",
  actionType: "R2_REVIEW",
  href: "/opportunities/opportunity-1#r2-action-controls",
}

describe("buildR2ActionContext", () => {
  it("monta o contexto completo com pessoa, oportunidade, raz\u00e3o e deep link reais", () => {
    const result = buildR2ActionContext(baseInput)

    expect(result).toMatchObject({
      actionId: "task-1",
      opportunityId: "opportunity-1",
      personName: "Ana Martins",
      contextLabel: "Aquisi\u00e7\u00e3o \u00b7 Lead ativo",
      actionTitle: "Ana Martins est\u00e1 sem pr\u00f3xima a\u00e7\u00e3o",
      actionReason: baseInput.taskDescription,
      whyNow: "A oportunidade est\u00e1 ativa e n\u00e3o possui atividade pendente, compromisso futuro ou espera expl\u00edcita v\u00e1lida.",
      lastRelevantInteraction: "Quero entender melhor o valor da parcela.",
      r2Recommendation: "Confirmar o pr\u00f3ximo passo comercial.",
      href: "/opportunities/opportunity-1#r2-action-controls",
    })
  })

  it("omite a intera\u00e7\u00e3o ausente em vez de inventar conte\u00fado", () => {
    const result = buildR2ActionContext({
      ...baseInput,
      lastRelevantInteraction: null,
      lastInteractionAt: null,
    })

    expect(result.lastRelevantInteraction).toBeUndefined()
    expect(result.lastInteractionAt).toBeUndefined()
    expect(JSON.stringify(result)).not.toMatch(/respondeu h\u00e1|cliente disse/iu)
  })

  it("usa orienta\u00e7\u00e3o operacional segura quando n\u00e3o existe NBA", () => {
    const result = buildR2ActionContext({ ...baseInput, r2Recommendation: null })

    expect(result.r2Recommendation).toBe("Defina o pr\u00f3ximo passo comercial e registre o resultado no GorillaOS.")
  })

  it.each([
    ["RESPONSE_CHECK", "Verifique se Ana Martins respondeu ao contato", "Verifique se houve resposta antes de avan\u00e7ar a cad\u00eancia."],
    ["CALLBACK", "Voc\u00ea prometeu retornar para Ana Martins", "Fa\u00e7a o retorno combinado e registre o resultado."],
    ["MEETING_OUTCOME_CHECK", "A reuni\u00e3o de Ana Martins est\u00e1 sem follow-up", "Registre o resultado da reuni\u00e3o e defina o follow-up adequado."],
    ["PROPOSAL_FOLLOW_UP", "A proposta de Ana Martins precisa de acompanhamento", "Revise a proposta e confirme o pr\u00f3ximo passo com o cliente."],
    ["NEW_LEAD_FIRST_CONTACT", "Ana Martins aguarda o primeiro contato", "Fa\u00e7a o primeiro contato e registre o resultado."],
  ])("explica a a\u00e7\u00e3o %s sem alterar a prioridade", (actionType, title, recommendation) => {
    const result = buildR2ActionContext({
      ...baseInput,
      actionType,
      r2Recommendation: null,
    })

    expect(result.actionTitle).toBe(title)
    expect(result.r2Recommendation).toBe(recommendation)
    expect(result.priority).toBe("HIGH")
  })

  it("n\u00e3o afirma que houve resposta quando a tarefa apenas pede verifica\u00e7\u00e3o", () => {
    const result = buildR2ActionContext({
      ...baseInput,
      actionType: "RESPONSE_CHECK",
      taskDescription: null,
      taskReason: null,
      r2Recommendation: null,
      lastRelevantInteraction: null,
    })

    expect(result.actionTitle).toMatch(/^Verifique se/)
    expect(result.actionTitle).not.toBe("Ana Martins respondeu sua mensagem")
  })
})
