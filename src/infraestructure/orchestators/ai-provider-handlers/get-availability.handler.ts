import { zodTextFormat } from 'openai/helpers/zod.js';

import { FlowAIStatus } from '@domain/models/booking-store.model';
import { AI_CREATE_TOOL_AVAILABILITY_RESPONSE_SCHEMA } from '@domain/models/ai-schema.model';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import { normalizeDateInLimaISO, normalizeDayInLimaISO } from '@shared/utils/date.util';
import { patchBookingState } from '@shared/utils/state.util';
import { TollCallHandler, type ToolCallContext, type ToolCallResult } from './toll-call.handler';

export class GetAvailabilityHandler extends TollCallHandler {
  canHandle(name: string): boolean {
    return name === 'getAvailability';
  }

  async handle(call: any, context: ToolCallContext): Promise<ToolCallResult> {
		const args = call.arguments ? JSON.parse(call.arguments) : {};
		const { schedulerService, currentState } = context;
		let statePatch = { ...currentState };

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
			aiStatus: FlowAIStatus.RUNNING,
			preferredDate: normalizeDateInLimaISO(appointment?.appointmentDay!),
			preferredTime: `${appointment?.suggestedStart} - ${appointment?.suggestedEnd}`,
		});
    
    return {
      nextState: statePatch,
      zodFormatResponse: zodTextFormat(
				AI_CREATE_TOOL_AVAILABILITY_RESPONSE_SCHEMA,
				'booking_state'
			),
      toolOutput: JSON.stringify(appointment),
    };
  }
}
