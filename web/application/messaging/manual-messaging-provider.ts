import type {
  MessagingProvider,
  NormalizedMessage,
} from "./messaging-provider"

export type ManualInboundMessage = Readonly<{
  conversationId: string
  contactId?: string | null
  text: string
  occurredAt?: Date
}>

export class ManualMessagingProvider
  implements MessagingProvider<ManualInboundMessage> {
  readonly provider = "MANUAL" as const

  normalizeInbound(
    message: ManualInboundMessage,
  ): NormalizedMessage {
    const conversationId =
      message.conversationId.trim()
    const text =
      message.text.trim()
    const contactId =
      message.contactId?.trim() || null
    const occurredAt =
      message.occurredAt ?? new Date()

    if (!conversationId) {
      throw new Error(
        "conversationId é obrigatório.",
      )
    }

    if (!text) {
      throw new Error(
        "O texto da mensagem é obrigatório.",
      )
    }

    if (
      Number.isNaN(
        occurredAt.getTime(),
      )
    ) {
      throw new Error(
        "O horário da mensagem é inválido.",
      )
    }

    return {
      messageId: null,
      conversationId,
      contactId,
      direction: "INBOUND",
      text,
      occurredAt,
      provider: this.provider,
    }
  }
}

export const manualMessagingProvider =
  new ManualMessagingProvider()
