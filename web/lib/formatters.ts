export function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(value)
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