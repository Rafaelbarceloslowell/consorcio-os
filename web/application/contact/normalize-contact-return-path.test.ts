import {
  describe,
  expect,
  it,
} from "vitest"

import {
  normalizeContactReturnPath,
} from "./normalize-contact-return-path"

describe(
  "normalizeContactReturnPath",
  () => {
    it(
      "preserva uma oportunidade interna válida",
      () => {
        expect(
          normalizeContactReturnPath(
            "/opportunities/journey-1",
            "/leads",
          ),
        ).toBe(
          "/opportunities/journey-1",
        )
      },
    )

    it(
      "aceita o primeiro valor recebido pelo searchParams",
      () => {
        expect(
          normalizeContactReturnPath(
            [
              "/leads",
              "/clients",
            ],
            "/leads",
          ),
        ).toBe("/leads")
      },
    )

    it.each([
      "https://example.com",
      "//example.com",
      "/settings",
      "\\opportunities\\journey-1",
      "",
      null,
      undefined,
    ])(
      "usa fallback para destino inválido: %s",
      (value) => {
        expect(
          normalizeContactReturnPath(
            value,
            "/leads",
          ),
        ).toBe("/leads")
      },
    )
  },
)
