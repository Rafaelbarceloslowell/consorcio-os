import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  Consortium,
} from "@/types/domain"

import {
  evaluateConsortiumOptions,
} from "./evaluate-consortium-options"

const NOW =
  new Date(
    "2026-08-08T12:00:00.000Z",
  )

function candidate(
  overrides:
    Partial<Consortium> = {},
): Consortium {
  return {
    id: "catalog-1",
    name: "Plano verificado",
    administrator:
      "Administradora verificada",
    type: "real_estate",
    groupNumber: "grupo-1",
    minCreditValue: 100000,
    maxCreditValue: 600000,
    defaultTermMonths: 180,
    administrationFeePercent: 0,
    reserveFundPercent: 0,
    totalQuotas: 0,
    availableQuotas: 0,
    status: "active",
    ruleStatus: "verified",
    ruleSource:
      "operator_verified",
    sourceReference:
      "Documento interno validado pelo operador",
    verifiedAt:
      "2026-08-01T12:00:00.000Z",
    effectiveFrom:
      "2026-08-01T12:00:00.000Z",
    effectiveUntil:
      "2026-12-31T23:59:59.000Z",
    ruleVersion: 2,
    minInstallmentValue: 1000,
    maxInstallmentValue: 6000,
    embeddedBidAllowed: true,
    createdAt:
      "2026-08-01T12:00:00.000Z",
    updatedAt:
      "2026-08-01T12:00:00.000Z",
    ...overrides,
  }
}

const PROFILE = {
  assetCategory:
    "real_estate" as const,
  desiredCredit: 400000,
  comfortableInstallment: 3500,
  targetTimelineMonths: 180,
  ownBidCapital: 50000,
  embeddedBidPreference: true,
}

describe(
  "Consortium Intelligence Engine",
  () => {
    it(
      "não inventa produto quando o catálogo está vazio",
      () => {
        const result =
          evaluateConsortiumOptions({
            profile: PROFILE,
            candidates: [],
            now: NOW,
          })

        expect(result).toMatchObject({
          status: "NO_CATALOG",
          candidates: [],
          topOptions: [],
        })
        expect(result.explanation).toContain(
          "nenhum produto específico",
        )
      },
    )

    it(
      "não ranqueia regra sem fonte verificada",
      () => {
        const result =
          evaluateConsortiumOptions({
            profile: PROFILE,
            candidates: [
              candidate({
                ruleStatus:
                  "unverified",
                ruleSource: undefined,
                verifiedAt: undefined,
              }),
            ],
            now: NOW,
          })

        expect(result.status).toBe(
          "NO_VERIFIED_OPTIONS",
        )
        expect(result.topOptions).toEqual(
          [],
        )
        expect(result.candidates[0])
          .toMatchObject({
            eligibility: "UNKNOWN",
            fitScore: null,
            sourceFreshness:
              "UNVERIFIED",
          })
      },
    )

    it(
      "marca regra expirada como stale e exige confirmação",
      () => {
        const result =
          evaluateConsortiumOptions({
            profile: PROFILE,
            candidates: [
              candidate({
                effectiveUntil:
                  "2026-08-07T23:59:59.000Z",
              }),
            ],
            now: NOW,
          })

        expect(result.candidates[0])
          .toMatchObject({
            eligibility: "UNKNOWN",
            sourceFreshness: "STALE",
          })
        expect(
          result.candidates[0]
            .ruleWarnings.join(" "),
        ).toContain("STALE_RULE")
      },
    )

    it(
      "retorna dados faltantes sem forçar todos os campos",
      () => {
        const result =
          evaluateConsortiumOptions({
            profile: {
              assetCategory:
                "real_estate",
            },
            candidates: [candidate()],
            now: NOW,
          })

        expect(result.status).toBe(
          "INSUFFICIENT_DATA",
        )
        expect(result.missingData).toEqual(
          expect.arrayContaining([
            "desiredCredit",
            "comfortableInstallment",
            "targetTimeline",
          ]),
        )
      },
    )

    it(
      "avalia opção verificada elegível com score explicável",
      () => {
        const result =
          evaluateConsortiumOptions({
            profile: PROFILE,
            candidates: [candidate()],
            now: NOW,
          })

        expect(result.status).toBe(
          "OPTIONS_AVAILABLE",
        )
        expect(result.topOptions).toHaveLength(
          1,
        )
        expect(result.topOptions[0])
          .toMatchObject({
            candidateId: "catalog-1",
            eligibility: "ELIGIBLE",
            sourceFreshness: "CURRENT",
            ruleVersion: 2,
          })
        expect(
          result.topOptions[0]
            .fitScore,
        ).toBeGreaterThan(0)
        expect(
          result.topOptions[0]
            .reasons.join(" "),
        ).toContain("Crédito desejado")
      },
    )

    it(
      "aplica hard rule antes do score para crédito e categoria",
      () => {
        const outsideCredit =
          evaluateConsortiumOptions({
            profile: {
              ...PROFILE,
              desiredCredit: 900000,
            },
            candidates: [candidate()],
            now: NOW,
          })
        const wrongAsset =
          evaluateConsortiumOptions({
            profile: PROFILE,
            candidates: [
              candidate({
                type: "vehicle",
              }),
            ],
            now: NOW,
          })

        for (const result of [
          outsideCredit,
          wrongAsset,
        ]) {
          expect(result.status).toBe(
            "NO_ELIGIBLE_OPTIONS",
          )
          expect(result.candidates[0])
            .toMatchObject({
              eligibility:
                "NOT_ELIGIBLE",
              fitScore: null,
            })
        }
      },
    )

    it(
      "aplica restrição conhecida de parcela",
      () => {
        const result =
          evaluateConsortiumOptions({
            profile: {
              ...PROFILE,
              comfortableInstallment:
                500,
            },
            candidates: [candidate()],
            now: NOW,
          })

        expect(result.candidates[0])
          .toMatchObject({
            eligibility:
              "NOT_ELIGIBLE",
            fitScore: null,
          })
        expect(
          result.candidates[0]
            .constraints.join(" "),
        ).toContain(
          "abaixo do mínimo verificado",
        )
      },
    )

    it(
      "retorna somente as opções elegíveis e no máximo três",
      () => {
        const candidates = [
          candidate({
            id: "best",
            minCreditValue: 300000,
            maxCreditValue: 500000,
          }),
          candidate({ id: "second" }),
          candidate({
            id: "third",
            defaultTermMonths: 200,
          }),
          candidate({
            id: "fourth",
            defaultTermMonths: 240,
          }),
          candidate({
            id: "ineligible",
            maxCreditValue: 200000,
          }),
        ]

        const result =
          evaluateConsortiumOptions({
            profile: PROFILE,
            candidates,
            now: NOW,
          })

        expect(result.topOptions).toHaveLength(
          3,
        )
        expect(
          result.topOptions.map(
            (item) => item.candidateId,
          ),
        ).not.toContain("ineligible")
        expect(result.topOptions[0].candidateId)
          .toBe("best")
      },
    )

    it(
      "nunca produz garantia ou pseudo-probabilidade de contemplação",
      () => {
        const result =
          evaluateConsortiumOptions({
            profile: PROFILE,
            candidates: [candidate()],
            now: NOW,
          })
        const serialized =
          JSON.stringify(result)

        expect(result.warnings.join(" "))
          .toContain(
            "Nenhuma opção ou estratégia garante",
          )
        expect(serialized).not.toMatch(
          /chance|probabilidadePercent|vai contemplar|contempla em/iu,
        )
      },
    )
  },
)
