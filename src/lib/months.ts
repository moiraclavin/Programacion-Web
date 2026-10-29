import { addMonths, type Ymd } from './dates.ts';

/** Cuántos meses por adelantado se puede pagar (el servidor aplica el mismo límite). */
export const MONTHS_AHEAD = 12;

/**
 * Estado de un mes en el calendario de pagos:
 * paid = pagado, due = el mes actual sin pagar, upcoming = un mes futuro sin pagar, missed = un mes pasado sin pagar.
 */
export type MonthState = 'paid' | 'due' | 'upcoming' | 'missed';

export function monthState(period: Ymd, current: Ymd, isPaid: boolean): MonthState {
  if (isPaid) return 'paid';
  if (period < current) return 'missed';
  return period === current ? 'due' : 'upcoming';
}

/** Se puede pagar el mes actual y los futuros, hasta MONTHS_AHEAD meses adelante. */
export function canPay(state: MonthState, period: Ymd, current: Ymd): boolean {
  return (state === 'due' || state === 'upcoming') && period <= addMonths(current, MONTHS_AHEAD);
}
