import { Router } from 'express';

import { ConversationController } from '@application/controllers/conversation.controller';
import { ConversationOrchestrator } from '@infraestructure/orchestators/conversation.orchestrator';

const router = Router();
const conversationOrchestrator = new ConversationOrchestrator();
const conversationController = new ConversationController(
  conversationOrchestrator
);

router.post('/send', conversationController.sendMessageToWhatsApp);
router.post('/manage-appointment', conversationController.manageAppointment);

export default router;
