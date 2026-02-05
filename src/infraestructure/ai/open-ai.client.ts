import OpenAI from 'openai';

import { env } from '@config/env';

export const openAIClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
