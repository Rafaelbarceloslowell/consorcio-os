import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    recommendationRuleMatches,
  } from "./matcher"
  
  import type {
    RecommendationRuleContext,
  } from "./types"
  
  import type {
    WorkflowRule,
  } from "@/types/domain"
  
  function createContext(
    overrides: Partial<RecommendationRuleContext> = {},
  ): RecommendationRuleContext {
    return {
      daysSinceLastInteraction: 10,
      score: 80,
      isClosed: false,
      ...overrides,
    }
  }
  
  function createRule(
    overrides: Partial<WorkflowRule> = {},
  ): WorkflowRule {
    return {
      id: "rule-1",
      workspaceId: "workspace-1",
      name: "Rule",
      description: "",
      isActive: true,
      priority: 1,
      conditions: [],
      actions: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...overrides,
    } as WorkflowRule
  }
  
  describe("recommendationRuleMatches", () => {
    it("deve retornar true quando todas as condições forem satisfeitas", () => {
      const rule = createRule({
        conditions: [
          {
            field: "score",
            operator: "GREATER_THAN",
            value: 70,
          },
          {
            field: "isClosed",
            operator: "EQUALS",
            value: false,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext(),
        ),
      ).toBe(true)
    })
  
    it("deve retornar false quando qualquer condição falhar", () => {
      const rule = createRule({
        conditions: [
          {
            field: "score",
            operator: "GREATER_THAN",
            value: 90,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext(),
        ),
      ).toBe(false)
    })
  
    it("deve retornar false para regra inativa", () => {
      const rule = createRule({
        isActive: false,
        conditions: [
          {
            field: "score",
            operator: "GREATER_THAN",
            value: 10,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext(),
        ),
      ).toBe(false)
    })
  
    it("deve retornar true quando a regra não possuir condições", () => {
      expect(
        recommendationRuleMatches(
          createRule(),
          createContext(),
        ),
      ).toBe(true)
    })
  
    it("deve exigir que todas as condições sejam verdadeiras", () => {
      const rule = createRule({
        conditions: [
          {
            field: "score",
            operator: "GREATER_THAN",
            value: 50,
          },
          {
            field: "daysSinceLastInteraction",
            operator: "LESS_THAN",
            value: 5,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext(),
        ),
      ).toBe(false)
    })
  
    it("deve validar campos booleanos", () => {
      const rule = createRule({
        conditions: [
          {
            field: "isClosed",
            operator: "EQUALS",
            value: true,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext({
            isClosed: true,
          }),
        ),
      ).toBe(true)
    })
  
    it("deve validar valores nulos", () => {
      const rule = createRule({
        conditions: [
          {
            field: "daysSinceLastInteraction",
            operator: "NOT_EXISTS",
            value: null,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext({
            daysSinceLastInteraction: null,
          }),
        ),
      ).toBe(true)
    })
  
    it("deve retornar false para campo inexistente", () => {
      const rule = createRule({
        conditions: [
          {
            field: "unknownField",
            operator: "EXISTS",
            value: null,
          } as never,
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext(),
        ),
      ).toBe(false)
    })
  
    it("deve suportar comparação de score", () => {
      const rule = createRule({
        conditions: [
          {
            field: "score",
            operator: "GREATER_THAN_OR_EQUAL",
            value: 80,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext(),
        ),
      ).toBe(true)
    })
  
    it("deve suportar comparação de dias desde a última interação", () => {
      const rule = createRule({
        conditions: [
          {
            field: "daysSinceLastInteraction",
            operator: "LESS_THAN_OR_EQUAL",
            value: 10,
          },
        ],
      })
  
      expect(
        recommendationRuleMatches(
          rule,
          createContext(),
        ),
      ).toBe(true)
    })
  })