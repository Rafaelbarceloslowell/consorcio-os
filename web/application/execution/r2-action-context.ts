import type { R2ActionContext } from "@/types/dashboard"

const ACTION_TITLES: Readonly<Record<string, (personName: string) => string>> = {
  R2_REVIEW: (personName) => `${personName} est\u00e1 sem pr\u00f3xima a\u00e7\u00e3o`,
  RESPONSE_CHECK: (personName) => `Verifique se ${personName} respondeu ao contato`,
  CALLBACK: (personName) => `Voc\u00ea prometeu retornar para ${personName}`,
  CALLBACK_RECOVERY: (personName) => `O retorno para ${personName} precisa ser recuperado`,
  MEETING_PREP: (personName) => `Prepare a reuni\u00e3o com ${personName}`,
  MEETING_START: (personName) => `A reuni\u00e3o com ${personName} est\u00e1 pronta para come\u00e7ar`,
  MEETING_OUTCOME_CHECK: (personName) => `A reuni\u00e3o de ${personName} est\u00e1 sem follow-up`,
  NO_SHOW_RECOVERY: (personName) => `Retome o contato com ${personName} ap\u00f3s o no-show`,
  PROPOSAL_FOLLOW_UP: (personName) => `A proposta de ${personName} precisa de acompanhamento`,
  NEW_LEAD_FIRST_CONTACT: (personName) => `${personName} aguarda o primeiro contato`,
  STRATEGIC_FOLLOW_UP: (personName) => `${personName} est\u00e1 no momento do follow-up`,
  REACTIVATION_CONTEXT_REQUIRED: (personName) => `O contexto recente de ${personName} precisa ser informado`,
  REACTIVATION_CONTACT: (personName) => `A retomada com ${personName} est\u00e1 pronta`,
  CADENCE_WHATSAPP: (personName) => `${personName} tem um contato de WhatsApp na cad\u00eancia`,
  CADENCE_CALL: (personName) => `${personName} tem uma liga\u00e7\u00e3o na cad\u00eancia`,
}

const WHY_NOW: Readonly<Record<string, string>> = {
  R2_REVIEW: "A oportunidade est\u00e1 ativa e n\u00e3o possui atividade pendente, compromisso futuro ou espera expl\u00edcita v\u00e1lida.",
  RESPONSE_CHECK: "A janela de verifica\u00e7\u00e3o definida pela cad\u00eancia chegou; confirme o estado da conversa antes de avan\u00e7ar.",
  CALLBACK: "O hor\u00e1rio registrado para o retorno chegou.",
  CALLBACK_RECOVERY: "O retorno registrado ficou pendente e entrou no fluxo de recupera\u00e7\u00e3o.",
  MEETING_PREP: "A prepara\u00e7\u00e3o est\u00e1 prevista antes da reuni\u00e3o agendada.",
  MEETING_START: "O hor\u00e1rio registrado para a reuni\u00e3o chegou.",
  MEETING_OUTCOME_CHECK: "A reuni\u00e3o terminou e o resultado comercial ainda precisa ser registrado.",
  NO_SHOW_RECOVERY: "O no-show registrado abriu uma a\u00e7\u00e3o de recupera\u00e7\u00e3o.",
  PROPOSAL_FOLLOW_UP: "O acompanhamento previsto para a proposta chegou.",
  NEW_LEAD_FIRST_CONTACT: "O lead novo ainda n\u00e3o possui primeiro atendimento registrado.",
  STRATEGIC_FOLLOW_UP: "O acompanhamento chegou ao momento definido pela opera\u00e7\u00e3o.",
  REACTIVATION_CONTEXT_REQUIRED: "O R2 n\u00e3o deve preparar uma retomada sem entender onde a conversa parou.",
  REACTIVATION_CONTACT: "O contexto da retomada foi validado e a a\u00e7\u00e3o est\u00e1 dispon\u00edvel.",
  CADENCE_WHATSAPP: "Este impacto est\u00e1 dispon\u00edvel conforme a cad\u00eancia atual.",
  CADENCE_CALL: "Este impacto est\u00e1 dispon\u00edvel conforme a cad\u00eancia atual.",
}

const RECOMMENDATION_FALLBACKS: Readonly<Record<string, string>> = {
  R2_REVIEW: "Defina o pr\u00f3ximo passo comercial e registre o resultado no GorillaOS.",
  RESPONSE_CHECK: "Verifique se houve resposta antes de avan\u00e7ar a cad\u00eancia.",
  CALLBACK: "Fa\u00e7a o retorno combinado e registre o resultado.",
  CALLBACK_RECOVERY: "Retome o compromisso com contexto e registre o novo pr\u00f3ximo passo.",
  MEETING_PREP: "Revise o contexto da oportunidade antes da reuni\u00e3o.",
  MEETING_START: "Abra a oportunidade e conduza a reuni\u00e3o com o contexto registrado.",
  MEETING_OUTCOME_CHECK: "Registre o resultado da reuni\u00e3o e defina o follow-up adequado.",
  NO_SHOW_RECOVERY: "Retome o contato sem presumir o motivo da aus\u00eancia.",
  PROPOSAL_FOLLOW_UP: "Revise a proposta e confirme o pr\u00f3ximo passo com o cliente.",
  NEW_LEAD_FIRST_CONTACT: "Fa\u00e7a o primeiro contato e registre o resultado.",
  STRATEGIC_FOLLOW_UP: "Continue o acompanhamento a partir do contexto registrado.",
  REACTIVATION_CONTEXT_REQUIRED: "Informe as mensagens recentes antes de preparar uma nova abordagem.",
  REACTIVATION_CONTACT: "Revise a retomada preparada pelo R2 antes de envi\u00e1-la.",
  CADENCE_WHATSAPP: "Execute o contato previsto e registre o resultado.",
  CADENCE_CALL: "Execute a liga\u00e7\u00e3o prevista e registre o resultado.",
}

function concise(value: string | null | undefined, maximum = 180): string | undefined {
  const normalized = value?.replace(/\s+/gu, " ").trim()
  if (!normalized) return undefined
  if (normalized.length <= maximum) return normalized
  return `${normalized.slice(0, maximum - 1).trimEnd()}\u2026`
}

function usefulReason(description: string | null | undefined, reason: string | null | undefined): string | undefined {
  const normalizedReason = concise(reason)
  if (normalizedReason && !/^invariant\b/iu.test(normalizedReason)) return normalizedReason
  return concise(description)
}

export type BuildR2ActionContextInput = Readonly<{
  actionId: string
  opportunityId: string
  personName: string
  phaseName?: string | null
  stateName?: string | null
  taskTitle: string
  specificActionTitle?: string | null
  taskDescription?: string | null
  taskReason?: string | null
  r2Recommendation?: string | null
  lastRelevantInteraction?: string | null
  lastInteractionAt?: string | Date | null
  priority: string
  actionType?: string | null
  href: string
}>

export function buildR2ActionContext(input: BuildR2ActionContextInput): R2ActionContext {
  const actionType = input.actionType ?? "UNSPECIFIED"
  const contextParts = [input.phaseName, input.stateName].filter((value): value is string => Boolean(value?.trim()))
  const reason = usefulReason(input.taskDescription, input.taskReason)
  const recommendation = concise(input.r2Recommendation)
    ?? RECOMMENDATION_FALLBACKS[actionType]
    ?? concise(input.taskTitle)
    ?? "Abra a oportunidade e revise o pr\u00f3ximo passo registrado."

  return {
    actionId: input.actionId,
    opportunityId: input.opportunityId,
    personName: input.personName,
    contextLabel: contextParts.join(" \u00b7 ") || "Oportunidade ativa",
    actionTitle: concise(input.specificActionTitle)
      ?? ACTION_TITLES[actionType]?.(input.personName)
      ?? `${input.personName} \u00b7 ${input.taskTitle}`,
    actionReason: reason ?? `A a\u00e7\u00e3o \u201c${input.taskTitle}\u201d est\u00e1 registrada nesta oportunidade.`,
    whyNow: WHY_NOW[actionType] ?? "A a\u00e7\u00e3o est\u00e1 dispon\u00edvel conforme a prioridade j\u00e1 definida pela opera\u00e7\u00e3o.",
    lastRelevantInteraction: concise(input.lastRelevantInteraction),
    lastInteractionAt: input.lastInteractionAt instanceof Date
      ? input.lastInteractionAt.toISOString()
      : input.lastInteractionAt ?? undefined,
    r2Recommendation: recommendation,
    priority: input.priority,
    actionType,
    href: input.href,
  }
}
