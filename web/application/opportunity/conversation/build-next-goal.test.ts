import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildNextGoal,
} from "./build-next-goal"

describe(
  "buildNextGoal",
  () => {
    it(
      "novo atendimento inicia buscando a primeira resposta",
      () => {
        expect(
          buildNextGoal({
            approachType: "new",
            stage: "opening",
          }),
        ).toMatchObject({
          goal: "get_first_response",
        })
      },
    )

    it(
      "reativação inicia atualizando o momento",
      () => {
        expect(
          buildNextGoal({
            approachType: "reactivation",
            stage: "opening",
          }),
        ).toMatchObject({
          goal: "understand_timing",
        })
      },
    )

    it(
      "descoberta procura finalidade",
      () => {
        expect(
          buildNextGoal({
            approachType: "new",
            stage: "discovery",
          }),
        ).toMatchObject({
          goal:
            "understand_project_purpose",
        })
      },
    )

    it(
      "qualificação procura orçamento",
      () => {
        expect(
          buildNextGoal({
            approachType: "new",
            stage: "qualification",
          }),
        ).toMatchObject({
          goal:
            "understand_budget",
        })
      },
    )

    it(
      "meeting agenda conversa",
      () => {
        expect(
          buildNextGoal({
            approachType: "new",
            stage: "meeting",
          }),
        ).toMatchObject({
          goal:
            "schedule_meeting",
        })
      },
    )
  },
)