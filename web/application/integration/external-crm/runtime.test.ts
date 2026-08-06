import {
  describe,
  expect,
  it,
} from "vitest"

import type {
  ExternalCrmConnector,
} from "./connector"

import {
  MockMaestroConnector,
} from "./mock-maestro-connector"

import {
  ExternalCrmConnectorRegistry,
} from "./registry"

import {
  resolveExternalCrmRuntime,
} from "./runtime"

describe(
  "resolveExternalCrmRuntime",
  () => {
    it(
      "mantém modo standalone sem conector",
      () => {
        const runtime =
          resolveExternalCrmRuntime({
            configuration: {
              mode:
                "STANDALONE",
              enabled:
                false,
              providerId:
                null,
              readOnly:
                true,
            },
            registry:
              new ExternalCrmConnectorRegistry(),
          })

        expect(runtime).toEqual({
          mode:
            "STANDALONE",
          enabled:
            false,
          providerId:
            null,
          connector:
            null,
          readOnly:
            true,
        })
      },
    )

    it(
      "resolve o conector selecionado no modo integrado",
      () => {
        const connector =
          new MockMaestroConnector()

        const runtime =
          resolveExternalCrmRuntime({
            configuration: {
              mode:
                "INTEGRATED",
              enabled:
                true,
              providerId:
                "MOCK_MAESTRO",
              readOnly:
                true,
            },
            registry:
              new ExternalCrmConnectorRegistry([
                connector,
              ]),
          })

        expect(
          runtime.connector,
        ).toBe(
          connector,
        )
      },
    )

    it(
      "bloqueia conector com capacidade de escrita",
      () => {
        const connector: ExternalCrmConnector = {
          ...new MockMaestroConnector(),
          providerId:
            "WRITABLE_MOCK",
          capabilities: {
            healthRead:
              true,
            consultantsRead:
              true,
            leadsRead:
              true,
            cadenceRead:
              true,
            timelineRead:
              true,
            meetingsRead:
              true,
            writes:
              true,
          },
          getHealth:
            async () =>
              new MockMaestroConnector()
                .getHealth(),
          listConsultants:
            async () =>
              [],
          listLeads:
            async () => ({
              items: [],
              nextCursor:
                null,
              hasMore:
                false,
              synchronizedAt:
                "2026-08-05T22:00:00.000Z",
            }),
          getLead:
            async () =>
              null,
          getLeadCadence:
            async () =>
              null,
          getLeadTimeline:
            async () =>
              [],
          listMeetings:
            async () =>
              [],
          getMeeting:
            async () =>
              null,
        }

        expect(
          () =>
            resolveExternalCrmRuntime({
              configuration: {
                mode:
                  "INTEGRATED",
                enabled:
                  true,
                providerId:
                  "WRITABLE_MOCK",
                readOnly:
                  true,
              },
              registry:
                new ExternalCrmConnectorRegistry([
                  connector,
                ]),
            }),
        ).toThrow(
          "aceita somente leitura",
        )
      },
    )
  },
)
