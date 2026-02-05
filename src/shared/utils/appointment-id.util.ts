import { randomBytes } from 'crypto';

/**
 * Genera un ID de cita amigable para el usuario
 * Formato: apt_XXXXXXXX (ej: apt_089ddfe4)
 *
 * Ventajas:
 * - Corto y fácil de recordar
 * - Bajo riesgo de colisión (4 bytes = 4.3 billones de combinaciones)
 * - Fácil de escribir por el usuario
 */
export function generateAppointmentId(): string {
  const randomPart = randomBytes(4).toString('hex');
  return `apt_${randomPart}`;
}
