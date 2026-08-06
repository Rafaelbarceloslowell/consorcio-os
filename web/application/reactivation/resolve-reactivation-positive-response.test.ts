import {
  describe,
  expect,
  it,
} from "vitest"

import {
  resolveCheckResumeAfterPositiveResponse,
  resolveReactivationPositiveResponse,
} from "./resolve-reactivation-positive-response"

describe(
  "resolveReactivationPositiveResponse",
  () => {
    it(
      "encerra a reativação e volta ao atendimento ativo quando o cliente demonstra interesse",
      () => {
        expect(
          resolveReactivationPositiveResponse({
            reactivationActive:
              true,
            customerReplied:
              true,
            intent:
              "POSITIVE_INTEREST",
          }),
        ).toMatchObject({
          handled:
            true,
          stopReactivationSequence:
            true,
          serviceState:
            "ACTIVE_CONVERSATION",
          checkRestartBlocked:
            true,
          objective:
            "RESPOND_AND_QUALIFY",
        })
      },
    )

    it(
      "prioriza a reunião quando ela já foi marcada",
      () => {
        expect(
          resolveReactivationPositiveResponse({
            reactivationActive:
              true,
            customerReplied:
              true,
            intent:
              "POSITIVE_INTEREST",
            meetingScheduled:
              true,
          }).objective,
        ).toBe(
          "PREPARE_MEETING",
        )
      },
    )

    it(
      "prioriza o próximo passo quando ele já está definido",
      () => {
        expect(
          resolveReactivationPositiveResponse({
            reactivationActive:
              true,
            customerReplied:
              true,
            intent:
              "POSITIVE_INTEREST",
            nextStepDefined:
              true,
          }).objective,
        ).toBe(
          "HONOR_NEXT_STEP",
        )
      },
    )

    it(
      "não inventa resposta positiva quando a intenção é incerta",
      () => {
        expect(
          resolveReactivationPositiveResponse({
            reactivationActive:
              true,
            customerReplied:
              true,
            intent:
              "UNCLEAR",
          }),
        ).toMatchObject({
          handled:
            false,
          stopReactivationSequence:
            false,
          serviceState:
            "REACTIVATION",
        })
      },
    )
  },
)

describe(
  "resolveCheckResumeAfterPositiveResponse",
  () => {
    it(
      "mantém os Checks bloqueados enquanto não existe nova ausência",
      () => {
        expect(
          resolveCheckResumeAfterPositiveResponse({
            positiveResponseRecorded:
              true,
            newNoResponseDetected:
              false,
            maestroAuthorizedNewCadence:
              false,
          }),
        ).toMatchObject({
          allowed:
            false,
          reasonCode:
            "NO_NEW_ABSENCE",
        })
      },
    )

    it(
      "exige autorização do Maestro depois de uma nova ausência",
      () => {
        expect(
          resolveCheckResumeAfterPositiveResponse({
            positiveResponseRecorded:
              true,
            newNoResponseDetected:
              true,
            maestroAuthorizedNewCadence:
              false,
          }),
        ).toMatchObject({
          allowed:
            false,
          reasonCode:
            "MAESTRO_AUTHORIZATION_REQUIRED",
        })
      },
    )

    it(
      "não reinicia Checks quando existe reunião",
      () => {
        expect(
          resolveCheckResumeAfterPositiveResponse({
            positiveResponseRecorded:
              true,
            newNoResponseDetected:
              true,
            maestroAuthorizedNewCadence:
              true,
            meetingScheduled:
              true,
          }).reasonCode,
        ).toBe(
          "MEETING_ACTIVE",
        )
      },
    )

    it(
      "libera nova cadência somente com nova ausência e autorização oficial",
      () => {
        expect(
          resolveCheckResumeAfterPositiveResponse({
            positiveResponseRecorded:
              true,
            newNoResponseDetected:
              true,
            maestroAuthorizedNewCadence:
              true,
          }),
        ).toMatchObject({
          allowed:
            true,
          reasonCode:
            "AUTHORIZED",
        })
      },
    )
  },
)
