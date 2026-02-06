import { z } from 'zod';

import { PetSize } from '@domain/enums/pet-size.enum';

export const AI_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  preferredDate: z.string().nullable(),
  preferredTime: z.string().nullable(),
  servicesName: z.array(z.string()).nullable(),
  petSize: z.enum([PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE]).nullable(),
  petName: z.string().nullable(),
  breedText: z.string().nullable(),
  ownerName: z.string().nullable(),
  notes: z.string().nullable(),
});

export type AIResponseSchema = z.infer<typeof AI_RESPONSE_SCHEMA>;

export const AI_INTENT_SCHEMA = z.object({
  intent: z.enum([
    'WELCOME',
    'INFO',
    'CREATE',
    'EDIT',
    'DELETE',
    'GET',
    'HUMAN',
  ]),
});
