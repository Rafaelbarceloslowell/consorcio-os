export type R2Mood =
  | "idle"
  | "thinking"
  | "alert"
  | "success"
  | "welcome"

export type R2Animation =
  | "breathing"
  | "looking"
  | "thinking"
  | "warning"
  | "celebrating"

export type R2Behavior = {
  mood: R2Mood
  animation: R2Animation
  message: string
}

export function decideR2Behavior(event?: string): R2Behavior {
  switch (event) {
    case "dashboard_open":
      return {
        mood: "welcome",
        animation: "looking",
        message: "Olá, estou acompanhando sua operação.",
      }

    case "hot_lead_found":
      return {
        mood: "alert",
        animation: "warning",
        message: "Encontrei uma oportunidade importante.",
      }

    case "proposal_analysis":
      return {
        mood: "thinking",
        animation: "thinking",
        message: "Estou analisando os dados.",
      }

    case "sale_completed":
      return {
        mood: "success",
        animation: "celebrating",
        message: "Excelente trabalho. Mais uma conversão.",
      }

    default:
      return {
        mood: "idle",
        animation: "breathing",
        message: "Monitorando sua operação.",
      }
  }
}