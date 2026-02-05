import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod.js';
import { type ParsedResponse as OpenAIParsedResponse } from 'openai/resources/responses/responses';

import { env } from '@config/env';
import type {
  AIProvider,
  AIPromptRequest,
  AIResponse,
} from '@domain/models/ai-provider.model';
import type { BookingState } from '@domain/models/booking-store.model';
import { PetSize } from '@domain/enums/pet-size.enum';
import { openAIClient } from '@infraestructure/ai/open-ai.client';
import { OPEN_AI_SYSTEM_PROMPT } from '@infraestructure/ai/open-ai.prompt';
import { OPEN_AI_TOOLS } from '@infraestructure/ai/open-ai.tools';
import {
  normalizeDayInLima,
  normalizeDayInLimaISO,
  normalizeDateInLimaISO,
} from '@shared/utils/date.util';

const AI_RESPONSE_SCHEMA = z.object({
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

type AIResponseSchema = z.infer<typeof AI_RESPONSE_SCHEMA>;
type OpenAIParsedResponseType = OpenAIParsedResponse<AIResponseSchema> & {
  _request_id?: string | null;
};

export class OpenAIProviderOrchestrator implements AIProvider {
  private getFunctionCalls(resp: any) {
    return (resp.output ?? []).filter((x: any) => x.type === 'function_call');
  }

  private patchBookingState(
    currentState: Partial<BookingState>,
    toPatch: Partial<BookingState>
  ) {
    let patchedState = { ...currentState };

    (Object.keys(toPatch) as (keyof BookingState)[]).forEach((key) => {
      const value = toPatch[key];
      if (value !== undefined) {
        patchedState = { ...patchedState, [key]: value };
      }
    });

    return patchedState;
  }

  async generateResponse(params: AIPromptRequest): Promise<AIResponse> {
    let statePatch: Partial<BookingState> = {};

    let planeResponse: OpenAIParsedResponseType =
      await openAIClient.responses.parse({
        model: env.OPENAI_MODEL,
        temperature: env.OPENAI_TEMPERATURE,
        top_p: env.OPENAI_TOP_P,
        max_output_tokens: env.OPENAI_MAX_TOKENS,
        input: [
          { role: 'system', content: OPEN_AI_SYSTEM_PROMPT },
          { role: 'user', content: params.userPrompt },
        ],
        tools: OPEN_AI_TOOLS as any,
        text: {
          format: zodTextFormat(AI_RESPONSE_SCHEMA, 'booking_state'),
        },
      });
    const outputParsed = planeResponse.output_parsed;

    statePatch = this.patchBookingState(statePatch, {
      preferredDate: outputParsed?.preferredDate || '-',
      preferredTime: outputParsed?.preferredTime || undefined,
      servicesName: Array.isArray(outputParsed?.servicesName)
        ? outputParsed.servicesName
        : [],
      petSize: outputParsed?.petSize || undefined,
      petName: outputParsed?.petName || '-',
      breedText: outputParsed?.breedText || '-',
      ownerName: outputParsed?.ownerName || '-',
      notes: outputParsed?.notes || '-',
    });

    let lastAvailability = null;

    for (let i = 0; i < 5; i++) {
      const calls = this.getFunctionCalls(planeResponse);
      if (!calls.length) break;

      const toolOutputs: any[] = [];

      for (const call of calls) {
        const name = call.name;
        const args = call.arguments ? JSON.parse(call.arguments) : {};

        if (name === 'getAvailability') {
          const availability = await params.schedulerService.getAvailibility({
            day: normalizeDayInLimaISO(args.preferredDate),
            preferredTime: args.preferredTime,
            servicesName: args.servicesName,
            petSize: args.petSize,
          });
          lastAvailability = availability;

          statePatch = this.patchBookingState(statePatch, {
            appointmentDate: normalizeDateInLimaISO(
              lastAvailability.appointment?.appointmentDay!
            ),
            appointmentStartTime: lastAvailability.appointment?.suggestedStart,
            appointmentEndTime: lastAvailability.appointment?.suggestedEnd,
            ownerName: args.ownerName,
            servicesName: Array.isArray(args.servicesName)
              ? args.servicesName
              : [],
            petSize: args.petSize,
            petName: args.petName,
          });

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(availability),
          });
        }

        if (name === 'createAppointment') {
          const safeServiceIds =
            await params.schedulerService.getServicesIdByNames(
              statePatch.servicesName || []
            );
          const created = await params.schedulerService.createAppointment({
            day: normalizeDayInLima(params.bookingState?.appointmentDate!),
            startTime: params.bookingState?.appointmentStartTime!,
            endTime: params.bookingState?.appointmentEndTime!,
            ownerName: args.ownerName,
            ownerPhone: params.userPhoneNumber,
            petName: args.petName,
            size: args.petSize,
            breedText: args.breedText,
            notes: args.notes,
            serviceIds: safeServiceIds as string[],
          });

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(created),
          });
        }
      }

      planeResponse = await openAIClient.responses.parse({
        model: env.OPENAI_MODEL,
        temperature: env.OPENAI_TEMPERATURE,
        top_p: env.OPENAI_TOP_P,
        max_output_tokens: env.OPENAI_MAX_TOKENS,
        previous_response_id: planeResponse.id,
        input: toolOutputs,
        text: {
          format: zodTextFormat(AI_RESPONSE_SCHEMA, 'booking_state'),
        },
      });
    }

    return {
      text: planeResponse.output_parsed?.botReply ?? '',
      requestId: planeResponse?._request_id ?? '',
      statePatch,
    };
  }
}
