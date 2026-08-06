export function normalizeContactReturnPath(
  value: unknown,
  fallback: string,
): string {
  const candidate =
    Array.isArray(value)
      ? value.at(0)
      : value

  if (typeof candidate !== "string") {
    return fallback
  }

  const normalized = candidate.trim()

  if (
    !normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    normalized.includes("\\") ||
    !/^\/(?:opportunities|leads|clients)(?:\/|$)/u.test(
      normalized,
    )
  ) {
    return fallback
  }

  return normalized
}
