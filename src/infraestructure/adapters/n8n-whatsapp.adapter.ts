import { InteractionOption } from '@domain/enums/interaction-option.enum';
import { z } from 'zod';
import { InteractionOptionAdapter } from './interaction-option.adapter';

const MessageSchema = z.object({
  waMessageId: z.string(),
  username: z.string(),
  userPhoneNumber: z.string(),
  waMessage: z.string(),
  waUserSelection: z.string().optional(),
  type: z.string(),
  timestamp: z.string(),
});

const PayloadSchema = z.object({
  waBusinessId: z.string(),
  waBusinessPhoneNumberId: z.string(),
  messages: z.array(MessageSchema),
});

export interface WhatsAppInboundMessage {
  conversationId: string;
  waBusinessId: string;
  waBusinessPhoneNumberId: string;
  userPhoneNumber: string;
  userName: string;
  waMessage: string;
  waUserSelection?: InteractionOption;
  messageIds: string[];
}

export const adaptN8nWhatsappToConversationInput = (
  body: unknown
): WhatsAppInboundMessage[] => {
  try {
    const payload = PayloadSchema.parse(body);

    // Group by conversationId
    const map = new Map<string, WhatsAppInboundMessage>();
    for (const msg of payload.messages) {
      const conversationId = `${payload.waBusinessPhoneNumberId}:${msg.userPhoneNumber}`;
      const existing = map.get(conversationId);

      if (existing) {
        existing.waMessage =
          `${existing.waMessage}\n${msg.waMessage.trim()}`.trim();
        existing.messageIds.push(msg.waMessageId);
      } else {
        map.set(conversationId, {
          conversationId,
          waBusinessId: payload.waBusinessId,
          waBusinessPhoneNumberId: payload.waBusinessPhoneNumberId,
          userPhoneNumber: msg.userPhoneNumber,
          userName: msg.username,
          waMessage: msg.waMessage.trim(),
          waUserSelection: InteractionOptionAdapter.toDomain(
            msg.waUserSelection
          ),
          messageIds: [msg.waMessageId],
        });
      }
    }

    return [...map.values()];
  } catch (err) {
    throw new Error(
      `Error al validar el payload de WhatsApp: ${(err as Error).message}`
    );
  }
};
