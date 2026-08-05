export type AgendaTaskItem = {
  id: string
  title: string
  description: string | null
  statusLabel: string
  priorityLabel: string
  dueAtLabel: string
  dueAtInput: string
  overdue: boolean
  relatedName: string
  opportunityHref: string | null
}

export type AgendaMeetingItem = {
  id: string
  title: string
  description: string | null
  typeLabel: string
  startAtLabel: string
  startAtInput: string
  endAtInput: string
  relatedName: string
  location: string | null
  meetingUrl: string | null
  opportunityHref: string | null
}

export type AgendaView = {
  tasks: AgendaTaskItem[]
  meetings: AgendaMeetingItem[]
}

export type AgendaCreateFormView = {
  leads: Array<{
    id: string
    name: string
  }>
}

export type AgendaCreateValues = {
  kind: string
  leadId: string
  title: string
  description: string
  startAt: string
  endAt: string
  meetingType: string
  taskType: string
  priority: string
  location: string
  meetingUrl: string
}

export type AgendaCreateFieldErrors = Partial<
  Record<
    keyof AgendaCreateValues,
    string
  >
>

export type AgendaCreateActionState =
  | {
      status: "idle"
      message: null
    }
  | {
      status: "error"
      message: string
      values: AgendaCreateValues
      fieldErrors?: AgendaCreateFieldErrors
    }
