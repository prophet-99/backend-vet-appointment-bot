import { zodTextFormat } from 'openai/helpers/zod.js';
import { type ParsedResponse as OpenAIParsedResponse } from 'openai/resources/responses/responses';

import { env } from '@config/env';
import type {
  AIProvider,
  AIRequest,
  AIResponse,
} from '@domain/models/ai-provider.model';
import type { BookingState } from '@domain/models/booking-store.model';
import { openAIClient } from '@infraestructure/ai/open-ai.client';
import {
  AI_INIT_RESPONSE_SCHEMA,
  type AIInitResponseSchema,
} from '@infraestructure/ai/ai-response.schema';
import {
  getSystemPromptByIntent,
  getUserPrompt,
  OPEN_AI_PROMPT_INTENT_CLASSIFIER,
} from '@infraestructure/ai/open-ai.prompt';
import { OPEN_AI_TOOLS } from '@infraestructure/ai/open-ai.tools';
import {
  normalizeDayInLima,
  normalizeDayInLimaISO,
  normalizeDateInLimaISO,
} from '@shared/utils/date.util';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import {
  patchBookingState,
  extractAIResponseFromRawOutput,
  getSafeBotReply,
} from '@shared/utils/state.util';

type OpenAIParsedResponseType = OpenAIParsedResponse<AIInitResponseSchema> & {
  _request_id?: string | null;
};

export class OpenAIProviderOrchestrator implements AIProvider {
  private buildUserStateSummary(bookingState: BookingState): string {
    return `
      mode=${bookingState.mode}
      lastUserText=${bookingState.lastUserText ?? ''}
      lastBotText=${bookingState.lastBotText ?? ''}
      preferredDate=${bookingState.preferredDate ?? ''}
      preferredTime=${bookingState.preferredTime ?? ''}
      petName=${bookingState.petName ?? ''}
      petSize=${bookingState.petSize ?? ''}
      petBreed=${bookingState.petBreed ?? ''}
      notes=${bookingState.notes ?? ''}
      servicesName=${bookingState.servicesName?.join(',') ?? ''}
    `.trim();
  }

  private async createAIResponse(params: {
    systemPrompt: string;
    userPrompt: string;
    zodFormatResponse: any;
  }): Promise<OpenAIParsedResponseType> {
    const { systemPrompt, userPrompt, zodFormatResponse } = params;

    return await openAIClient.responses.parse({
      model: env.OPENAI_MODEL,
      temperature: env.OPENAI_TEMPERATURE,
      top_p: env.OPENAI_TOP_P,
      max_output_tokens: env.OPENAI_MAX_TOKENS,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools: OPEN_AI_TOOLS as any,
      text: { format: zodFormatResponse },
    });
  }

  private async createToolResponse(params: {
    previousResponseId: string;
    toolOutputs: any[];
    zodFormatResponse: any;
  }): Promise<OpenAIParsedResponseType> {
    const { previousResponseId, toolOutputs, zodFormatResponse } = params;

    return await openAIClient.responses.parse({
      model: env.OPENAI_MODEL,
      temperature: env.OPENAI_TEMPERATURE,
      top_p: env.OPENAI_TOP_P,
      max_output_tokens: env.OPENAI_MAX_TOKENS,
      previous_response_id: previousResponseId,
      input: toolOutputs,
      text: { format: zodFormatResponse },
    });
  }

  private async runAndExecuteIATools(params: {
    aiRequest: AIRequest;
    aiResponse: OpenAIParsedResponseType;
  }): Promise<{
    toolsResponse: OpenAIParsedResponseType;
    statePatch: Partial<BookingState>;
  }> {
    const {
      aiResponse,
      aiRequest: { bookingState, schedulerService, userName, userPhoneNumber },
    } = params;
    const getFunctionCalls = (resp: any) => {
      return (resp.output ?? []).filter((x: any) => x.type === 'function_call');
    };

    let zodFormatResponse = zodTextFormat(
      AI_INIT_RESPONSE_SCHEMA,
      'booking_state'
    );
    let statePatch = patchBookingState(
      bookingState,
      aiResponse.output_parsed as Partial<BookingState>
    );
    let toolsResponse = aiResponse;

    for (let i = 0; i < 5; i++) {
      const calls = getFunctionCalls(toolsResponse);
      if (!calls.length) break;

      const toolOutputs: any[] = [];

      for (const call of calls) {
        const name = call.name;
        const args = call.arguments ? JSON.parse(call.arguments) : {};

        if (name === 'getAvailability') {
          const missingParams: string[] = [];
          if (!args.preferredDate) missingParams.push('preferredDate');
          if (!args.petName) missingParams.push('petName');
          if (!args.petSize) missingParams.push('petSize');
          if (!args.petBreed) missingParams.push('petBreed');
          if (!args.notes) missingParams.push('notes');
          if (!args.servicesName) missingParams.push('servicesName');

          if (missingParams.length > 0) {
            const missingError = ErrorCodes.MISSING_REQUIRED_PARAMETERS;

            throw new Error(missingError.code, {
              cause: {
                statusCode: missingError.statusCode,
                errorReason: `${missingError.message}: [${missingParams.join(', ')}]`,
              },
            });
          }

          const availability = await schedulerService.getAvailibility({
            day: normalizeDayInLimaISO(args.preferredDate),
            preferredTime: args.preferredTime,
            servicesName: args.servicesName,
            petSize: args.petSize,
          });

          if (!availability.success) {
            throw new Error(availability.errorCode, {
              cause: {
                statusCode: availability.statusCode,
                errorReason: availability.errorReason,
              },
            });
          }

          const appointment = availability.appointment;
          statePatch = patchBookingState(statePatch, {
            preferredDate: normalizeDateInLimaISO(appointment?.appointmentDay!),
            preferredTime: `${appointment?.suggestedStart} - ${appointment?.suggestedEnd}`,
          });

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(appointment),
          });
        }

        if (name === 'createAppointment') {
          const safeServices = await schedulerService.getServicesIdByNames(
            statePatch.servicesName || []
          );

          if (!safeServices.success) {
            throw new Error(safeServices.errorCode, {
              cause: {
                statusCode: safeServices.statusCode,
                errorReason: safeServices.errorReason,
              },
            });
          }

          const serviceIds = safeServices.serviceIds;
          const appointmentCreated = await schedulerService.createAppointment({
            day: normalizeDayInLima(statePatch.preferredDate!),
            startTime: statePatch.preferredTime!.split('-')[0].trim(),
            endTime: statePatch.preferredTime!.split('-')[1].trim(),
            ownerName: userName,
            ownerPhone: userPhoneNumber,
            petName: statePatch.petName!,
            petSize: statePatch.petSize!,
            petBreed: statePatch.petBreed!,
            notes: statePatch.notes!,
            serviceIds: serviceIds!,
          });

          if (!appointmentCreated.success) {
            throw new Error(appointmentCreated.errorCode, {
              cause: {
                statusCode: appointmentCreated.statusCode,
                errorReason: appointmentCreated.errorReason,
              },
            });
          }

          const appointmentDetails = appointmentCreated.appointment;
          statePatch = patchBookingState(statePatch, {
            preferredDate: '',
            preferredTime: '',
            petName: '',
            petSize: null as unknown as BookingState['petSize'],
            petBreed: '',
            notes: '',
            servicesName: [],
          });

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(appointmentDetails),
          });
        }

        if (name === 'cancelAppointment') {
          const appointmentCancelled = await schedulerService.cancelAppointment(
            args.appointmentId
          );

          if (!appointmentCancelled.success) {
            throw new Error(appointmentCancelled.errorCode, {
              cause: {
                statusCode: appointmentCancelled.statusCode,
                errorReason: appointmentCancelled.errorReason,
              },
            });
          }

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(appointmentCancelled),
          });
        }
      }

      toolsResponse = await this.createToolResponse({
        previousResponseId: toolsResponse.id,
        toolOutputs,
        zodFormatResponse: zodTextFormat(
          AI_INIT_RESPONSE_SCHEMA,
          'booking_state'
        ),
      });
    }

    return { toolsResponse, statePatch };
  }

  async generateResponse(params: AIRequest): Promise<AIResponse> {
    try {
      const { bookingState } = params;

      const systemPrompt = getSystemPromptByIntent(bookingState.mode);
      const userPrompt = getUserPrompt(
        this.buildUserStateSummary(bookingState),
        bookingState.lastUserText
      );

      const initialAIResponse = await this.createAIResponse({
        systemPrompt,
        userPrompt,
        zodFormatResponse: zodTextFormat(
          AI_INIT_RESPONSE_SCHEMA,
          'booking_state'
        ),
      });

      // TODO: RETURN FLOWCONTROL STATUS
      const { toolsResponse, statePatch } = await this.runAndExecuteIATools({
        aiRequest: params,
        aiResponse: initialAIResponse,
      });

      return {
        requestId: toolsResponse?._request_id ?? '',
        text: getSafeBotReply(toolsResponse.output_parsed),
        statePatch,
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('☢ =======> Error generating AI response:', error);

      if (error?.cause?.statusCode && error?.cause?.errorReason) {
        return {
          requestId: '',
          text: '',
          statePatch: {},
          statusCode: error.cause.statusCode,
          errorCode: error.message,
          errorReason: error.cause.errorReason,
        };
      }

      return {
        // TODO: IF TWO ERRORS (SIN CONTROLAR) DERIVAR A HUMAN (CITA MANUAL)
        requestId: '',
        text: '',
        statePatch: {},
        statusCode: ErrorCodes.AI_GENERATE_RESPONSE_FAILED.statusCode,
        errorCode: ErrorCodes.AI_GENERATE_RESPONSE_FAILED.code,
        errorReason: ErrorCodes.AI_GENERATE_RESPONSE_FAILED.message,
      };
    }
  }
}
