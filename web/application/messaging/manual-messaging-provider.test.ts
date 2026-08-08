import {
  ManualMessagingProvider,
} from "./manual-messaging-provider"

describe("ManualMessagingProvider", () => {
  const provider =
    new ManualMessagingProvider()

  it("normaliza mensagem manual sem fingir ID externo", () => {
    const occurredAt =
      new Date("2026-08-08T15:00:00.000Z")

    expect(
      provider.normalizeInbound({
        conversationId: " journey-1 ",
        contactId: " lead-1 ",
        text: "  Quero entender a proposta.  ",
        occurredAt,
      }),
    ).toEqual({
      messageId: null,
      conversationId: "journey-1",
      contactId: "lead-1",
      direction: "INBOUND",
      text: "Quero entender a proposta.",
      occurredAt,
      provider: "MANUAL",
    })
  })

  it.each([
    {
      conversationId: " ",
      text: "mensagem",
      expected: /conversationId/,
    },
    {
      conversationId: "journey-1",
      text: " ",
      expected: /texto da mensagem/,
    },
  ])(
    "rejeita entrada manual incompleta: $expected",
    ({
      conversationId,
      text,
      expected,
    }) => {
      expect(() =>
        provider.normalizeInbound({
          conversationId,
          text,
        }),
      ).toThrow(expected)
    },
  )
})
