import type { Request, Response } from 'express';

import { env } from '@config/env';
import { ConversationOrchestrator } from '@infraestructure/orchestators/conversation.orchestrator';
import { adaptN8nWhatsappToConversationInput } from '@infraestructure/adapters/n8n-whatsapp.adapter';
import { adaptWebClientToUpdateStatusInput } from '@infraestructure/adapters/web-client.adapter';

export class ConversationController {
  constructor(private conversationOrch: ConversationOrchestrator) {}

  private hasValidN8nToken(req: Request): boolean {
    const token = req.header('x-n8n-token');
    return token === env.N8N_SINGLE_USE_TOKEN;
  }

  private isErrorWithStatusCode(
    err: unknown
  ): err is Error & { cause: { statusCode: number } } {
    return (
      err instanceof Error &&
      typeof err.cause === 'object' &&
      err.cause !== null &&
      'statusCode' in err.cause
    );
  }

  async sendMessageToWhatsApp(req: Request, res: Response) {
    try {
      if (!this.hasValidN8nToken(req)) {
        return res.status(401).json({
          reason: 'Unauthorized',
        });
      }

      const waConversations = adaptN8nWhatsappToConversationInput(req.body);
      const chatResponse = waConversations.map(
        async ({
          conversationId,
          userName,
          userPhoneNumber,
          waMessage,
          waUserSelection,
          messageIds,
        }) => {
          const orchResponse = await this.conversationOrch.handleChatTurn({
            conversationId,
            userMessage: waMessage,
            userName,
            userPhoneNumber,
            userSelectionId: waUserSelection,
          });

          if (orchResponse.statusCode >= 500) {
            throw new Error(orchResponse.reason, {
              cause: {
                statusCode: orchResponse.statusCode,
              },
            });
          }

          return {
            ...orchResponse,
            messageIds,
          };
        }
      );
      const responseToUser = await Promise.all(chatResponse);

      return res.json(responseToUser);
    } catch (err) {
      const hasStatusCode = this.isErrorWithStatusCode(err);

      return res.status(hasStatusCode ? err.cause.statusCode : 500).json({
        reason: hasStatusCode ? err.message : 'Error interno del servidor',
      });
    }
  }

  async updateStatusAndNotifyWhatsApp(req: Request, res: Response) {
    try {
      const { appointmentId, doctorChoice } = adaptWebClientToUpdateStatusInput(
        req.body
      );

      const appointmentResponse =
        await this.conversationOrch.rejectOrAcceptAppointment({
          appointmentId,
          doctorChoice,
        });

      return res.json(appointmentResponse);
    } catch (err) {
      return res.status(521).json({
        statusCode: 521,
        botReply: '',
        reason: (err as Error).message,
      });
    }
  }
}
