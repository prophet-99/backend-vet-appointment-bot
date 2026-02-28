
import { zodTextFormat } from 'openai/helpers/zod.js';

import { FlowAIStatus } from '@domain/models/booking-store.model';
import { AI_CANCEL_TOOL_CANCELLATION_RESPONSE_SCHEMA } from '@domain/models/ai-schema.model';
import { ErrorCodes } from '@shared/symbols/error-codes.constants';
import { patchBookingState } from '@shared/utils/state.util';
import { TollCallHandler, type ToolCallContext, type ToolCallResult } from './toll-call.handler';

export class CancelAppointmentHandler extends TollCallHandler {
	canHandle(name: string): boolean {
		return name === 'cancelAppointment';
	}

	async handle(call: any, context: ToolCallContext): Promise<ToolCallResult> {
		const args = call.arguments ? JSON.parse(call.arguments) : {};
		const { schedulerService, currentState } = context;
		let statePatch = { ...currentState };

		if (!args.appointmentId) {
			const missingError = ErrorCodes.MISSING_REQUIRED_PARAMETERS;

			throw new Error(missingError.code, {
				cause: {
					statusCode: missingError.statusCode,
					errorReason: `${missingError.message}: [appointmentId]`,
				},
			});
		}

		const appointmentCancelled = await schedulerService.cancelAppointment(
			args.appointmentId,
			args.cancelledReason || 'Sin motivo especificado'
		);

		if (!appointmentCancelled.success) {
			throw new Error(appointmentCancelled.errorCode, {
				cause: {
					statusCode: appointmentCancelled.statusCode,
					errorReason: appointmentCancelled.errorReason,
				},
			});
		}

		statePatch = patchBookingState(statePatch, {
			aiStatus: FlowAIStatus.DONE,
			appointmentId: '',
			cancelledReason: '',
		});

		return {
			nextState: statePatch,
			zodFormatResponse: zodTextFormat(
			AI_CANCEL_TOOL_CANCELLATION_RESPONSE_SCHEMA,
			'booking_state'
		),
			toolOutput: JSON.stringify(appointmentCancelled),
		};
	}
}
