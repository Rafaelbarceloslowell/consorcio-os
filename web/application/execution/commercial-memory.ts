export type MemoryProvenance =
  | "manual_context"
  | "consultant_confirmed"
  | "system_event"
  | "meeting_result"
  | "proposal"
  | "future_whatsapp_sync"

export type StructuredMemoryFact = Readonly<{
  value: string | number | boolean
  provenance: MemoryProvenance
  observedAt: string
  history: ReadonlyArray<{
    value: string | number | boolean
    provenance: MemoryProvenance
    observedAt: string
  }>
}>

export type StructuredCommercialMemory = Readonly<Record<string, StructuredMemoryFact>>

const CONFIRMED_PROVENANCE = new Set<MemoryProvenance>([
  "manual_context",
  "consultant_confirmed",
  "meeting_result",
  "proposal",
  "future_whatsapp_sync",
])

export function mergeStructuredMemory(
  current: StructuredCommercialMemory,
  updates: ReadonlyArray<Readonly<{
    key: string
    value: string | number | boolean
    provenance: MemoryProvenance
    observedAt: string
    unambiguous: boolean
  }>>,
): Readonly<{
  memory: StructuredCommercialMemory
  conflicts: ReadonlyArray<{
    key: string
    currentValue: string | number | boolean
    proposedValue: string | number | boolean
  }>
}> {
  const memory: Record<string, StructuredMemoryFact> = { ...current }
  const conflicts: Array<{
    key: string
    currentValue: string | number | boolean
    proposedValue: string | number | boolean
  }> = []

  for (const update of updates) {
    const key = update.key.trim()
    if (!key || Number.isNaN(new Date(update.observedAt).getTime())) {
      continue
    }

    const existing = memory[key]
    if (!existing) {
      if (update.unambiguous && CONFIRMED_PROVENANCE.has(update.provenance)) {
        memory[key] = {
          value: update.value,
          provenance: update.provenance,
          observedAt: update.observedAt,
          history: [],
        }
      }
      continue
    }

    if (existing.value === update.value) {
      if (new Date(update.observedAt) > new Date(existing.observedAt)) {
        memory[key] = { ...existing, provenance: update.provenance, observedAt: update.observedAt }
      }
      continue
    }

    const newer = new Date(update.observedAt) > new Date(existing.observedAt)
    if (!update.unambiguous || !CONFIRMED_PROVENANCE.has(update.provenance) || !newer) {
      conflicts.push({ key, currentValue: existing.value, proposedValue: update.value })
      continue
    }

    memory[key] = {
      value: update.value,
      provenance: update.provenance,
      observedAt: update.observedAt,
      history: [
        ...existing.history,
        { value: existing.value, provenance: existing.provenance, observedAt: existing.observedAt },
      ],
    }
  }

  return { memory, conflicts }
}

export function buildNarrativeMemory(input: Readonly<{
  currentStage: string
  lastEvent: string
  commitment?: string | null
  nextObjective: string
}>): string {
  return [
    `Conversa em ${input.currentStage.trim()}.`,
    `Último evento: ${input.lastEvent.trim()}.`,
    input.commitment?.trim() ? `Combinado: ${input.commitment.trim()}.` : null,
    `Próximo objetivo: ${input.nextObjective.trim()}.`,
  ].filter(Boolean).join(" ")
}
