import type { BadgeTone } from '../components/ui';
import type { Database } from '../types/database.types';

type Enums = Database['public']['Enums'];

export const bookingStatusLabel: Record<Enums['booking_status'], string> = {
  booked: 'Reservada',
  attended: 'Presente',
  no_show: 'Ausente',
  cancelled: 'Canceló',
  late_cancelled: 'Canceló tarde',
};

export const bookingStatusTone: Record<Enums['booking_status'], BadgeTone> = {
  booked: 'neutral',
  attended: 'success',
  no_show: 'danger',
  cancelled: 'outline',
  late_cancelled: 'warning',
};

export const membershipStatusLabel: Record<Enums['membership_status'], string> = {
  pending: 'Pendiente',
  active: 'Pagado',
  expired: 'Vencido',
};

export const membershipStatusTone: Record<Enums['membership_status'], BadgeTone> = {
  pending: 'warning',
  active: 'success',
  expired: 'outline',
};

export const paymentStatusLabel: Record<Enums['payment_status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Devuelto',
};

export const paymentStatusTone: Record<Enums['payment_status'], BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  refunded: 'outline',
};

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

/** "$ 25.000" */
export function formatMoney(amount: number): string {
  return money.format(amount);
}

/** "Lucía Fernández", o un texto de reemplazo si el perfil todavía no tiene nombre. */
export function fullName(profile: { first_name: string | null; last_name: string | null } | null): string {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  return name || 'Sin nombre';
}
