import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    compareRecommendationValues,
  } from "./comparator"
  
  describe("compareRecommendationValues", () => {
    describe("EQUALS", () => {
      it("deve retornar true quando os valores forem estritamente iguais", () => {
        expect(
          compareRecommendationValues(
            80,
            "EQUALS",
            80,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            "ACTIVE",
            "EQUALS",
            "ACTIVE",
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            true,
            "EQUALS",
            true,
          ),
        ).toBe(true)
      })
  
      it("deve retornar false quando os valores forem diferentes", () => {
        expect(
          compareRecommendationValues(
            80,
            "EQUALS",
            70,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            80,
            "EQUALS",
            "80",
          ),
        ).toBe(false)
      })
    })
  
    describe("NOT_EQUALS", () => {
      it("deve retornar true quando os valores forem diferentes", () => {
        expect(
          compareRecommendationValues(
            80,
            "NOT_EQUALS",
            70,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            80,
            "NOT_EQUALS",
            "80",
          ),
        ).toBe(true)
      })
  
      it("deve retornar false quando os valores forem estritamente iguais", () => {
        expect(
          compareRecommendationValues(
            "ACTIVE",
            "NOT_EQUALS",
            "ACTIVE",
          ),
        ).toBe(false)
      })
    })
  
    describe("operadores numéricos", () => {
      it("deve aplicar GREATER_THAN", () => {
        expect(
          compareRecommendationValues(
            80,
            "GREATER_THAN",
            70,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            70,
            "GREATER_THAN",
            80,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            80,
            "GREATER_THAN",
            80,
          ),
        ).toBe(false)
      })
  
      it("deve aplicar GREATER_THAN_OR_EQUAL", () => {
        expect(
          compareRecommendationValues(
            80,
            "GREATER_THAN_OR_EQUAL",
            70,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            80,
            "GREATER_THAN_OR_EQUAL",
            80,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            70,
            "GREATER_THAN_OR_EQUAL",
            80,
          ),
        ).toBe(false)
      })
  
      it("deve aplicar LESS_THAN", () => {
        expect(
          compareRecommendationValues(
            60,
            "LESS_THAN",
            70,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            80,
            "LESS_THAN",
            70,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            70,
            "LESS_THAN",
            70,
          ),
        ).toBe(false)
      })
  
      it("deve aplicar LESS_THAN_OR_EQUAL", () => {
        expect(
          compareRecommendationValues(
            60,
            "LESS_THAN_OR_EQUAL",
            70,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            70,
            "LESS_THAN_OR_EQUAL",
            70,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            80,
            "LESS_THAN_OR_EQUAL",
            70,
          ),
        ).toBe(false)
      })
  
      it("deve rejeitar comparação numérica quando o valor atual não for number", () => {
        expect(
          compareRecommendationValues(
            "80",
            "GREATER_THAN",
            70,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            null,
            "LESS_THAN",
            70,
          ),
        ).toBe(false)
      })
  
      it("deve rejeitar comparação numérica quando o valor esperado não for number", () => {
        expect(
          compareRecommendationValues(
            80,
            "GREATER_THAN",
            "70",
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            80,
            "LESS_THAN_OR_EQUAL",
            null,
          ),
        ).toBe(false)
      })
    })
  
    describe("EXISTS", () => {
      it("deve retornar true para valores existentes", () => {
        expect(
          compareRecommendationValues(
            0,
            "EXISTS",
            undefined,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            false,
            "EXISTS",
            undefined,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            "",
            "EXISTS",
            undefined,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            "value",
            "EXISTS",
            undefined,
          ),
        ).toBe(true)
      })
  
      it("deve retornar false para null e undefined", () => {
        expect(
          compareRecommendationValues(
            null,
            "EXISTS",
            undefined,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            undefined,
            "EXISTS",
            undefined,
          ),
        ).toBe(false)
      })
    })
  
    describe("NOT_EXISTS", () => {
      it("deve retornar true para null e undefined", () => {
        expect(
          compareRecommendationValues(
            null,
            "NOT_EXISTS",
            undefined,
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            undefined,
            "NOT_EXISTS",
            undefined,
          ),
        ).toBe(true)
      })
  
      it("deve retornar false para valores existentes", () => {
        expect(
          compareRecommendationValues(
            0,
            "NOT_EXISTS",
            undefined,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            false,
            "NOT_EXISTS",
            undefined,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            "",
            "NOT_EXISTS",
            undefined,
          ),
        ).toBe(false)
      })
    })
  
    describe("IN", () => {
      it("deve retornar true quando o valor estiver na lista", () => {
        expect(
          compareRecommendationValues(
            80,
            "IN",
            [60, 70, 80, 90],
          ),
        ).toBe(true)
  
        expect(
          compareRecommendationValues(
            "ACTIVE",
            "IN",
            [
              "NEW",
              "ACTIVE",
              "CLOSED",
            ],
          ),
        ).toBe(true)
      })
  
      it("deve retornar false quando o valor não estiver na lista", () => {
        expect(
          compareRecommendationValues(
            50,
            "IN",
            [60, 70, 80, 90],
          ),
        ).toBe(false)
      })
  
      it("deve retornar false quando o valor esperado não for uma lista", () => {
        expect(
          compareRecommendationValues(
            80,
            "IN",
            80,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            80,
            "IN",
            null,
          ),
        ).toBe(false)
      })
  
      it("deve utilizar comparação estrita dentro da lista", () => {
        expect(
          compareRecommendationValues(
            80,
            "IN",
            ["80"],
          ),
        ).toBe(false)
      })
    })
  
    describe("NOT_IN", () => {
      it("deve retornar true quando o valor não estiver na lista", () => {
        expect(
          compareRecommendationValues(
            80,
            "NOT_IN",
            [10, 20, 30],
          ),
        ).toBe(true)
      })
  
      it("deve retornar false quando o valor estiver na lista", () => {
        expect(
          compareRecommendationValues(
            80,
            "NOT_IN",
            [60, 70, 80, 90],
          ),
        ).toBe(false)
      })
  
      it("deve retornar false quando o valor esperado não for uma lista", () => {
        expect(
          compareRecommendationValues(
            80,
            "NOT_IN",
            70,
          ),
        ).toBe(false)
  
        expect(
          compareRecommendationValues(
            80,
            "NOT_IN",
            undefined,
          ),
        ).toBe(false)
      })
  
      it("deve utilizar comparação estrita dentro da lista", () => {
        expect(
          compareRecommendationValues(
            80,
            "NOT_IN",
            ["80"],
          ),
        ).toBe(true)
      })
    })
  })