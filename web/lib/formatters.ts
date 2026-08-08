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
