import type {
  R2DomainEvent,
  R2IntelligencePort,
  R2IntelligenceRequest,
  R2IntelligenceResult,
  R2PresentationHints,
  R2Recommendation,
  R2Urgency,
} from "@/types/r2-intelligence-orchestration"

type ReactionDefinition = Readonly<{
  state: R2PresentationHints["runtimeState"]
  title: string
  summary: string
  rationale: string
  expression?: R2PresentationHints["expression"]
  expressionIntensity?: number
  durationMs: number
  minimumDisplayMs: number
  fallbackState?: R2PresentationHints["fallbackState"]
}>

const REACTIONS: Readonly<Partial<Record<R2DomainEvent["eventType"], ReactionDefinition>>> = {
  "lead.received": { state: "working", title: "Novo lead recebido", summary: "Um novo lead entrou na operaÃ§Ã£o.", rationale: "O evento confirmado requer acompanhamento discreto.", durationMs: 4000, minimumDisplayMs: 900 },
  "lead.created": { state: "working", title: "Lead registrado", summary: "Um lead foi registrado e estÃ¡ pronto para acompanhamento.", rationale: "O cadastro confirmado inicia o acompanhamento comercial.", durationMs: 4000, minimumDisplayMs: 900 },
  "lead.replied": { state: "listening", title: "Resposta recebida", summary: "O lead respondeu e o contexto pode ser analisado.", rationale: "Uma resposta confirmada merece atenÃ§Ã£o sem presumir intenÃ§Ã£o.", durationMs: 5000, minimumDisplayMs: 1200 },
  "lead.action_required": { state: "awaiting_action", title: "AÃ§Ã£o necessÃ¡ria", summary: "HÃ¡ uma aÃ§Ã£o pendente para este lead.", rationale: "O evento solicita decisÃ£o humana explÃ­cita.", durationMs: 7000, minimumDisplayMs: 1800 },
  "lead.at_risk": { state: "alert", title: "Lead em risco", summary: "Um lead confirmado apresenta risco de perda.", rationale: "O risco registrado justifica atenÃ§Ã£o elevada.", expression: "BROW_RAISE", expressionIntensity: 0.2, durationMs: 7000, minimumDisplayMs: 1600 },
  "opportunity.stage_changed": { state: "thinking", title: "Etapa atualizada", summary: "A oportunidade avanÃ§ou ou mudou de etapa.", rationale: "A mudanÃ§a confirmada requer reavaliaÃ§Ã£o do prÃ³ximo passo.", durationMs: 4500, minimumDisplayMs: 1000 },
  "opportunity.stagnant": { state: "awaiting_action", title: "Oportunidade estagnada", summary: "Uma oportunidade estÃ¡ sem avanÃ§o e requer revisÃ£o.", rationale: "A estagnaÃ§Ã£o registrada demanda uma prÃ³xima aÃ§Ã£o.", durationMs: 7000, minimumDisplayMs: 1800 },
  "opportunity.at_risk": { state: "alert", title: "Oportunidade em risco", summary: "Uma oportunidade requer atenÃ§Ã£o prioritÃ¡ria.", rationale: "O risco confirmado pode comprometer o avanÃ§o comercial.", durationMs: 7000, minimumDisplayMs: 1600 },
  "meeting.scheduled": { state: "listening", title: "ReuniÃ£o agendada", summary: "Uma reuniÃ£o foi agendada.", rationale: "O compromisso confirmado deve entrar no radar sem interromper alertas.", durationMs: 4500, minimumDisplayMs: 1000 },
  "meeting.upcoming": { state: "alert", title: "ReuniÃ£o prÃ³xima", summary: "Uma reuniÃ£o confirmada estÃ¡ prÃ³xima.", rationale: "A proximidade do compromisso requer atenÃ§Ã£o controlada.", expression: "BROW_RAISE", expressionIntensity: 0.18, durationMs: 6500, minimumDisplayMs: 1500 },
  "meeting.completed": { state: "working", title: "ReuniÃ£o concluÃ­da", summary: "A reuniÃ£o foi concluÃ­da e o acompanhamento pode continuar.", rationale: "O fato concluÃ­do permite organizar os prÃ³ximos passos.", durationMs: 4000, minimumDisplayMs: 900 },
  "meeting.summary_missing": { state: "awaiting_action", title: "Resumo pendente", summary: "Uma reuniÃ£o concluÃ­da ainda nÃ£o possui resumo.", rationale: "O contexto ausente exige aÃ§Ã£o antes de novas recomendaÃ§Ãµes.", durationMs: 7000, minimumDisplayMs: 1600 },
  "proposal.sent": { state: "working", title: "Proposta enviada", summary: "A proposta foi enviada e estÃ¡ em acompanhamento.", rationale: "O envio confirmado nÃ£o implica aprovaÃ§Ã£o e deve ser monitorado.", durationMs: 4500, minimumDisplayMs: 1000 },
  "proposal.accepted": { state: "awaiting_action", title: "Proposta aceita", summary: "A proposta foi aceita; valide os prÃ³ximos passos autorizados.", rationale: "AceitaÃ§Ã£o nÃ£o equivale Ã  conclusÃ£o da venda e requer continuidade controlada.", durationMs: 7500, minimumDisplayMs: 1800 },
  "sale.documentation_requested": { state: "awaiting_action", title: "DocumentaÃ§Ã£o solicitada", summary: "A venda aguarda documentaÃ§Ã£o confirmada.", rationale: "A pendÃªncia documental exige acompanhamento humano.", durationMs: 7000, minimumDisplayMs: 1600 },
  "sale.completed": { state: "celebrating_sale", title: "Venda concluÃ­da", summary: "A venda foi concluÃ­da.", rationale: "O evento comercial confirmado permite uma celebraÃ§Ã£o breve e controlada.", expression: "SMILE", expressionIntensity: 0.7, durationMs: 6000, minimumDisplayMs: 1800 },
  "sale.celebration_ready": { state: "celebrating_sale", title: "Venda comemorÃ¡vel", summary: "Uma venda confirmada estÃ¡ pronta para celebraÃ§Ã£o.", rationale: "A confirmaÃ§Ã£o explÃ­cita permite uma reaÃ§Ã£o positiva controlada.", expression: "SMILE", expressionIntensity: 0.7, durationMs: 6000, minimumDisplayMs: 1800 },
  "task.created": { state: "working", title: "Tarefa criada", summary: "Uma nova tarefa entrou na operaÃ§Ã£o.", rationale: "A tarefa confirmada deve ser acompanhada sem interrupÃ§Ã£o excessiva.", durationMs: 3500, minimumDisplayMs: 800 },
  "task.due_soon": { state: "awaiting_action", title: "Prazo prÃ³ximo", summary: "Uma tarefa estÃ¡ prÃ³xima do vencimento.", rationale: "O prazo exige decisÃ£o ou execuÃ§Ã£o do usuÃ¡rio.", durationMs: 6500, minimumDisplayMs: 1500 },
  "task.overdue": { state: "alert", title: "Tarefa vencida", summary: "Uma tarefa confirmada estÃ¡ vencida.", rationale: "O atraso requer atenÃ§Ã£o elevada.", durationMs: 7000, minimumDisplayMs: 1600 },
  "automation.started": { state: "working", title: "AutomaÃ§Ã£o iniciada", summary: "Uma automaÃ§Ã£o iniciou seu processamento.", rationale: "O processamento confirmado deve permanecer discreto.", durationMs: 3500, minimumDisplayMs: 700 },
  "automation.failed": { state: "error_attention", title: "Falha de automaÃ§Ã£o", summary: "Uma automaÃ§Ã£o falhou e requer verificaÃ§Ã£o.", rationale: "A falha confirmada tem precedÃªncia sobre estados normais.", expression: "BROW_FROWN", expressionIntensity: 0.45, durationMs: 8000, minimumDisplayMs: 1800 },
  "workflow.blocked": { state: "error_attention", title: "Workflow bloqueado", summary: "Um workflow estÃ¡ bloqueado.", rationale: "O bloqueio confirmado impede continuidade automÃ¡tica.", expression: "BROW_FROWN", expressionIntensity: 0.4, durationMs: 8000, minimumDisplayMs: 1800 },
  "queue.failed": { state: "error_attention", title: "Falha na fila", summary: "A fila operacional apresentou falha.", rationale: "A falha confirmada exige atenÃ§Ã£o tÃ©cnica.", expression: "BROW_FROWN", expressionIntensity: 0.45, durationMs: 8000, minimumDisplayMs: 1800 },
  "integration.unavailable": { state: "error_attention", title: "IntegraÃ§Ã£o indisponÃ­vel", summary: "Uma integraÃ§Ã£o necessÃ¡ria estÃ¡ indisponÃ­vel.", rationale: "A indisponibilidade confirmada pode interromper o fluxo.", expression: "BROW_FROWN", expressionIntensity: 0.4, durationMs: 8000, minimumDisplayMs: 1800 },
  "intelligence.analysis_started": { state: "thinking", title: "AnÃ¡lise em andamento", summary: "O R2 estÃ¡ analisando o contexto disponÃ­vel.", rationale: "A anÃ¡lise confirmada deve ser representada sem sugerir conclusÃ£o.", durationMs: 5000, minimumDisplayMs: 1000 },
  "intelligence.recommendation_ready": { state: "awaiting_action", title: "RecomendaÃ§Ã£o pronta", summary: "Uma recomendaÃ§Ã£o estruturada estÃ¡ pronta para revisÃ£o.", rationale: "A decisÃ£o final permanece com o usuÃ¡rio.", durationMs: 8000, minimumDisplayMs: 1800 },
  "intelligence.next_best_action_ready": { state: "awaiting_action", title: "PrÃ³xima aÃ§Ã£o pronta", summary: "Uma prÃ³xima melhor aÃ§Ã£o estÃ¡ pronta para revisÃ£o.", rationale: "A recomendaÃ§Ã£o organiza prioridade sem executar mutaÃ§Ãµes.", durationMs: 8000, minimumDisplayMs: 1800 },
  "intelligence.confirmation_required": { state: "awaiting_action", title: "ConfirmaÃ§Ã£o necessÃ¡ria", summary: "A continuidade depende de confirmaÃ§Ã£o explÃ­cita.", rationale: "Nenhuma aÃ§Ã£o externa deve ocorrer sem autorizaÃ§Ã£o.", durationMs: 9000, minimumDisplayMs: 2000 },
  "intelligence.provider_error": { state: "error_attention", title: "Falha de inteligÃªncia", summary: "O provedor de inteligÃªncia falhou; regras locais permanecem disponÃ­veis.", rationale: "A falha deve ser visÃ­vel e usar fallback determinÃ­stico.", durationMs: 8000, minimumDisplayMs: 1800 },
  // R2_EVENT_REACTION_COMPLETION_V1_START
  "automation.completed": { state: "idle", title: "AutomaÃ§Ã£o concluÃ­da", summary: "A automaÃ§Ã£o concluiu seu processamento.", rationale: "A conclusÃ£o confirmada permite retornar ao acompanhamento normal.", durationMs: 3000, minimumDisplayMs: 600, fallbackState: "idle" },
  "intelligence.analysis_completed": { state: "idle", title: "AnÃ¡lise concluÃ­da", summary: "O R2 concluiu a anÃ¡lise disponÃ­vel.", rationale: "A anÃ¡lise terminou sem presumir que uma recomendaÃ§Ã£o jÃ¡ foi aceita.", durationMs: 3000, minimumDisplayMs: 700, fallbackState: "idle" },
  "intelligence.insufficient_context": { state: "awaiting_action", title: "Contexto insuficiente", summary: "Faltam informaÃ§Ãµes para uma recomendaÃ§Ã£o segura.", rationale: "O R2 deve solicitar contexto em vez de inventar uma conclusÃ£o.", durationMs: 8000, minimumDisplayMs: 1800 },
  "intelligence.recommendation_accepted": { state: "working", title: "RecomendaÃ§Ã£o aceita", summary: "A recomendaÃ§Ã£o foi aceita e pode seguir para o fluxo autorizado.", rationale: "A aceitaÃ§Ã£o confirmada permite organizar a execuÃ§Ã£o sem presumir aÃ§Ãµes externas.", durationMs: 4500, minimumDisplayMs: 1000 },
  "intelligence.recommendation_rejected": { state: "thinking", title: "RecomendaÃ§Ã£o rejeitada", summary: "A recomendaÃ§Ã£o foi rejeitada e o contexto precisa ser reavaliado.", rationale: "A rejeiÃ§Ã£o pede uma nova anÃ¡lise, sem insistir no caminho anterior.", durationMs: 5000, minimumDisplayMs: 1100 },
  "lead.converted": { state: "working", title: "Lead convertido", summary: "O lead foi convertido e seguirÃ¡ para a prÃ³xima etapa comercial.", rationale: "A conversÃ£o confirmada exige continuidade operacional, nÃ£o celebraÃ§Ã£o de venda.", expression: "SMILE", expressionIntensity: 0.18, durationMs: 4500, minimumDisplayMs: 1000 },
  "lead.disqualified": { state: "idle", title: "Lead desqualificado", summary: "O lead foi desqualificado com base no contexto registrado.", rationale: "A desqualificaÃ§Ã£o Ã© um resultado comercial, nÃ£o uma falha do sistema.", durationMs: 3500, minimumDisplayMs: 800, fallbackState: "idle" },
  "lead.no_response": { state: "awaiting_action", title: "Lead sem resposta", summary: "O lead ainda nÃ£o respondeu e requer definiÃ§Ã£o de acompanhamento.", rationale: "A ausÃªncia de resposta pede uma prÃ³xima aÃ§Ã£o humana controlada.", durationMs: 7000, minimumDisplayMs: 1600 },
  "lead.qualified": { state: "thinking", title: "Lead qualificado", summary: "O lead foi qualificado e o prÃ³ximo passo pode ser avaliado.", rationale: "A qualificaÃ§Ã£o confirmada muda o contexto e exige reavaliaÃ§Ã£o comercial.", durationMs: 4500, minimumDisplayMs: 1000 },
  "meeting.cancelled": { state: "awaiting_action", title: "ReuniÃ£o cancelada", summary: "A reuniÃ£o foi cancelada e pode exigir reagendamento.", rationale: "O cancelamento confirmado depende de uma decisÃ£o sobre o prÃ³ximo contato.", durationMs: 7500, minimumDisplayMs: 1800 },
  "meeting.follow_up_pending": { state: "awaiting_action", title: "Follow-up pendente", summary: "HÃ¡ um acompanhamento pendente apÃ³s a reuniÃ£o.", rationale: "O prÃ³ximo contato precisa ser revisado ou autorizado pelo usuÃ¡rio.", durationMs: 7500, minimumDisplayMs: 1800 },
  "meeting.started": { state: "listening", title: "ReuniÃ£o iniciada", summary: "A reuniÃ£o comeÃ§ou e o R2 estÃ¡ atento ao contexto.", rationale: "Durante a reuniÃ£o, a postura correta Ã© escutar antes de recomendar.", durationMs: 5000, minimumDisplayMs: 1200 },
  "opportunity.created": { state: "working", title: "Oportunidade criada", summary: "Uma nova oportunidade entrou no fluxo comercial.", rationale: "A criaÃ§Ã£o confirmada inicia o acompanhamento operacional.", durationMs: 4000, minimumDisplayMs: 900 },
  "opportunity.lost": { state: "alert", title: "Oportunidade perdida", summary: "A oportunidade foi encerrada como perdida.", rationale: "A perda confirmada merece atenÃ§Ã£o para registro de causa e aprendizado.", expression: "BROW_FROWN", expressionIntensity: 0.28, durationMs: 7500, minimumDisplayMs: 1700 },
  "opportunity.note_added": { state: "listening", title: "Nova nota na oportunidade", summary: "Uma nova informaÃ§Ã£o foi adicionada Ã  oportunidade.", rationale: "O novo contexto deve ser absorvido antes de qualquer recomendaÃ§Ã£o.", durationMs: 4500, minimumDisplayMs: 1000 },
  "opportunity.updated": { state: "thinking", title: "Oportunidade atualizada", summary: "Os dados da oportunidade foram atualizados.", rationale: "A atualizaÃ§Ã£o pode alterar prioridades e prÃ³ximos passos.", durationMs: 4500, minimumDisplayMs: 1000 },
  "opportunity.won": { state: "working", title: "Oportunidade ganha", summary: "A oportunidade foi marcada como ganha e seguirÃ¡ para conclusÃ£o operacional.", rationale: "O ganho da oportunidade ainda nÃ£o substitui a confirmaÃ§Ã£o final da venda.", expression: "SMILE", expressionIntensity: 0.28, durationMs: 5000, minimumDisplayMs: 1100 },
  "proposal.expired": { state: "alert", title: "Proposta expirada", summary: "A proposta expirou sem conclusÃ£o registrada.", rationale: "A expiraÃ§Ã£o exige atenÃ§Ã£o para decidir renovaÃ§Ã£o ou encerramento.", durationMs: 7000, minimumDisplayMs: 1600 },
  "proposal.prepared": { state: "working", title: "Proposta preparada", summary: "A proposta foi preparada e estÃ¡ pronta para o prÃ³ximo passo.", rationale: "A preparaÃ§Ã£o confirmada ainda requer revisÃ£o ou envio autorizado.", durationMs: 4000, minimumDisplayMs: 900 },
  "proposal.rejected": { state: "alert", title: "Proposta rejeitada", summary: "A proposta foi rejeitada.", rationale: "A rejeiÃ§Ã£o confirmada exige revisÃ£o da estratÃ©gia comercial.", expression: "BROW_FROWN", expressionIntensity: 0.25, durationMs: 7500, minimumDisplayMs: 1700 },
  "proposal.review_ready": { state: "awaiting_action", title: "Proposta pronta para revisÃ£o", summary: "A proposta estÃ¡ pronta para revisÃ£o do usuÃ¡rio.", rationale: "O conteÃºdo deve ser validado antes de qualquer envio externo.", durationMs: 8000, minimumDisplayMs: 1800 },
  "proposal.viewed": { state: "listening", title: "Proposta visualizada", summary: "O cliente visualizou a proposta.", rationale: "A visualizaÃ§Ã£o Ã© um sinal de atenÃ§Ã£o, mas nÃ£o confirma intenÃ§Ã£o ou aceite.", durationMs: 5000, minimumDisplayMs: 1100 },
  "sale.awaiting_documentation": { state: "awaiting_action", title: "Venda aguardando documentaÃ§Ã£o", summary: "A venda permanece pendente por documentaÃ§Ã£o.", rationale: "A pendÃªncia documental exige acompanhamento antes da conclusÃ£o.", durationMs: 7500, minimumDisplayMs: 1800 },
  "sale.cancelled": { state: "alert", title: "Venda cancelada", summary: "A venda foi cancelada.", rationale: "O cancelamento confirmado merece atenÃ§Ã£o comercial, mas nÃ£o representa falha tÃ©cnica.", expression: "BROW_FROWN", expressionIntensity: 0.3, durationMs: 8000, minimumDisplayMs: 1800 },
  "sale.documentation_received": { state: "working", title: "DocumentaÃ§Ã£o recebida", summary: "A documentaÃ§Ã£o da venda foi recebida.", rationale: "O recebimento confirmado permite continuar as validaÃ§Ãµes operacionais.", durationMs: 4500, minimumDisplayMs: 1000 },
  "sale.payment_confirmed": { state: "working", title: "Pagamento confirmado", summary: "O pagamento da venda foi confirmado.", rationale: "O pagamento confirmado permite avanÃ§ar, mas a celebraÃ§Ã£o fica reservada Ã  venda concluÃ­da.", expression: "SMILE", expressionIntensity: 0.3, durationMs: 5000, minimumDisplayMs: 1100 },
  "sale.pending": { state: "awaiting_action", title: "Venda pendente", summary: "A venda possui uma pendÃªncia que precisa ser acompanhada.", rationale: "A pendÃªncia confirmada requer decisÃ£o ou execuÃ§Ã£o humana.", durationMs: 7500, minimumDisplayMs: 1800 },
  "sale.started": { state: "working", title: "Venda iniciada", summary: "O processo de venda foi iniciado.", rationale: "O inÃ­cio confirmado exige acompanhamento operacional atÃ© a conclusÃ£o.", durationMs: 4500, minimumDisplayMs: 1000 },
  "task.completed": { state: "idle", title: "Tarefa concluÃ­da", summary: "A tarefa foi concluÃ­da.", rationale: "A conclusÃ£o permite retornar ao estado operacional estÃ¡vel.", expression: "SMILE", expressionIntensity: 0.18, durationMs: 3000, minimumDisplayMs: 700, fallbackState: "idle" },
  // R2_EVENT_REACTION_COMPLETION_V1_END
  "runtime.speaking_requested": { state: "speaking", title: "R2 falando", summary: "O R2 estÃ¡ apresentando uma mensagem preparada.", rationale: "A fala pode ser interrompida por alertas e erros.", durationMs: 5000, minimumDisplayMs: 800, fallbackState: "listening" },
  "runtime.neutral_requested": { state: "neutral", title: "Reset neutro", summary: "O runtime retornarÃ¡ ao estado neutro exato.", rationale: "O reset explÃ­cito restaura o baseline aprovado.", durationMs: 1000, minimumDisplayMs: 0, fallbackState: "idle" },
}

function textPayload(
  event: R2DomainEvent,
  key: string,
) {
  const value = event.payload[key]
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null
}

function interruptionPolicy(
  urgency: R2Urgency,
): R2PresentationHints["interruptionPolicy"] {
  if (urgency === "critical") return "ALWAYS"
  if (urgency === "high") return "ALERT_OR_CRITICAL"
  return "HIGHER_PRIORITY"
}

function buildRecommendation(
  request: R2IntelligenceRequest,
  reaction: ReactionDefinition,
): R2Recommendation {
  const event = request.event
  const suppliedTitle = textPayload(event, "title")
  const suppliedSummary = textPayload(event, "summary") ?? textPayload(event, "recommendation")
  const requiresConfirmation = reaction.state === "awaiting_action"
  return {
    recommendationType: event.eventType,
    title: suppliedTitle ?? reaction.title,
    summary: suppliedSummary ?? reaction.summary,
    rationale: reaction.rationale,
    confidence: request.context.missingInformation.length > 0 ? 0.65 : 0.9,
    urgency: event.urgency,
    suggestedActions: requiresConfirmation
      ? [{ actionId: `${event.eventId}:review`, label: "Revisar", requiresConfirmation: true }]
      : [],
    missingInformation: [...request.context.missingInformation],
    expiresAt: event.expiresAt,
  }
}

export class R2DeterministicIntelligence implements R2IntelligencePort {
  readonly provider = "gorillaos-deterministic-local-v1"

  async evaluate(
    request: R2IntelligenceRequest,
  ): Promise<R2IntelligenceResult> {
    if (request.event.workspaceId !== request.context.workspaceId) {
      throw new Error("R2 intelligence workspace mismatch.")
    }

    const reaction = REACTIONS[request.event.eventType]
    if (!reaction) {
      return {
        result: "IGNORE",
        recommendation: null,
        confidence: 1,
        urgency: request.event.urgency,
        reasons: ["NO_REACTION_REQUIRED"],
        missingInformation: [],
        presentationHints: null,
        expiresAt: request.event.expiresAt,
      }
    }

    const recommendation = buildRecommendation(request, reaction)
    const urgency = request.event.urgency
    const state =
      request.event.eventType === "intelligence.recommendation_ready" &&
      (urgency === "high" || urgency === "critical")
        ? "alert"
        : reaction.state
    const viseme = request.event.eventType === "runtime.speaking_requested"
      ? (request.event.payload.viseme === "VISEME_E" ||
          request.event.payload.viseme === "VISEME_O" ||
          request.event.payload.viseme === "VISEME_MBP" ||
          request.event.payload.viseme === "VISEME_FV" ||
          request.event.payload.viseme === "VISEME_L"
          ? request.event.payload.viseme
          : "VISEME_A")
      : undefined

    return {
      result: "REACT",
      recommendation,
      confidence: recommendation.confidence,
      urgency,
      reasons: reaction.state === "awaiting_action"
        ? ["EVENT_ACCEPTED", "CONFIRMATION_REQUIRED"]
        : ["EVENT_ACCEPTED"],
      missingInformation: [...recommendation.missingInformation],
      presentationHints: {
        runtimeState: state,
        expression: reaction.expression,
        expressionIntensity: reaction.expressionIntensity,
        viseme,
        speakingIntensity: state === "speaking" ? 0.75 : undefined,
        eyeTarget: state === "thinking" ? { yaw: 0.3, pitch: 0.25 } : undefined,
        durationMs: reaction.durationMs,
        minimumDisplayMs: reaction.minimumDisplayMs,
        transitionMs: state === "error_attention" ? 120 : 250,
        interruptionPolicy: interruptionPolicy(urgency),
        fallbackState: reaction.fallbackState ?? request.context.lastStableRuntimeState,
      },
      expiresAt: request.event.expiresAt,
    }
  }
}
