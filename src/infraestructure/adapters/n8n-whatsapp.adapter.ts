import { z } from 'zod';

const MessageSchema = z.object({
  username: z.string(),
  userPhoneNumber: z.string(),
  waMessageId: z.string(),
  timestamp: z.string(),
  waMessage: z.string(),
  type: z.string(),
});

const PayloadSchema = z.object({
  waBusinessId: z.string(),
  waBusinessPhoneNumberId: z.string(),
  messages: z.array(MessageSchema),
  statuses: z.array(z.any()).optional(),
});

export interface WhatsAppInboundMessage {
  conversationId: string;
  waBusinessId: string;
  waBusinessPhoneNumberId: string;
  userPhoneNumber: string;
  username: string;
  input: string;
  messageIds: string[];
}

export const adaptN8nWhatsappToConversationInput = (
  body: unknown
): WhatsAppInboundMessage[] => {
  const payload = PayloadSchema.parse(body);

  // Group by conversationId
  const map = new Map<string, WhatsAppInboundMessage>();
  for (const msg of payload.messages) {
    const conversationId = `${payload.waBusinessPhoneNumberId}:${msg.userPhoneNumber}`;
    const existing = map.get(conversationId);

    if (existing) {
      existing.input = `${existing.input}\n${msg.waMessage.trim()}`.trim();
      existing.messageIds.push(msg.waMessageId);
    } else {
      map.set(conversationId, {
        conversationId,
        waBusinessId: payload.waBusinessId,
        waBusinessPhoneNumberId: payload.waBusinessPhoneNumberId,
        userPhoneNumber: msg.userPhoneNumber,
        username: msg.username,
        input: msg.waMessage.trim(),
        messageIds: [msg.waMessageId],
      });
    }
  }

  return [...map.values()];
};
