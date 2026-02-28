import { zodTextFormat } from 'openai/helpers/zod.js';
import { type ParsedResponse as OpenAIParsedResponse } from 'openai/resources/responses/responses';

import { env } from '@config/env';
import type {
  AIProvider,
  AIRequest,
  AIResponse,
} from '@domain/models/ai-provider.model';
import {
  FlowAIStatus,
  FlowMode,
  type BookingState,
} from '@domain/models/booking-store.model';
import { openAIClient } from '@infraestructure/ai/open-ai.client';
import {
  AI_CREATE_TOOL_AVAILABILITY_RESPONSE_SCHEMA,
  AI_CREATE_TOOL_BOOKING_RESPONSE_SCHEMA,
  AI_CANCEL_TOOL_CANCELLATION_RESPONSE_SCHEMA,
  type AIMergedResponseSchema,
  getAISchemaResponse,
} from '@domain/models/ai-schema.model';
import {
  getSystemPrompt,
  getUserPrompt,
} from '@infraestructure/ai/open-ai.prompt';
import { OPEN_AI_TOOLS } from '@infraestructure/ai/open-ai.tools';
import {
  normalizeDayInLima,
  normalizeDayInLimaISO,
  normalizeDateInLimaISO,
} from '@shared/utils/date.util';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import { patchBookingState } from '@shared/utils/state.util';
import { GetAvailabilityHandler } from './ai-provider-handlers/get-availability.handler';
import { CreateAppointmentHandler } from './ai-provider-handlers/create-appointment.handler';
import { CancelAppointmentHandler } from './ai-provider-handlers/cancel-appointment.handler';

type OpenAIParsedResponseType = OpenAIParsedResponse<AIMergedResponseSchema> & {
  _request_id?: string | null;
};

export class OpenAIProviderOrchestrator implements AIProvider {
  private buildUserStateSummary(bookingState: BookingState): string {
    const createStatus = `
      aiStatus=${bookingState.aiStatus}
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
    const deleteStatus = `
      aiStatus=${bookingState.aiStatus}
      lastUserText=${bookingState.lastUserText ?? ''}
      lastBotText=${bookingState.lastBotText ?? ''}
      appointmentId=${bookingState.appointmentId ?? ''}
      cancelledReason=${bookingState.cancelledReason ?? ''}
    `.trim();

    return (
      {
        [FlowMode.CREATE]: createStatus,
        [FlowMode.DELETE]: deleteStatus,
      } as Record<string, string>
    )[bookingState.mode];
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
      temperature: 0,
      top_p: env.OPENAI_TOP_P,
      max_output_tokens: env.OPENAI_MAX_TOKENS,
      previous_response_id: previousResponseId,
      input: [...toolOutputs],
      text: { format: zodFormatResponse },
    });
  }

  private async runAndExecuteAITools(params: {
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

    let statePatch = patchBookingState(
      bookingState,
      aiResponse.output_parsed as Partial<BookingState>
    );
    let toolsResponse = aiResponse;

    for (let i = 0; i < 5; i++) {
      const calls = getFunctionCalls(toolsResponse);
      if (!calls.length) break;

      let zodFormatResponse = null;
      const toolOutputs: any[] = [];
      const toolCallHandlers = [
        new GetAvailabilityHandler(),
        new CreateAppointmentHandler(),
        new CancelAppointmentHandler(),
      ];

      for (const call of calls) {
        const name = call.name;
        const handler = toolCallHandlers.find((h) => h.canHandle(name));

        if (handler) {
          const result = await handler.handle(call, {
            schedulerService,
            currentState: statePatch,
            userName,
            userPhoneNumber,
          });
          statePatch = { ...result.nextState };
          zodFormatResponse = result.zodFormatResponse;

          toolOutputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: result.toolOutput,
          });
        }
      }

      toolsResponse = await this.createToolResponse({
        previousResponseId: toolsResponse.id,
        toolOutputs,
        zodFormatResponse,
      });
    }

    return { toolsResponse, statePatch };
  }

  private getSafeAIReply(
    aiResponse: AIMergedResponseSchema | null
  ): AIMergedResponseSchema {
    const validReply = (v: string | undefined) => v && v.trim() !== '';

    if (
      aiResponse &&
      validReply(aiResponse?.botReply) &&
      validReply(aiResponse?.aiStatus)
    ) {
      return aiResponse;
    }

    throw new Error(ErrorCodes.AI_RESPONSE_PARSING_FAILED.code, {
      cause: {
        statusCode: ErrorCodes.AI_RESPONSE_PARSING_FAILED.statusCode,
        errorReason: ErrorCodes.AI_RESPONSE_PARSING_FAILED.message,
      },
    });
  }

  async generateResponse(params: AIRequest): Promise<AIResponse> {
    try {
      const { bookingState } = params;
      const systemConstruct = {
        userIntent: bookingState.mode,
        aiStatus: bookingState.aiStatus,
      };
      const userConstruct = {
        state: this.buildUserStateSummary(bookingState),
        userInput: bookingState.lastUserText,
      };

      const schemaResponse = getAISchemaResponse(systemConstruct);
      const systemPrompt = getSystemPrompt(systemConstruct);
      const userPrompt = getUserPrompt(userConstruct);

      const initialAIResponse = await this.createAIResponse({
        systemPrompt,
        userPrompt,
        zodFormatResponse: zodTextFormat(schemaResponse, 'booking_state'),
      });

      const { toolsResponse, statePatch } = await this.runAndExecuteAITools({
        aiRequest: params,
        aiResponse: initialAIResponse,
      });

      return {
        requestId: toolsResponse?._request_id ?? '',
        aiResponse: this.getSafeAIReply(toolsResponse.output_parsed),
        statePatch,
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('☢ =======> Error generating AI response:', error);

      if (error?.cause?.statusCode && error?.cause?.errorReason) {
        return {
          requestId: '',
          aiResponse: null,
          statePatch: {},
          statusCode: error.cause.statusCode,
          errorCode: error.message,
          errorReason: error.cause.errorReason,
        };
      }

      return {
        requestId: '',
        aiResponse: null,
        statePatch: {},
        statusCode: ErrorCodes.AI_GENERATE_RESPONSE_FAILED.statusCode,
        errorCode: ErrorCodes.AI_GENERATE_RESPONSE_FAILED.code,
        errorReason: ErrorCodes.AI_GENERATE_RESPONSE_FAILED.message,
      };
    }
  }
}
