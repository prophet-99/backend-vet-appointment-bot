import type { Request, Response } from 'express';

import { ConversationOrchestrator } from '@infraestructure/orchestators/conversation.orchestrator';
import { adaptN8nWhatsappToConversationInput } from '@infraestructure/adapters/n8n-whatsapp.adapter';
import { adaptWebClientToUpdateStatusInput } from '@infraestructure/adapters/web-client.adapter';

export class ConversationController {
  constructor(private conversationOrch: ConversationOrchestrator) {}

  async sendMessageToWhatsApp(req: Request, res: Response) {
    try {
      // TODO: IMPROVE, THE ADAPTER IS INCOMPLETED
      const waConversations = adaptN8nWhatsappToConversationInput(req.body);

      const chatResponse = waConversations.map(async (conv) => {
        return await this.conversationOrch.handleChatTurn({
          conversationId: '',
          userMessage: '',
          userName: '',
          userPhoneNumber: '',
          userSelectionId: undefined,
        });
      });
      const responseToUser = await Promise.all(chatResponse);

      return res.json(responseToUser);
    } catch(err) {
      return res.status(521).json([{
        statusCode: 521,
        conversationId: '',
        botReply: '',
        mode: '',
        modeStatus: '',
        ignored: false,
        reason: (err as Error).message,
      }]);
    }
  }

  async updateStatusAndNotifyWhatsApp(req: Request, res: Response) {
    try {
      const { appointmentId, doctorChoice } = adaptWebClientToUpdateStatusInput(req.body);
  
      const appointmentResponse = await this.conversationOrch.rejectOrAcceptAppointment({
        appointmentId,
        doctorChoice,
      });
  
      return res.json(appointmentResponse);
    }
    catch(err) {
      return res.status(521).json({ 
        statusCode: 521,
        botReply: '',
        reason: (err as Error).message,
      });
    }
  }
}
