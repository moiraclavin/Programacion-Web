import type { CSSProperties } from 'react';
import { studio } from '../../content/studio';
import { cx } from '../../lib/cx';
import { addDays, formatDayTab, slotStart, toYmd, ymdOfTimestamp, type Ymd } from '../../lib/dates';
import type { Database } from '../../types/database.types';
import styles from './WeekCalendar.module.css';

export type CalendarSession = Database['public']['Functions']['session_availability']['Returns'][number];

export interface WeekCalendarProps {
  monday: Ymd;
  sessions: CalendarSession[];
  instructorName: Map<string, string>;
  /** Se toca un horario vacío (futuro). */
  onAdd: (day: Ymd, hour: number) => void;
  /** Se toca una clase existente. */
  onOpen: (session: CalendarSession) => void;
}

const HOUR_FORMAT = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
});

/** Hora y minutos de un timestamp, en hora de Buenos Aires. */
function hourAndMinutes(iso: string): { hour: number; minutes: number } {
  const parts = HOUR_FORMAT.formatToParts(new Date(iso));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { hour: read('hour') % 24, minutes: read('minute') };
}

const keyOf = (day: Ymd, hour: number) => `${day}|${hour}`;

/**
 * Semana en forma de grilla: una columna por día y una fila por hora (clases de 1 hora).
 * Un horario vacío muestra "+" para agregar una clase; una clase muestra cuántas alumnas se anotaron.
 */
export function WeekCalendar({ monday, sessions, instructorName, onAdd, onOpen }: WeekCalendarProps) {
  const { firstHour, endHour, days: dayCount } = studio.calendar;
  const days = Array.from({ length: dayCount }, (_, i) => addDays(monday, i));
  const hours = Array.from({ length: endHour - firstHour }, (_, i) => firstHour + i);
  const today = toYmd();
  const now = Date.now();

  // Una clase vigente tiene prioridad sobre una cancelada en el mismo horario.
  const bySlot = new Map<string, CalendarSession>();
  let outside = 0;
  for (const session of sessions) {
    const { hour, minutes } = hourAndMinutes(session.starts_at);
    const day = ymdOfTimestamp(session.starts_at);
    if (minutes !== 0 || hour < firstHour || hour >= endHour || !days.includes(day)) {
      outside += 1;
      continue;
    }
    const key = keyOf(day, hour);
    const existing = bySlot.get(key);
    if (!existing || (existing.status === 'cancelled' && session.status === 'scheduled')) bySlot.set(key, session);
  }

  return (
    <>
      <div className={styles.scroll}>
        <div className={styles.grid} style={{ '--days': days.length } as CSSProperties} role="group" aria-label="Calendario de la semana">
          <div className={styles.corner} />
          {days.map((day) => (
            <div key={day} className={cx(styles.dayHeader, day === today && styles.today)}>
              {formatDayTab(day)}
            </div>
          ))}

          {hours.map((hour) => (
            <Row
              key={hour}
              hour={hour}
              days={days}
              bySlot={bySlot}
              instructorName={instructorName}
              now={now}
              onAdd={onAdd}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>

      <ul className={styles.legend} aria-label="Referencias">
        <li>
          <span className={cx(styles.swatch, styles.swatchSome)} /> Con alumnas anotadas
        </li>
        <li>
          <span className={cx(styles.swatch, styles.swatchFull)} /> Completa
        </li>
        <li>
          <span className={cx(styles.swatch, styles.swatchCancelled)} /> Cancelada
        </li>
      </ul>
      {outside > 0 && (
        <p className={styles.note}>
          {outside === 1 ? 'Hay 1 clase' : `Hay ${outside} clases`} de esta semana fuera de la grilla (otro horario o a una hora no exacta).
          Se ven en la lista de Horarios.
        </p>
      )}
    </>
  );
}

interface RowProps {
  hour: number;
  days: Ymd[];
  bySlot: Map<string, CalendarSession>;
  instructorName: Map<string, string>;
  now: number;
  onAdd: WeekCalendarProps['onAdd'];
  onOpen: WeekCalendarProps['onOpen'];
}

function Row({ hour, days, bySlot, instructorName, now, onAdd, onOpen }: RowProps) {
  const label = `${String(hour).padStart(2, '0')}:00`;

  return (
    <>
      <div className={styles.hour}>{label}</div>
      {days.map((day) => {
        const session = bySlot.get(keyOf(day, hour));
        const slotLabel = `${formatDayTab(day)}, ${label}`;

        if (session?.status === 'scheduled') {
          const full = session.spots_left === 0;
          const teacher = (session.instructor_id && instructorName.get(session.instructor_id)) || 'Sin profesora';
          return (
            <button
              key={day}
              type="button"
              className={cx(styles.cell, styles.class, session.booked > 0 && styles.some, full && styles.full)}
              onClick={() => onOpen(session)}
              aria-label={`${slotLabel}: clase con ${session.booked} de ${session.capacity} lugares ocupados. ${teacher}`}
            >
              <span className={styles.count}>
                {session.booked}/{session.capacity}
              </span>
              <span className={styles.teacher}>{teacher}</span>
            </button>
          );
        }

        if (session) {
          return (
            <button
              key={day}
              type="button"
              className={cx(styles.cell, styles.cancelled)}
              onClick={() => onOpen(session)}
              aria-label={`${slotLabel}: clase cancelada`}
            >
              <span className={styles.teacher}>Cancelada</span>
            </button>
          );
        }

        const past = slotStart(day, hour).getTime() <= now;
        return past ? (
          <div key={day} className={cx(styles.cell, styles.past)} aria-hidden="true" />
        ) : (
          <button
            key={day}
            type="button"
            className={cx(styles.cell, styles.add)}
            onClick={() => onAdd(day, hour)}
            aria-label={`${slotLabel}: agregar una clase`}
          >
            <span aria-hidden="true">+</span>
          </button>
        );
      })}
    </>
  );
}
