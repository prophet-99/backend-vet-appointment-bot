export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export const getAppointmentStatusDisplayName = (
  status: AppointmentStatus
): string => {
  const displayNames: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: 'Pendiente',
    [AppointmentStatus.CONFIRMED]: 'Confirmada',
    [AppointmentStatus.REJECTED]: 'Rechazada',
    [AppointmentStatus.CANCELLED]: 'Cancelada',
  };

  return displayNames[status];
};
