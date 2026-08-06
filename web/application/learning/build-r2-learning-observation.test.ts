import {
  describe,
  expect,
  it,
} from "vitest"

import {
  buildR2LearningObservation,
} from "./build-r2-learning-observation"

function build(
  overrides: Partial<
    Parameters<
      typeof buildR2LearningObservation
    >[0]
  > = {},
) {
  return buildR2LearningObservation({
    opportunityId:
      "journey-1",
    consultantId:
      "consultant-1",
    contactName:
      "Marina",
    sourceIncomingMessage:
      "Cliente perguntou como funciona.",
    originalSuggestion:
      "Podemos conversar amanhã?",
    finalSentMessage:
      "Marina, podemos conversar amanhã às 10h?",
    customerResponse:
      "Sim, pode ser.",
    outcome:
      "MEETING_SCHEDULED",
    intent:
      "meeting_interest",
    stage:
      "meeting",
    goal:
      "schedule_meeting",
    notes:
      null,
    recordedAt:
      new Date(
        "2026-08-06T12:00:00.000Z",
      ),
    ...overrides,
  })
}

describe(
  "buildR2LearningObservation",
  () => {
    it(
      "registra a sugestão, a edição, a resposta e o resultado",
      () => {
        expect(
          build(),
        ).toMatchObject({
          schemaVersion:
            "1.0",
          consultantEdited:
            true,
          customerResponded:
            true,
          outcome:
            "MEETING_SCHEDULED",
          signal:
            "POSITIVE",
          reviewStatus:
            "PENDING_HUMAN_REVIEW",
          humanReviewRequired:
            true,
          automaticModelUpdateApplied:
            false,
          recordedAt:
            "2026-08-06T12:00:00.000Z",
        })
      },
    )

    it(
      "não considera mudança apenas de espaços como edição",
      () => {
        expect(
          build({
            originalSuggestion:
              "Oi, Marina. Tudo bem?",
            finalSentMessage:
              "  Oi,   Marina. Tudo bem?  ",
          }).consultantEdited,
        ).toBe(
          false,
        )
      },
    )

    it(
      "considera alteração real do consultor",
      () => {
        expect(
          build({
            originalSuggestion:
              "Podemos conversar?",
            finalSentMessage:
              "Podemos conversar amanhã às 10h?",
          }).consultantEdited,
        ).toBe(
          true,
        )
      },
    )

    it(
      "aceita ausência de resposta sem inventar mensagem do cliente",
      () => {
        expect(
          build({
            customerResponse:
              null,
            outcome:
              "NO_RESPONSE",
          }),
        ).toMatchObject({
          customerResponse:
            null,
          customerResponded:
            false,
          signal:
            "NO_RESPONSE",
        })
      },
    )

    it(
      "exige resposta quando o resultado pressupõe manifestação do cliente",
      () => {
        expect(
          () =>
            build({
              customerResponse:
                null,
              outcome:
                "POSITIVE_RESPONSE",
            }),
        ).toThrow(
          "Informe a resposta do cliente",
        )
      },
    )

    it(
      "bloqueia resposta textual com resultado sem resposta",
      () => {
        expect(
          () =>
            build({
              customerResponse:
                "Gostei.",
              outcome:
                "NO_RESPONSE",
            }),
        ).toThrow(
          "não pode conter uma resposta",
        )
      },
    )

    it.each([
      [
        "POSITIVE_RESPONSE",
        "POSITIVE",
      ],
      [
        "NEGATIVE_RESPONSE",
        "NEGATIVE",
      ],
      [
        "FOLLOW_UP_SCHEDULED",
        "NEUTRAL",
      ],
      [
        "OTHER",
        "UNKNOWN",
      ],
    ] as const)(
      "mapeia %s para o sinal %s",
      (
        outcome,
        signal,
      ) => {
        expect(
          build({
            outcome,
            customerResponse:
              "Resposta.",
          }).signal,
        ).toBe(signal)
      },
    )

    it(
      "não permite observação sem sugestão original",
      () => {
        expect(
          () =>
            build({
              originalSuggestion:
                " ",
            }),
        ).toThrow(
          "Sugestão original do R2 é obrigatório",
        )
      },
    )
  },
)
