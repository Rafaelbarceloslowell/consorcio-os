export function normalizeEmail(
    email: string,
  ): string {
    return email
      .trim()
      .toLowerCase()
  }
  
  export function normalizeDigits(
    value: string,
  ): string {
    return value.replace(
      /\D/g,
      "",
    )
  }
  
  export function normalizeDocument(
    document: string,
  ): string {
    return normalizeDigits(
      document,
    )
  }
  
  export function normalizeZipCode(
    zipCode: string,
  ): string {
    return normalizeDigits(
      zipCode,
    )
  }
  
  export function normalizeCountryCode(
    countryCode: string | undefined,
  ): string {
    const normalizedCountryCode =
      normalizeDigits(
        countryCode ?? "55",
      )
  
    if (
      normalizedCountryCode.length < 1 ||
      normalizedCountryCode.length > 3
    ) {
      throw new Error(
        "O código do país do telefone deve possuir entre 1 e 3 dígitos.",
      )
    }
  
    return normalizedCountryCode
  }
  
  export function normalizePhone(
    phone: string,
    countryCode?: string,
  ): string {
    const trimmedPhone =
      phone.trim()
  
    const phoneDigits =
      normalizeDigits(
        trimmedPhone,
      )
  
    if (!phoneDigits) {
      return ""
    }
  
    if (
      trimmedPhone.startsWith(
        "+",
      )
    ) {
      return `+${phoneDigits}`
    }
  
    if (
      countryCode !== undefined
    ) {
      const normalizedCountryCode =
        normalizeCountryCode(
          countryCode,
        )
  
      return `+${normalizedCountryCode}${phoneDigits}`
    }
  
    if (
      phoneDigits.length === 10 ||
      phoneDigits.length === 11
    ) {
      return `+55${phoneDigits}`
    }
  
    return `+${phoneDigits}`
  }
  
  export function normalizeStoredPhone(
    phone: string,
  ): string {
    const trimmedPhone =
      phone.trim()
  
    const phoneDigits =
      normalizeDigits(
        trimmedPhone,
      )
  
    if (!phoneDigits) {
      return ""
    }
  
    if (
      trimmedPhone.startsWith(
        "+",
      )
    ) {
      return `+${phoneDigits}`
    }
  
    if (
      phoneDigits.length === 10 ||
      phoneDigits.length === 11
    ) {
      return `+55${phoneDigits}`
    }
  
    return `+${phoneDigits}`
  }
  
  export function normalizeTags(
    tags: string[] | undefined,
  ): string[] {
    if (!tags) {
      return []
    }
  
    const normalizedTags: string[] = []
    const normalizedTagKeys =
      new Set<string>()
  
    for (const tag of tags) {
      const normalizedTag =
        tag.trim()
  
      if (!normalizedTag) {
        continue
      }
  
      const normalizedTagKey =
        normalizedTag.toLocaleLowerCase(
          "pt-BR",
        )
  
      if (
        normalizedTagKeys.has(
          normalizedTagKey,
        )
      ) {
        continue
      }
  
      normalizedTagKeys.add(
        normalizedTagKey,
      )
  
      normalizedTags.push(
        normalizedTag,
      )
    }
  
    return normalizedTags
  }