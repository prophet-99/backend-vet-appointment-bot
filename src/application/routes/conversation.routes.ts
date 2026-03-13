import { Router } from 'express';

import { ConversationController } from '@application/controllers/conversation.controller';

const router = Router();
const conversationController = new ConversationController();

router.post(
  '/respond',
  conversationController.sendMessageToWhatsApp.bind(conversationController)
);
router.post(
  '/appointment-status/update',
  conversationController.updateStatusAndNotifyWhatsApp.bind(
    conversationController
  )
);

export default router;
