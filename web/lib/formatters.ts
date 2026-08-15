export function formatCurrency(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—"
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value)
}

export function formatCompactCurrency(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—"
  }

  const absoluteValue = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  const compact = (
    divisor: number,
    suffix: string,
  ) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(absoluteValue / divisor)

    return `${sign}R$\u00A0${formatted} ${suffix}`
  }

  if (absoluteValue >= 1_000_000_000) return compact(1_000_000_000, "bi")
  if (absoluteValue >= 1_000_000) return compact(1_000_000, "mi")
  if (absoluteValue >= 1_000) return compact(1_000, "mil")

  const fractionDigits = Number.isInteger(absoluteValue) ? 0 : 2
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(absoluteValue)

  return `${sign}R$\u00A0${formatted}`
}

export function formatGreeting(
  name: string,
  date: Date = new Date(),
): string {
  const hour = date.getHours()

  if (hour < 12) {
    return `Bom dia, ${name}`
  }

  if (hour < 18) {
    return `Boa tarde, ${name}`
  }

  return `Boa noite, ${name}`
}

export function formatRelativeTime(
  value: string | Date,
  reference: Date = new Date(),
): string {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((reference.getTime() - new Date(value).getTime()) / 60_000),
  )

  if (elapsedMinutes < 1) return "agora"
  if (elapsedMinutes < 60) return `há ${elapsedMinutes} min`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `há ${elapsedHours} h`
  if (elapsedHours < 48) return "ontem"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value))
}
