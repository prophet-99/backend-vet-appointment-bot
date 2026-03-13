import 'dotenv/config';
import express from 'express';
// TODO: CORS (ONLY n8n PORT)
import cors from 'cors';

import { env } from '@config/env';
import conversationRoutes from '@application/routes/conversation.routes';
import appointmentRoutes from '@application/routes/appointment.routes';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/conversation', conversationRoutes);
app.use('/appointments', appointmentRoutes);

app.listen(env.PORT, env.HOST, () => {
  console.log(`Server running at http://${env.HOST}:${env.PORT}/... 😁`);
});
