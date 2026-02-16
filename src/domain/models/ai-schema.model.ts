import { z } from 'zod';

import { PetSize } from '@domain/enums/pet-size.enum';
import { FlowMode, FlowStatusAI } from './booking-store.model';

export const AI_COLLECTOR_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(AIStatus.COLLECT_DATA),

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
  aiStatus: z.literal(AIStatus.GET_AVAILABILITY),

  appointmentDay: z.date(),
  suggestedStart: z.string(),
  suggestedEnd: z.string(),
  requiredMinutes: z.number(),
  services: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const AI_CREATE_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(AIStatus.CREATE_APPOINTMENT),

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
  aiStatus: z.literal(AIStatus.CANCEL_APPOINTMENT),

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

export type AISchemaTypes =
| typeof AI_COLLECTOR_RESPONSE_SCHEMA
| typeof AI_AVAILABILITY_RESPONSE_SCHEMA
| typeof AI_CREATE_RESPONSE_SCHEMA
| typeof AI_CANCEL_RESPONSE_SCHEMA;

export const getAISchemaResponse = (params: {userIntent: FlowMode, statusAI: FlowStatusAI}): AISchemaTypes => {
  const { userIntent, statusAI } = params;

     const promptMap: Record<string, AISchemaTypes> = {
      [`${FlowMode.CREATE}-${FlowStatusAI.COLLECTING}`]: AI_COLLECTOR_RESPONSE_SCHEMA,
      [`${FlowMode.CREATE}-${FlowStatusAI.READY_TO_SEARCH}`]: AI_COLLECTOR_RESPONSE_SCHEMA,
      [`${FlowMode.CREATE}-${FlowStatusAI.SEARCHING}`]: AI_COLLECTOR_RESPONSE_SCHEMA,
      [`${FlowMode.CREATE}-${FlowStatusAI.DONE}`]: AI_CREATE_RESPONSE_SCHEMA,

      [`${FlowMode.DELETE}-${FlowStatusAI.COLLECTING}`]: AI_AVAILABILITY_RESPONSE_SCHEMA,
      [`${FlowMode.DELETE}-${FlowStatusAI.READY_TO_SEARCH}`]: AI_AVAILABILITY_RESPONSE_SCHEMA,
      [`${FlowMode.DELETE}-${FlowStatusAI.SEARCHING}`]: AI_AVAILABILITY_RESPONSE_SCHEMA,
      [`${FlowMode.DELETE}-${FlowStatusAI.DONE}`]: AI_CANCEL_RESPONSE_SCHEMA,
    };
    return promptMap[`${userIntent}-${statusAI}`];
};
