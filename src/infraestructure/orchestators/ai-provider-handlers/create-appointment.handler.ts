import { zodTextFormat } from 'openai/helpers/zod.js';

import { type BookingState, FlowAIStatus } from '@domain/models/booking-store.model';
import { AI_CREATE_TOOL_BOOKING_RESPONSE_SCHEMA } from '@domain/models/ai-schema.model';
import { normalizeDayInLima } from '@shared/utils/date.util';
import { patchBookingState } from '@shared/utils/state.util';
import { TollCallHandler, type ToolCallContext, type ToolCallResult } from './toll-call.handler';

export class CreateAppointmentHandler extends TollCallHandler {
	canHandle(name: string): boolean {
		return name === "createAppointment";
	}

	async handle(call: any, context: ToolCallContext): Promise<ToolCallResult> {
		const args = call.arguments ? JSON.parse(call.arguments) : {};
		const { schedulerService, currentState, userName, userPhoneNumber } = context;
		let statePatch = { ...currentState };

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
			aiStatus: FlowAIStatus.DONE,
			preferredDate: '',
			preferredTime: '',
			petName: '',
			petSize: null as unknown as BookingState['petSize'],
			petBreed: '',
			notes: '',
			servicesName: [],
		});

		return {
			nextState: statePatch,
			zodFormatResponse: zodTextFormat(
				AI_CREATE_TOOL_BOOKING_RESPONSE_SCHEMA,
				'booking_state'
			),
			toolOutput: JSON.stringify(appointmentDetails),
		};
	}
}
