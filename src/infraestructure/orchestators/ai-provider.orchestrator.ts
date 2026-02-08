import { zodTextFormat } from 'openai/helpers/zod.js';
import { type ParsedResponse as OpenAIParsedResponse } from 'openai/resources/responses/responses';

import { env } from '@config/env';
import type {
  AIProvider,
  AIPromptIntentRequest,
  AIPromptRequest,
  AIResponse,
  PromptIntent,
} from '@domain/models/ai-provider.model';
import type { BookingState } from '@domain/models/booking-store.model';
import { openAIClient } from '@infraestructure/ai/open-ai.client';
import {
  AI_RESPONSE_SCHEMA,
  type AIResponseSchema,
  AI_INTENT_SCHEMA,
} from '@infraestructure/ai/ai-response.schema';
import {
  getSystemPromptByIntent,
  OPEN_AI_PROMPT_INTENT_CLASSIFIER,
} from '@infraestructure/ai/open-ai.prompt';
import { OPEN_AI_TOOLS } from '@infraestructure/ai/open-ai.tools';
import {
  normalizeDayInLima,
  normalizeDayInLimaISO,
  normalizeDateInLimaISO,
} from '@shared/utils/date.util';
import {
  patchBookingState,
  extractAIResponseFromRawOutput,
  getSafeBotReply,
} from '@shared/utils/state.util';

type OpenAIParsedResponseType = OpenAIParsedResponse<AIResponseSchema> & {
  _request_id?: string | null;
};

export class OpenAIProviderOrchestrator implements AIProvider {
  private async safeResponseParse(params: {
    model: string;
    temperature: number;
    top_p: number;
    max_output_tokens: number;
    input: any[];
    tools?: any;
    previous_response_id?: string;
  }): Promise<OpenAIParsedResponseType> {
    try {
      return await openAIClient.responses.parse({
        ...params,
        text: {
          format: zodTextFormat(AI_RESPONSE_SCHEMA, 'booking_state'),
        },
      });
    } catch (err: any) {
      const raw = await openAIClient.responses.create(params);
      const extractedParsed = extractAIResponseFromRawOutput(raw.output);

      return {
        ...(raw as any),
        output_parsed: extractedParsed,
        _request_id: (raw as any).id ?? null,
      } as OpenAIParsedResponseType;
    }
  }

  private async createInitialResponse(
    params: AIPromptRequest
  ): Promise<OpenAIParsedResponseType> {
    const {
      user: { prompt, intent },
    } = params;

    return this.safeResponseParse({
      model: env.OPENAI_MODEL,
      temperature: env.OPENAI_TEMPERATURE,
      top_p: env.OPENAI_TOP_P,
      max_output_tokens: env.OPENAI_MAX_TOKENS,
      input: [
        {
          role: 'system',
          content: getSystemPromptByIntent(intent),
        },
        { role: 'user', content: prompt },
      ],
      tools: OPEN_AI_TOOLS as any,
    });
  }

  async detectPromptIntent(
    params: AIPromptIntentRequest
  ): Promise<PromptIntent> {
    const response = await openAIClient.responses.create({
      model: env.OPENAI_MODEL,
      temperature: 0,
      top_p: env.OPENAI_TOP_P,
      max_output_tokens: 50,
      input: [
        { role: 'system', content: OPEN_AI_PROMPT_INTENT_CLASSIFIER },
        { role: 'user', content: params.userPrompt },
      ],
    });

    const parsed = AI_INTENT_SCHEMA.safeParse({
      intent: response.output_text,
    });
    if (parsed.success) return parsed.data.intent;

    return 'CREATE';
  }

  private async createToolResponse(params: {
    previousResponseId: string;
    toolOutputs: any[];
  }): Promise<OpenAIParsedResponseType> {
    return this.safeResponseParse({
      model: env.OPENAI_MODEL,
      temperature: env.OPENAI_TEMPERATURE,
      top_p: env.OPENAI_TOP_P,
      max_output_tokens: env.OPENAI_MAX_TOKENS,
      previous_response_id: params.previousResponseId,
      input: params.toolOutputs,
    });
  }

  private getFunctionCalls(resp: any) {
    return (resp.output ?? []).filter((x: any) => x.type === 'function_call');
  }

  private async runToolLoop(params: {
    userRequest: AIPromptRequest;
    aiResponse: OpenAIParsedResponseType;
    statePatch: Partial<BookingState>;
  }): Promise<{
    response: OpenAIParsedResponseType;
    statePatch: Partial<BookingState>;
  }> {
    let response = params.aiResponse;
    let statePatch = params.statePatch;
    let lastAvailability = null;

    for (let i = 0; i < 5; i++) {
      const calls = this.getFunctionCalls(response);
      if (!calls.length) break;

      const toolOutputs: any[] = [];

      for (const call of calls) {
        const name = call.name;
        const args = call.arguments ? JSON.parse(call.arguments) : {};

        if (name === 'getAvailability') {
          const availability =
            await params.userRequest.schedulerService.getAvailibility({
              day: normalizeDayInLimaISO(args.preferredDate),
              preferredTime: args.preferredTime,
              servicesName: args.servicesName,
              petSize: args.petSize,
            });
          lastAvailability = availability;

          statePatch = patchBookingState(statePatch, {
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
            await params.userRequest.schedulerService.getServicesIdByNames(
              statePatch.servicesName || []
            );

          const created =
            await params.userRequest.schedulerService.createAppointment({
              day: normalizeDayInLima(
                params.userRequest.bookingState.appointmentDate!
              ),
              startTime: params.userRequest.bookingState.appointmentStartTime!,
              endTime: params.userRequest.bookingState.appointmentEndTime!,
              ownerName: args.ownerName,
              ownerPhone: params.userRequest.user.phoneNumber,
              petName: args.petName,
              size: args.petSize,
              breedText: args.breedText,
              notes: args.notes,
              serviceIds: safeServiceIds as string[],
            });

          let appointmentDetails = created;
          if (created.success && created.appointment?.appointmentId) {
            const fullDetails =
              await params.userRequest.schedulerService.getAppointment(
                created.appointment.appointmentId
              );
            if (fullDetails.success) {
              appointmentDetails = fullDetails;
            }

            if (created.success && created.appointment?.appointmentId) {
              const ownerName = args.ownerName ?? statePatch.ownerName;
              statePatch = patchBookingState(
                {},
                {
                  ownerName,
                  preferredDate: '-',
                  preferredTime: '-',
                  appointmentDate: '-',
                  appointmentStartTime: '-',
                  appointmentEndTime: '-',
                  petName: '-',
                  petSize: null as unknown as BookingState['petSize'],
                  breedText: '-',
                  notes: '-',
                  servicesName: [],
                }
              );
            }
          }

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(appointmentDetails),
          });
        }

        if (name === 'getAppointment') {
          const appDetail =
            await params.userRequest.schedulerService.getAppointment(
              args.appointmentId
            );

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(appDetail),
          });
        }

        if (name === 'cancelAppointment') {
          const cancelResult =
            await params.userRequest.schedulerService.cancelAppointment(
              args.appointmentId
            );

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(cancelResult),
          });
        }
      }

      response = await this.createToolResponse({
        previousResponseId: response.id,
        toolOutputs,
      });
    }

    return { response, statePatch };
  }

  private buildStatePatchFromParsed(params: {
    aiResponse: AIResponseSchema | null;
    bookingState: BookingState;
  }): Partial<BookingState> {
    const { aiResponse, bookingState } = params;

    const isValidString = (value?: string | null): boolean =>
      typeof value === 'string' && value.trim() !== '' && value !== '-';
    const pickString = (
      currentValue?: string,
      nextValue?: string | null
    ): string | undefined => {
      if (isValidString(nextValue)) return nextValue as string;
      if (isValidString(currentValue)) return currentValue as string;
      return '-';
    };
    const pickArray = (
      currentValue?: string[],
      nextValue?: string[] | null
    ): string[] => {
      if (Array.isArray(nextValue) && nextValue.length > 0) return nextValue;
      if (Array.isArray(currentValue) && currentValue.length > 0)
        return currentValue;
      return [];
    };

    return {
      preferredDate: pickString(
        bookingState.preferredDate,
        aiResponse?.preferredDate
      ),
      preferredTime: pickString(
        bookingState.preferredTime,
        aiResponse?.preferredTime
      ),
      servicesName: pickArray(
        bookingState.servicesName,
        aiResponse?.servicesName
      ),
      petSize: aiResponse?.petSize ?? bookingState.petSize,
      petName: pickString(bookingState.petName, aiResponse?.petName),
      breedText: pickString(bookingState.breedText, aiResponse?.breedText),
      ownerName: pickString(bookingState.ownerName, aiResponse?.ownerName),
      notes: pickString(bookingState.notes, aiResponse?.notes),
    };
  }

  async generateResponse(params: AIPromptRequest): Promise<AIResponse> {
    const initialResponse = await this.createInitialResponse(params);
    const buildAiResponse = this.buildStatePatchFromParsed({
      aiResponse: initialResponse.output_parsed,
      bookingState: params.bookingState!,
    });

    const { response, statePatch } = await this.runToolLoop({
      userRequest: params,
      aiResponse: initialResponse,
      statePatch: patchBookingState({}, buildAiResponse),
    });

    return {
      text: getSafeBotReply(response.output_parsed),
      requestId: response?._request_id ?? '',
      statePatch,
    };
  }
}
