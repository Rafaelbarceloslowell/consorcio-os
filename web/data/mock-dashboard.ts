import type { DashboardData } from "@/types/dashboard"

export const mockDashboardData: DashboardData = {
  user: {
    id: "user-1",
    name: "Rafael",
  },
  summary:
    "Aqui está o resumo da sua operação hoje.",
  metrics: {
    newLeads: 12,
    meetingsToday: 4,
    monthlySales: 850_000,
    pendingTasks: 7,
  },
  meetings: [
    {
      id: "meeting-1",
      title:
        "Apresentação de proposta",
      time: "09:00",
      clientName: "Empresa XYZ",
    },
    {
      id: "meeting-2",
      title:
        "Reunião de follow-up",
      time: "11:30",
      clientName: "João Silva",
    },
    {
      id: "meeting-3",
      title:
        "Demonstração do produto",
      time: "14:00",
      clientName: "Maria Santos",
    },
    {
      id: "meeting-4",
      title:
        "Fechamento de contrato",
      time: "16:30",
      clientName: "Grupo Alpha",
    },
  ],
  tasks: [
    {
      id: "task-1",
      title: "Ligar para João Silva",
      time: "10:00",
      priority: "high",
    },
    {
      id: "task-2",
      title:
        "Enviar proposta — Maria Santos",
      time: "14:30",
      priority: "medium",
    },
    {
      id: "task-3",
      title:
        "Revisar contrato — Grupo Alpha",
      time: "16:00",
      priority: "medium",
    },
    {
      id: "task-4",
      title:
        "Follow-up lead — Carlos Mendes",
      time: "17:00",
      priority: "low",
    },
  ],
  pipeline: [
    {
      id: "stage-1",
      name: "Prospecção",
      count: 24,
      value: 1_200_000,
    },
    {
      id: "stage-2",
      name: "Qualificação",
      count: 18,
      value: 980_000,
    },
    {
      id: "stage-3",
      name: "Proposta",
      count: 11,
      value: 720_000,
    },
    {
      id: "stage-4",
      name: "Negociação",
      count: 6,
      value: 450_000,
    },
    {
      id: "stage-5",
      name: "Fechamento",
      count: 3,
      value: 280_000,
    },
  ],
}