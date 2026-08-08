export type MessageDirection =
  | "INBOUND"
  | "OUTBOUND"

export type MessageProvider =
  | "MANUAL"
  | "META_WHATSAPP_CLOUD_API"

export type NormalizedMessage = Readonly<{
  messageId: string | null
  conversationId: string
  contactId: string | null
  direction: MessageDirection
  text: string
  occurredAt: Date
  provider: MessageProvider
}>

export interface MessagingProvider<TRawMessage> {
  readonly provider: MessageProvider

  normalizeInbound(
    message: TRawMessage,
  ): NormalizedMessage
}
