import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    CommercialJourney,
    WorkflowRule,
    WorkflowRuleAction,
  } from "@/types/domain"
  
  import {
    createRecommendationFromRule,
  } from "./factory"
  
  const NOW = new Date(
    "2026-07-21T15:00:00.000Z",
  )
  
  function createJourney(): CommercialJourney {
    return {
      id: "journey-1",
      workspaceId: "workspace-1",
    } as CommercialJourney
  }
  
  function createValidPayload(): Record<
    string,
    unknown
  > {
    return {
      recommendationType: "SEND_MESSAGE",
      title: "Entrar em contato com o lead",
      description:
        "Enviar uma mensagem de acompanhamento.",
      reason:
        "O lead está há vários dias sem interação.",
      confidence: 0.9,
      priority: "HIGH",
      expiresInHours: 24,
    }
  }
  
  function createAutomationAction(
    payload: Record<string, unknown> =
      createValidPayload(),
  ): WorkflowRuleAction {
    return {
      type: "TRIGGER_AUTOMATION",
      payload,
    }
  }
  
  function createRule(
    overrides: Partial<WorkflowRule> = {},
  ): WorkflowRule {
    return {
      id: "rule-1",
      workspaceId: "workspace-1",
      name: "Recomendar contato",
      description:
        "Cria recomendação de contato.",
      eventType: "JOURNEY_EVALUATED",
      conditions: [],
      actions: [
        createAutomationAction(),
      ],
      priority: 1,
      stopProcessingAfterMatch: false,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...overrides,
    }
  }
  
  describe("createRecommendationFromRule", () => {
    it("deve criar uma recomendação válida a partir da regra", () => {
      const result =
        createRecommendationFromRule(
          createRule(),
          createJourney(),
          NOW,
        )
  
      expect(result).not.toBeNull()
  
      expect(result).toMatchObject({
        id: [
          "journey-1",
          "rule-1",
          NOW.toISOString(),
        ].join(":"),
        workspaceId: "workspace-1",
        journeyId: "journey-1",
        actionType: "SEND_MESSAGE",
        title: "Entrar em contato com o lead",
        description:
          "Enviar uma mensagem de acompanhamento.",
        reason:
          "O lead está há vários dias sem interação.",
        confidence: 0.9,
        priority: "HIGH",
        source: "RULE_ENGINE",
      })
    })
  
    it("deve usar os dados da jornada na recomendação", () => {
      const journey = {
        ...createJourney(),
        id: "journey-custom",
        workspaceId: "workspace-custom",
      }
  
      const result =
        createRecommendationFromRule(
          createRule(),
          journey,
          NOW,
        )
  
      expect(result).toMatchObject({
        workspaceId: "workspace-custom",
        journeyId: "journey-custom",
      })
    })
  
    it("deve gerar o id usando jornada, regra e timestamp", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            id: "rule-custom",
          }),
          {
            ...createJourney(),
            id: "journey-custom",
          },
          NOW,
        )
  
      expect(result?.id).toBe(
        [
          "journey-custom",
          "rule-custom",
          "2026-07-21T15:00:00.000Z",
        ].join(":"),
      )
    })
  
    it("deve definir os timestamps de criação e atualização", () => {
      const result =
        createRecommendationFromRule(
          createRule(),
          createJourney(),
          NOW,
        )
  
      expect(result?.createdAt).toBe(
        NOW.toISOString(),
      )
  
      expect(result?.updatedAt).toBe(
        NOW.toISOString(),
      )
    })
  
    it("deve calcular expiresAt usando expiresInHours", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                expiresInHours: 24,
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result?.expiresAt).toBe(
        "2026-07-22T15:00:00.000Z",
      )
    })
  
    it("deve usar 48 horas como expiração padrão", () => {
      const {
        expiresInHours: _expiresInHours,
        ...payloadWithoutExpiration
      } = createValidPayload()
  
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction(
                payloadWithoutExpiration,
              ),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result?.expiresAt).toBe(
        "2026-07-23T15:00:00.000Z",
      )
    })
  
    it("deve usar 48 horas quando expiresInHours não for number", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                expiresInHours: "24",
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result?.expiresAt).toBe(
        "2026-07-23T15:00:00.000Z",
      )
    })
  
    it("deve iniciar os estados de decisão como null", () => {
      const result =
        createRecommendationFromRule(
          createRule(),
          createJourney(),
          NOW,
        )
  
      expect(result).toMatchObject({
        acceptedAt: null,
        rejectedAt: null,
        executedActionId: null,
      })
    })
  
    it("deve retornar null quando não existir ação TRIGGER_AUTOMATION", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              {
                type: "CREATE_TASK",
                payload: {},
              },
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve utilizar a primeira ação TRIGGER_AUTOMATION encontrada", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                title: "Primeira recomendação",
              }),
              createAutomationAction({
                ...createValidPayload(),
                title: "Segunda recomendação",
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result?.title).toBe(
        "Primeira recomendação",
      )
    })
  
    it("deve retornar null para recommendationType diferente de SEND_MESSAGE", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                recommendationType:
                  "CREATE_TASK",
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando recommendationType não for string", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                recommendationType: 123,
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando title estiver ausente", () => {
      const {
        title: _title,
        ...payloadWithoutTitle
      } = createValidPayload()
  
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction(
                payloadWithoutTitle,
              ),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando title não for string", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                title: 123,
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando description estiver ausente", () => {
      const {
        description: _description,
        ...payloadWithoutDescription
      } = createValidPayload()
  
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction(
                payloadWithoutDescription,
              ),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando description não for string", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                description: 123,
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando reason estiver ausente", () => {
      const {
        reason: _reason,
        ...payloadWithoutReason
      } = createValidPayload()
  
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction(
                payloadWithoutReason,
              ),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando reason não for string", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                reason: false,
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando confidence estiver ausente", () => {
      const {
        confidence: _confidence,
        ...payloadWithoutConfidence
      } = createValidPayload()
  
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction(
                payloadWithoutConfidence,
              ),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando confidence não for number", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                confidence: "0.9",
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando priority estiver ausente", () => {
      const {
        priority: _priority,
        ...payloadWithoutPriority
      } = createValidPayload()
  
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction(
                payloadWithoutPriority,
              ),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando priority for diferente de HIGH", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                priority: "NORMAL",
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve retornar null quando priority não for string", () => {
      const result =
        createRecommendationFromRule(
          createRule({
            actions: [
              createAutomationAction({
                ...createValidPayload(),
                priority: 1,
              }),
            ],
          }),
          createJourney(),
          NOW,
        )
  
      expect(result).toBeNull()
    })
  
    it("deve rejeitar strings vazias nos campos obrigatórios", () => {
      const invalidPayloads = [
        {
          ...createValidPayload(),
          title: "",
        },
        {
          ...createValidPayload(),
          description: "",
        },
        {
          ...createValidPayload(),
          reason: "",
        },
      ]
  
      for (const payload of invalidPayloads) {
        const result =
          createRecommendationFromRule(
            createRule({
              actions: [
                createAutomationAction(
                  payload,
                ),
              ],
            }),
            createJourney(),
            NOW,
          )
  
        expect(result).toBeNull()
      }
    })
  
    it("não deve alterar a data recebida", () => {
      const originalTimestamp =
        NOW.toISOString()
  
      createRecommendationFromRule(
        createRule(),
        createJourney(),
        NOW,
      )
  
      expect(NOW.toISOString()).toBe(
        originalTimestamp,
      )
    })
  })