import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    formatCurrency,
    formatGreeting,
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
            "R$\u00A00",
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
            "R$\u00A0450.000",
          )
        },
      )
  
      it(
        "deve arredondar valores decimais",
        () => {
          expect(
            formatCurrency(
              1_234.56,
            ),
          ).toBe(
            "R$\u00A01.235",
          )
        },
      )
  
      it(
        "deve arredondar valores decimais para baixo",
        () => {
          expect(
            formatCurrency(
              1_234.49,
            ),
          ).toBe(
            "R$\u00A01.234",
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
            "-R$\u00A01.500",
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