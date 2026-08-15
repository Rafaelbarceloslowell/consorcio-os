import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    formatCompactCurrency,
    formatCurrency,
    formatGreeting,
    formatRelativeTime,
  } from "./formatters"
  
  describe(
    "formatCurrency",
    () => {
      it(
        "deve formatar zero em reais",
        () => {
          expect(
            formatCurrency(0),
          ).toBe(
            "R$\u00A00,00",
          )
        },
      )
  
      it(
        "deve formatar um valor inteiro em reais",
        () => {
          expect(
            formatCurrency(
              450_000,
            ),
          ).toBe(
            "R$\u00A0450.000,00",
          )
        },
      )
  
      it(
        "deve preservar centavos",
        () => {
          expect(
            formatCurrency(
              1_234.56,
            ),
          ).toBe(
            "R$\u00A01.234,56",
          )
        },
      )
  
      it(
        "deve preservar centavos abaixo de cinquenta",
        () => {
          expect(
            formatCurrency(
              1_234.49,
            ),
          ).toBe(
            "R$\u00A01.234,49",
          )
        },
      )
  
      it(
        "deve formatar valores negativos",
        () => {
          expect(
            formatCurrency(
              -1_500,
            ),
          ).toBe(
            "-R$\u00A01.500,00",
          )
        },
      )
    },
  )
  
  describe(
    "formatGreeting",
    () => {
      it(
        "deve retornar bom dia à meia-noite",
        () => {
          const date =
            new Date(
              2026,
              6,
              22,
              0,
              0,
              0,
            )
  
          expect(
            formatGreeting(
              "Rafael",
              date,
            ),
          ).toBe(
            "Bom dia, Rafael",
          )
        },
      )
  
      it(
        "deve retornar bom dia antes do meio-dia",
        () => {
          const date =
            new Date(
              2026,
              6,
              22,
              11,
              59,
              59,
            )
  
          expect(
            formatGreeting(
              "Rafael",
              date,
            ),
          ).toBe(
            "Bom dia, Rafael",
          )
        },
      )
  
      it(
        "deve retornar boa tarde ao meio-dia",
        () => {
          const date =
            new Date(
              2026,
              6,
              22,
              12,
              0,
              0,
            )
  
          expect(
            formatGreeting(
              "Rafael",
              date,
            ),
          ).toBe(
            "Boa tarde, Rafael",
          )
        },
      )
  
      it(
        "deve retornar boa tarde antes das dezoito horas",
        () => {
          const date =
            new Date(
              2026,
              6,
              22,
              17,
              59,
              59,
            )
  
          expect(
            formatGreeting(
              "Rafael",
              date,
            ),
          ).toBe(
            "Boa tarde, Rafael",
          )
        },
      )
  
      it(
        "deve retornar boa noite às dezoito horas",
        () => {
          const date =
            new Date(
              2026,
              6,
              22,
              18,
              0,
              0,
            )
  
          expect(
            formatGreeting(
              "Rafael",
              date,
            ),
          ).toBe(
            "Boa noite, Rafael",
          )
        },
      )
  
      it(
        "deve retornar boa noite antes da meia-noite",
        () => {
          const date =
            new Date(
              2026,
              6,
              22,
              23,
              59,
              59,
            )
  
          expect(
            formatGreeting(
              "Rafael",
              date,
            ),
          ).toBe(
            "Boa noite, Rafael",
          )
        },
      )
    },
  )

  describe("formatCompactCurrency", () => {
    it.each([
      [0, "R$\u00A00"],
      [500, "R$\u00A0500"],
      [500.5, "R$\u00A0500,50"],
      [1_500, "R$\u00A01,5 mil"],
      [250_000, "R$\u00A0250 mil"],
      [1_200_000, "R$\u00A01,2 mi"],
      [10_500_000, "R$\u00A010,5 mi"],
      [-1_500, "-R$\u00A01,5 mil"],
    ])("formata %s como %s", (value, expected) => {
      expect(formatCompactCurrency(value)).toBe(expected)
    })

    it("não presume valor ausente", () => {
      expect(formatCurrency(null)).toBe("—")
      expect(formatCompactCurrency(undefined)).toBe("—")
    })
  })

  describe("formatRelativeTime", () => {
    const reference = new Date("2026-08-15T15:00:00.000Z")

    it.each([
      ["2026-08-15T14:56:00.000Z", "há 4 min"],
      ["2026-08-15T13:00:00.000Z", "há 2 h"],
      ["2026-08-14T15:00:00.000Z", "ontem"],
    ])("formata %s como %s", (value, expected) => {
      expect(formatRelativeTime(value, reference)).toBe(expected)
    })
  })
