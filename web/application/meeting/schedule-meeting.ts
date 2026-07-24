import type {
    Meeting,
    MeetingType,
  } from "@/types/domain"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  export type ScheduleMeetingInput = {
    title: string
    description?: string
    type: MeetingType
    startAt: string
    endAt: string
    consultantId: string
    leadId?: string
    clientId?: string
    proposalId?: string
    location?: string
    meetingUrl?: string
    notes?: string
  }
  
  export type ScheduleMeetingDependencies = {
    crmRepository: CrmRepository
    now?: Date
    generateId?: () => string
  }
  
  function generateDefaultId(): string {
    return `meeting-${globalThis.crypto.randomUUID()}`
  }
  
  function parseDate(
    value: string,
    fieldName: string,
  ): Date {
    const date = new Date(value)
  
    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `${fieldName} deve possuir uma data e horário válidos.`,
      )
    }
  
    return date
  }
  
  function validateParticipant(
    input: ScheduleMeetingInput,
  ): void {
    const hasLead = Boolean(
      input.leadId?.trim(),
    )
  
    const hasClient = Boolean(
      input.clientId?.trim(),
    )
  
    if (!hasLead && !hasClient) {
      throw new Error(
        "A reunião precisa estar vinculada a um lead ou cliente.",
      )
    }
  
    if (hasLead && hasClient) {
      throw new Error(
        "A reunião não pode estar vinculada simultaneamente a um lead e a um cliente.",
      )
    }
  }
  
  function validateMeetingType(
    input: ScheduleMeetingInput,
  ): void {
    if (
      input.type === "online" &&
      !input.meetingUrl?.trim()
    ) {
      throw new Error(
        "O link da reunião é obrigatório para reuniões online.",
      )
    }
  
    if (
      input.type === "in_person" &&
      !input.location?.trim()
    ) {
      throw new Error(
        "O local é obrigatório para reuniões presenciais.",
      )
    }
  }
  
  function validateInput(
    input: ScheduleMeetingInput,
  ): {
    startAt: Date
    endAt: Date
  } {
    if (!input.title.trim()) {
      throw new Error(
        "O título da reunião é obrigatório.",
      )
    }
  
    if (!input.consultantId.trim()) {
      throw new Error(
        "O ID do consultor é obrigatório.",
      )
    }
  
    validateParticipant(input)
    validateMeetingType(input)
  
    const startAt = parseDate(
      input.startAt,
      "O início da reunião",
    )
  
    const endAt = parseDate(
      input.endAt,
      "O término da reunião",
    )
  
    if (
      endAt.getTime() <= startAt.getTime()
    ) {
      throw new Error(
        "O término da reunião deve ocorrer depois do início.",
      )
    }
  
    return {
      startAt,
      endAt,
    }
  }
  
  function meetingsOverlap(
    firstStart: Date,
    firstEnd: Date,
    secondStart: Date,
    secondEnd: Date,
  ): boolean {
    return (
      firstStart.getTime() <
        secondEnd.getTime() &&
      firstEnd.getTime() >
        secondStart.getTime()
    )
  }
  
  export function scheduleMeeting(
    input: ScheduleMeetingInput,
    {
      crmRepository,
      now = new Date(),
      generateId = generateDefaultId,
    }: ScheduleMeetingDependencies,
  ): Meeting {
    const {
      startAt,
      endAt,
    } = validateInput(input)
  
    const consultant =
      crmRepository.getConsultantById(
        input.consultantId,
      )
  
    if (!consultant) {
      throw new Error(
        `Consultor não encontrado para o ID "${input.consultantId}".`,
      )
    }
  
    if (consultant.status !== "active") {
      throw new Error(
        `O consultor "${consultant.id}" não está ativo e não pode receber novas reuniões.`,
      )
    }
  
    const leadId =
      input.leadId?.trim() ||
      undefined
  
    const clientId =
      input.clientId?.trim() ||
      undefined
  
    if (leadId) {
      const lead =
        crmRepository.getLeadById(
          leadId,
        )
  
      if (!lead) {
        throw new Error(
          `Lead não encontrado para o ID "${leadId}".`,
        )
      }
  
      if (lead.status === "lost") {
        throw new Error(
          `O lead "${lead.id}" está perdido e não pode receber novas reuniões.`,
        )
      }
  
      if (
        lead.consultantId !==
        consultant.id
      ) {
        throw new Error(
          `O lead "${lead.id}" não pertence ao consultor "${consultant.id}".`,
        )
      }
    }
  
    if (clientId) {
      const client =
        crmRepository.getClientById(
          clientId,
        )
  
      if (!client) {
        throw new Error(
          `Cliente não encontrado para o ID "${clientId}".`,
        )
      }
  
      if (client.status !== "active") {
        throw new Error(
          `O cliente "${client.id}" não está ativo e não pode receber novas reuniões.`,
        )
      }
  
      if (
        client.consultantId !==
        consultant.id
      ) {
        throw new Error(
          `O cliente "${client.id}" não pertence ao consultor "${consultant.id}".`,
        )
      }
    }
  
    const conflictingMeeting =
      crmRepository
        .getMeetings()
        .find((meeting) => {
          if (
            meeting.consultantId !==
            consultant.id
          ) {
            return false
          }
  
          if (
            meeting.status ===
            "cancelled"
          ) {
            return false
          }
  
          const existingStart =
            new Date(meeting.startAt)
  
          const existingEnd =
            new Date(meeting.endAt)
  
          return meetingsOverlap(
            startAt,
            endAt,
            existingStart,
            existingEnd,
          )
        })
  
    if (conflictingMeeting) {
      throw new Error(
        `O consultor "${consultant.id}" já possui uma reunião no horário informado.`,
      )
    }
  
    const timestamp = now.toISOString()
  
    const meeting: Meeting = {
      id: generateId(),
      title: input.title.trim(),
      description:
        input.description?.trim() ||
        undefined,
      type: input.type,
      status: "scheduled",
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      location:
        input.location?.trim() ||
        undefined,
      meetingUrl:
        input.meetingUrl?.trim() ||
        undefined,
      consultantId: consultant.id,
      leadId,
      clientId,
      proposalId:
        input.proposalId?.trim() ||
        undefined,
      notes:
        input.notes?.trim() ||
        undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  
    return crmRepository.createMeeting(
      meeting,
    )
  }