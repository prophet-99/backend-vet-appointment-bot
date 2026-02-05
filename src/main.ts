import 'dotenv/config';
import express from 'express';
// TODO: CORS (ONLY n8n PORT)
import cors from 'cors';

import { env } from '@config/env';
import { ConversationOrchestrator } from '@infraestructure/orchestators/conversation.orchestrator';
import { adaptN8nWhatsappToConversationInput } from '@infraestructure/adapters/n8n-whatsapp.adapter';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/test/:message', async (req, res) => {
  const request = {
    waBusinessId: '1816212025750259',
    waBusinessPhoneNumberId: '899129189958396',
    messages: [
      {
        username: 'Alexander Av. 🧑🏻‍💻',
        userPhoneNumber: '51932265606',
        waMessageId:
          'wamid.HBgLNTE5MzIyNjU2NTIVAgASGBQzQUYxRTFDMTA4RDk3OTU3MEMzMQA=',
        timestamp: '1768943658',
        waMessage: req.params.message,
        type: 'text',
      },
    ],
    statuses: [],
  };
  const chatService = new ConversationOrchestrator();
  const conversations = adaptN8nWhatsappToConversationInput(request);

  const results: any[] = [];
  for (const conv of conversations) {
    const out = await chatService.handleChatTurn({
      conversationId: conv.conversationId,
      userMessage: conv.input,
      userPhoneNumber: conv.userPhoneNumber,
    });
    results.push({
      conversationId: conv.conversationId,
      userPhoneNumber: conv.userPhoneNumber,
      reply: out.reply,
      ignored: 'ignored' in out ? out.ignored : false,
      reason: 'reason' in out ? out.reason : undefined,
      requestId: 'requestId' in out ? out.requestId : undefined,
    });
  }

  res.json({ message: 'Test endpoint', results });
});

app.listen(env.PORT, env.HOST, () => {
  console.log(`Server running at http://${env.HOST}:${env.PORT}/... 😁`);
});
