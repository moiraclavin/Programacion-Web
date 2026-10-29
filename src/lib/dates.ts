// Fechas del estudio. Todo se muestra en hora de Buenos Aires.
// Argentina no usa horario de verano (siempre UTC-3), por eso alcanza con un offset fijo.

const TZ = 'America/Argentina/Buenos_Aires';
const OFFSET = '-03:00';

/** Fecha calendario "YYYY-MM-DD", sin hora ni zona. */
export type Ymd = string;

const ymdFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** El día de hoy (o de la fecha dada) en Buenos Aires. */
export function toYmd(date: Date = new Date()): Ymd {
  return ymdFormat.format(date);
}

function parseYmd(ymd: Ymd): Date {
  return new Date(`${ymd}T00:00:00Z`);
}

export function addDays(ymd: Ymd, days: number): Ymd {
  const date = parseYmd(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function mondayOf(ymd: Ymd): Ymd {
  const isoDay = parseYmd(ymd).getUTCDay() || 7; // domingo = 7
  return addDays(ymd, 1 - isoDay);
}

/** Primer día del mes actual: así se identifica cada mensualidad. */
export function currentPeriod(): Ymd {
  return firstOfMonth(toYmd());
}

/** Primer día del mes de una fecha: "2026-10-15" → "2026-10-01". */
export function firstOfMonth(ymd: Ymd): Ymd {
  return `${ymd.slice(0, 8)}01`;
}

/** Primer día del mes siguiente (o anterior con -1) al de la fecha dada. */
export function shiftMonth(ymd: Ymd, months: 1 | -1): Ymd {
  const first = firstOfMonth(ymd);
  return firstOfMonth(months === 1 ? addDays(first, 32) : addDays(first, -1));
}

/** Instante en que empieza ese día en Buenos Aires. */
export function startOfDay(ymd: Ymd): Date {
  return new Date(`${ymd}T00:00:00${OFFSET}`);
}

/** Instante en que empieza una clase a esa hora (0–23) del día dado, en Buenos Aires. */
export function slotStart(ymd: Ymd, hour: number): Date {
  return new Date(`${ymd}T${String(hour).padStart(2, '0')}:00:00${OFFSET}`);
}

/** Suma (o resta) meses a un período "YYYY-MM-01". */
export function addMonths(period: Ymd, months: number): Ymd {
  const [year, month] = period.split('-').map(Number);
  const index = year * 12 + (month - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-01`;
}

/** Los 12 períodos ("YYYY-MM-01") de un año. */
export function periodsOfYear(year: number): Ymd[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}-01`);
}

/** Día de la semana de una fecha calendario: 1 = lunes … 7 = domingo. */
export function isoWeekday(ymd: Ymd): number {
  return parseYmd(ymd).getUTCDay() || 7;
}

const dayLabel = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const tabDay = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', weekday: 'short', day: 'numeric' });
const shortDay = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const weekdayName = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', weekday: 'long' });
const timeFormat = new Intl.DateTimeFormat('es-AR', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const dateTimeFormat = new Intl.DateTimeFormat('es-AR', {
  timeZone: TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const monthNameFormat = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', month: 'long' });
const monthFormat = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', month: 'long', year: 'numeric' });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Lunes 5 de octubre" */
export function formatDay(ymd: Ymd): string {
  return capitalize(dayLabel.format(parseYmd(ymd)));
}

/** "Lun 5" (para pestañas de días) */
export function formatDayTab(ymd: Ymd): string {
  return capitalize(tabDay.format(parseYmd(ymd)).replace('.', ''));
}

/** "5 oct" */
export function formatShortDay(ymd: Ymd): string {
  return shortDay.format(parseYmd(ymd)).replace('.', '');
}

/** "Lunes" para weekday 1…7. */
export function weekdayLabel(isoDay: number): string {
  return capitalize(weekdayName.format(parseYmd(addDays('2026-10-05', isoDay - 1))));
}

/** "08:00" desde un timestamp de la base. */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** "lun, 5 oct, 08:00" desde un timestamp de la base. */
export function formatDateTime(iso: string): string {
  return capitalize(dateTimeFormat.format(new Date(iso)).replace(/\./g, ''));
}

/** "Octubre" desde una fecha "YYYY-MM-DD". */
export function formatMonthName(ymd: Ymd): string {
  return capitalize(monthNameFormat.format(parseYmd(ymd)));
}

/** "Octubre de 2026" desde una fecha "YYYY-MM-DD". */
export function formatMonth(ymd: Ymd): string {
  return capitalize(monthFormat.format(parseYmd(ymd)));
}

/** Fecha calendario (Buenos Aires) de un timestamp de la base. */
export function ymdOfTimestamp(iso: string): Ymd {
  return toYmd(new Date(iso));
}
