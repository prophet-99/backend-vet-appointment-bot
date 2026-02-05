import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { PetSize } from '@domain/enums/pet-size.enum';

// ========== GET AVAILABILITY ==========
export interface GetAvailabilityInput {
  day: string; // YYYY-MM-DD
  preferredTime?: string; // HH:MM (opcional)
  servicesName: string[];
  petSize: PetSize;
  blockMinutes?: number;
  lookAheadDays?: number;
}

export interface GetAvailabilityOutput {
  success: boolean;
  statusCode: number;
  reason?: string;
  appointment?: {
    appointmentDay: Date;
    suggestedStart: string;
    suggestedEnd: string;
    requiredMinutes: number;
    services: Array<{ id: string; name: string }>;
  };
}

// ========== CREATE APPOINTMENT ==========
export interface CreateAppointmentInput {
  day: Date;
  startTime: string;
  endTime: string;
  ownerName: string;
  ownerPhone: string;
  petName: string;
  size: PetSize;
  breedText?: string;
  notes?: string;
  serviceIds: string[];
  pendingTtlMinutes?: number;
}

export interface CreateAppointmentOutput {
  success: boolean;
  statusCode: number;
  reason?: string;
  appointment?: {
    id: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    expiresAt: Date;
  };
}

export interface Scheduler {
  getAvailibility(params: GetAvailabilityInput): Promise<GetAvailabilityOutput>;

  createAppointment(
    params: CreateAppointmentInput
  ): Promise<CreateAppointmentOutput>;

  getServicesIdByNames(names: string[]): Promise<string[]>;
}
