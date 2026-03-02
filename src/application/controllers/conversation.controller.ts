import { ConversationOrchestrator } from '@infraestructure/orchestators/conversation.orchestrator';

export class ConversationController {
  constructor(private conversationOrch: ConversationOrchestrator) {}

  async sendMessageToWhatsApp() {}

  async manageAppointment() {}
}
