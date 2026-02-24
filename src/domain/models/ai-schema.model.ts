import { z } from 'zod';

import { PetSize } from '@domain/enums/pet-size.enum';
import { FlowMode, FlowAIStatus } from './booking-store.model';

//* FLOW MODE: CREATE
export const AI_CREATE_COLLECTING_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(FlowAIStatus.COLLECTING),

  preferredDate: z.string().nullable(),
  preferredTime: z.string().nullable(),
  petName: z.string().nullable(),
  petSize: z.enum([PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE]).nullable(),
  petBreed: z.string().nullable(),
  notes: z.string().nullable(),
  servicesName: z.array(z.string()).default([]).nullable(),
});

export const AI_CREATE_TOOL_AVAILABILITY_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(FlowAIStatus.RUNNING),

  appointmentDay: z.date(),
  suggestedStart: z.string(),
  suggestedEnd: z.string(),
  requiredMinutes: z.number(),
  services: z.array(z.object({ id: z.string(), name: z.string() })),
});

export const AI_CREATE_RUNNING_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(FlowAIStatus.RUNNING),

  preferredDate: z.string().nullable(),
  preferredTime: z.string().nullable(),
});

export const AI_CREATE_TOOL_BOOKING_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(FlowAIStatus.DONE),

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

export const AI_CANCEL_TOOL_CANCELLATION_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(FlowAIStatus.DONE),

  reason: z.string().nullable(),
});

export type AICreateCollectingResponseSchema = z.infer<
  typeof AI_CREATE_COLLECTING_RESPONSE_SCHEMA
>;
export type AICreateToolAvailabilityResponseSchema = z.infer<
  typeof AI_CREATE_TOOL_AVAILABILITY_RESPONSE_SCHEMA
>;
export type AICreateRunningResponseSchema = z.infer<
  typeof AI_CREATE_RUNNING_RESPONSE_SCHEMA
>;
export type AICreateToolBookingResponseSchema = z.infer<
  typeof AI_CREATE_TOOL_BOOKING_RESPONSE_SCHEMA
>;
export type AICreateMergedResponseSchema =
  | AICreateCollectingResponseSchema
  | AICreateToolAvailabilityResponseSchema
  | AICreateRunningResponseSchema
  | AICreateToolBookingResponseSchema;
export type AICreateSchemaTypes =
  | typeof AI_CREATE_COLLECTING_RESPONSE_SCHEMA
  | typeof AI_CREATE_TOOL_AVAILABILITY_RESPONSE_SCHEMA
  | typeof AI_CREATE_RUNNING_RESPONSE_SCHEMA
  | typeof AI_CREATE_TOOL_BOOKING_RESPONSE_SCHEMA;

//* FLOW MODE: DELETE
export const AI_DELETE_COLLECTING_RESPONSE_SCHEMA = z.object({
  botReply: z.string(),
  aiStatus: z.literal(FlowAIStatus.COLLECTING),

  appointmendId: z.string().nullable(),
  cancelledReason: z.string().nullable(),
});

export type AIDeleteCollectingResponseSchema = z.infer<
  typeof AI_DELETE_COLLECTING_RESPONSE_SCHEMA
>;
export type AIDeleteMergedResponseSchema = AIDeleteCollectingResponseSchema;
export type AIDeleteSchemaTypes = typeof AI_DELETE_COLLECTING_RESPONSE_SCHEMA;

//* UNION OF ALL FLOW MODES
export type AIMergedResponseSchema =
  | AICreateMergedResponseSchema
  | AIDeleteMergedResponseSchema;
export type AISchemaTypes = AICreateSchemaTypes | AIDeleteSchemaTypes;

export const getAISchemaResponse = (params: {
  userIntent: FlowMode;
  aiStatus: FlowAIStatus;
}): AISchemaTypes => {
  const { userIntent, aiStatus } = params;

  const promptMap: Record<string, AISchemaTypes> = {
    [`${FlowMode.CREATE}-${FlowAIStatus.COLLECTING}`]:
      AI_CREATE_COLLECTING_RESPONSE_SCHEMA,
    [`${FlowMode.CREATE}-${FlowAIStatus.RUNNING}`]:
      AI_CREATE_RUNNING_RESPONSE_SCHEMA,
    [`${FlowMode.DELETE}-${FlowAIStatus.COLLECTING}`]:
      AI_DELETE_COLLECTING_RESPONSE_SCHEMA,
  };
  return promptMap[`${userIntent}-${aiStatus}`];
};
