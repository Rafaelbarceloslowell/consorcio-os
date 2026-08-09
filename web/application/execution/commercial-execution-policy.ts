export const ACTIVE_WORKSET_TARGET = 50
export const MEETING_NO_SHOW_GRACE_MINUTES = 10

export type CadenceChannel = "WHATSAPP" | "CALL"

export type CadenceImpactPolicy = Readonly<{
  impactNumber: number
  channel: CadenceChannel
  delayAfterPreviousHours: number
  responseCheckMinutes: number
}>

export const NEW_LEAD_CADENCE: readonly CadenceImpactPolicy[] = [
  { impactNumber: 1, channel: "WHATSAPP", delayAfterPreviousHours: 0, responseCheckMinutes: 5 },
  { impactNumber: 2, channel: "CALL", delayAfterPreviousHours: 0, responseCheckMinutes: 60 },
  { impactNumber: 3, channel: "WHATSAPP", delayAfterPreviousHours: 24, responseCheckMinutes: 240 },
  { impactNumber: 4, channel: "CALL", delayAfterPreviousHours: 24, responseCheckMinutes: 240 },
  { impactNumber: 5, channel: "WHATSAPP", delayAfterPreviousHours: 48, responseCheckMinutes: 480 },
  { impactNumber: 6, channel: "CALL", delayAfterPreviousHours: 48, responseCheckMinutes: 480 },
  { impactNumber: 7, channel: "WHATSAPP", delayAfterPreviousHours: 72, responseCheckMinutes: 1440 },
] as const

export function getImpactPolicy(impactNumber: number): CadenceImpactPolicy {
  const policy = NEW_LEAD_CADENCE.find((item) => item.impactNumber === impactNumber)

  if (!policy) {
    throw new Error(`Impacto ${impactNumber} não pertence à cadência comercial de 7 impactos.`)
  }

  return policy
}

export function addBusinessHours(
  source: Date,
  hours: number,
  options: Readonly<{
    businessStartHour?: number
    businessEndHour?: number
    skipWeekends?: boolean
  }> = {},
): Date {
  const businessStartHour = options.businessStartHour ?? 9
  const businessEndHour = options.businessEndHour ?? 18
  const skipWeekends = options.skipWeekends ?? true
  const result = new Date(source)

  if (hours <= 0) {
    return result
  }

  let remainingMinutes = Math.round(hours * 60)

  while (remainingMinutes > 0) {
    result.setMinutes(result.getMinutes() + 1)
    const day = result.getDay()
    const hour = result.getHours()
    const isWeekend = day === 0 || day === 6
    const isBusinessMinute =
      (!skipWeekends || !isWeekend) &&
      hour >= businessStartHour &&
      hour < businessEndHour

    if (isBusinessMinute) {
      remainingMinutes -= 1
    }
  }

  return result
}
