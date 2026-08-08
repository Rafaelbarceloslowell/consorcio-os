import { readFileSync } from "node:fs"

import {
  describe,
  expect,
  it,
} from "vitest"

import {
  readStagingBootstrapConfiguration,
  stagingJourneyPhases,
  stagingJourneyStates,
  stagingPipelineStages,
} from "./staging-bootstrap-data"

describe("staging bootstrap data", () => {
  it("mantém o entrypoint compatível com o output CommonJS do tsx", () => {
    const source = readFileSync(
      new URL(
        "./bootstrap-staging.ts",
        import.meta.url,
      ),
      "utf8",
    )

    expect(source).not.toMatch(/^await\s/m)
    expect(source).toContain("void main()")
  })

  it("exige confirmação explícita e os identificadores do staging", () => {
    expect(() =>
      readStagingBootstrapConfiguration({
        STAGING_BOOTSTRAP_CONFIRM:
          "PRODUCTION",
        STAGING_CONSULTANT_EMAIL:
          "qa@example.test",
        WORKSPACE_SLUG:
          "gorillaos-staging",
      }),
    ).toThrow(
      "STAGING_BOOTSTRAP_CONFIRM deve ser exatamente STAGING.",
    )
  })

  it("normaliza somente a identidade de autorização informada", () => {
    expect(
      readStagingBootstrapConfiguration({
        STAGING_BOOTSTRAP_CONFIRM:
          "STAGING",
        STAGING_CONSULTANT_EMAIL:
          "  QA@Example.Test  ",
        WORKSPACE_SLUG:
          "gorillaos-staging",
      }),
    ).toEqual({
      consultantEmail:
        "qa@example.test",
      workspaceSlug:
        "gorillaos-staging",
    })
  })

  it("define uma fundação comercial completa e não ambígua", () => {
    expect(stagingPipelineStages).toHaveLength(7)
    expect(stagingJourneyPhases).toHaveLength(6)
    expect(stagingJourneyStates).toHaveLength(15)
    expect(
      stagingPipelineStages.filter(
        (stage) => stage.isWonStage,
      ),
    ).toHaveLength(1)
    expect(
      stagingJourneyStates.filter(
        (state) =>
          "isInitial" in state &&
          state.isInitial,
      ),
    ).toHaveLength(1)
    expect(
      stagingJourneyStates.filter(
        (state) =>
          "isWon" in state &&
          state.isWon,
      ),
    ).toHaveLength(1)
    expect(
      stagingJourneyStates.filter(
        (state) =>
          "isLost" in state &&
          state.isLost,
      ),
    ).toHaveLength(1)
  })
})
