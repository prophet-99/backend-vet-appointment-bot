import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),

  DATABASE_URL: z.string().min(10).includes('postgres://'),

  OPENAI_API_KEY: z.string().min(10),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.5),
  OPENAI_TOP_P: z.coerce.number().min(0).max(1).default(1.0),
  OPENAI_MAX_TOKENS: z.coerce.number().min(1).default(300),
});

export const env = EnvSchema.parse(process.env);
