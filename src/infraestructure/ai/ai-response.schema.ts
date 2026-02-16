import { z } from 'zod';

import { PetSize } from '@domain/enums/pet-size.enum';

export const AI_INIT_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  preferredDate: z.string().nullable(),
  preferredTime: z.string().nullable(),
  petName: z.string().nullable(),
  petSize: z.enum([PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE]).nullable(),
  petBreed: z.string().nullable(),
  notes: z.string().nullable(),
  servicesName: z.array(z.string()).default([]).nullable(),
});

export const AI_GET_RESPONSE_SCHEMA = z.object({});

export const AI_CREATE_RESPONSE_SCHEMA = z.object({});

export const AI_CANCEL_RESPONSE_SCHEMA = z.object({});

export type AIInitResponseSchema = z.infer<typeof AI_INIT_RESPONSE_SCHEMA>;
export type AIGetResponseSchema = z.infer<typeof AI_GET_RESPONSE_SCHEMA>;
export type AICreateResponseSchema = z.infer<typeof AI_CREATE_RESPONSE_SCHEMA>;
export type AICancelResponseSchema = z.infer<typeof AI_CANCEL_RESPONSE_SCHEMA>;
