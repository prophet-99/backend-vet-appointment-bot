import { z } from 'zod';

import { PetSize } from '@domain/enums/pet-size.enum';

export enum AIStatus {
  GET_AVAILABILITY = 'GET_AVAILABILITY',
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  CANCEL_APPOINTMENT = 'CANCEL_APPOINTMENT',
  COLLECT_DATA = 'COLLECT_DATA',
}

export const AI_COLLECTOR_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  flowStatus: z.literal(AIStatus.COLLECT_DATA),

  preferredDate: z.string().nullable(),
  preferredTime: z.string().nullable(),
  petName: z.string().nullable(),
  petSize: z.enum([PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE]).nullable(),
  petBreed: z.string().nullable(),
  notes: z.string().nullable(),
  servicesName: z.array(z.string()).default([]).nullable(),
});

export const AI_AVAILABILITY_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  flowStatus: z.literal(AIStatus.GET_AVAILABILITY),

  appointmentDay: z.date(),
  suggestedStart: z.string(),
  suggestedEnd: z.string(),
  requiredMinutes: z.number(),
  services: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const AI_CREATE_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  flowStatus: z.literal(AIStatus.CREATE_APPOINTMENT),

  appointmentId: z.string(),
  appointmentDate: z.string(),
  appointmentStartTime: z.string(),
  appointmentEndTime: z.string(),
  ownerName: z.string(),
  ownerPhone: z.string(),
  petName: z.string(),
  petSize: z.string(),
  petBreed: z.string(),
  servicesName: z.array(z.string()),
  notes: z.string(),
  status: z.string(),
});

export const AI_CANCEL_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  flowStatus: z.literal(AIStatus.CANCEL_APPOINTMENT),

  reason: z.string().nullable(),
});

export type AICollectorResponseSchema = z.infer<
  typeof AI_COLLECTOR_RESPONSE_SCHEMA
>;
export type AIAvailabilityResponseSchema = z.infer<
  typeof AI_AVAILABILITY_RESPONSE_SCHEMA
>;
export type AICreateResponseSchema = z.infer<typeof AI_CREATE_RESPONSE_SCHEMA>;
export type AICancelResponseSchema = z.infer<typeof AI_CANCEL_RESPONSE_SCHEMA>;

export type AIMergedResponseSchema =
  | AICollectorResponseSchema
  | AIAvailabilityResponseSchema
  | AICreateResponseSchema
  | AICancelResponseSchema;
