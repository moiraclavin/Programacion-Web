import { useState } from 'react';
import { Badge, Button, ButtonLink, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { CancelBookingModal, type CancelTarget } from '../../features/bookings/CancelBookingModal';
import { useStudioSettings } from '../../features/studio/useStudioSettings';
import { cx } from '../../lib/cx';
import { currentPeriod, formatDateTime, formatMonth, formatTime, shiftMonth, startOfDay } from '../../lib/dates';
import { bookingStatusLabel, bookingStatusTone } from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './student.module.css';

export function MyClassesPage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const settings = useStudioSettings();

  const [month, setMonth] = useState(currentPeriod());
  const [toCancel, setToCancel] = useState<CancelTarget | null>(null);

  const from = startOfDay(month).toISOString();
  const to = startOfDay(shiftMonth(month, 1)).toISOString();

  const bookings = useQuery(
    () =>
      unwrap(
        supabase
          .from('bookings')
          .select('id, status, class_sessions!inner(starts_at, ends_at, instructors(name))')
          .eq('student_id', userId)
          .gte('class_sessions.starts_at', from)
          .lt('class_sessions.starts_at', to),
      ),
    [month, userId],
  );

  // Ordenadas de la primera a la última clase del mes.
  const classes = [...(bookings.data ?? [])].sort((a, b) =>
    a.class_sessions.starts_at.localeCompare(b.class_sessions.starts_at),
  );
  const countOf = (status: string) => classes.filter((c) => c.status === status).length;

  return (
    <>
      <h1 className={styles.title}>Mis clases</h1>
      <p className={styles.subtitle}>Tus reservas del mes y tu asistencia.</p>

      <div className={styles.toolbar}>
        <div className={styles.monthNav}>
          <Button variant="secondary" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">
            ←
          </Button>
          <span className={styles.monthLabel}>{formatMonth(month)}</span>
          <Button variant="secondary" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente">
            →
          </Button>
        </div>
      </div>

      {bookings.error && (
        <p className={cx(styles.alert, styles.alertError)} role="alert">
          No pudimos cargar tus clases. Probá de nuevo en unos minutos.
        </p>
      )}

      {bookings.loading && !bookings.data ? (
        <Spinner />
      ) : classes.length === 0 ? (
        <EmptyState
          title="No tenés clases este mes"
          description="Cuando reserves, van a aparecer acá."
          action={<ButtonLink to="/app/reservar">Ver horarios</ButtonLink>}
        />
      ) : (
        <>
          <div className={styles.stats} aria-label="Resumen del mes">
            <Badge tone="success">{countOf('attended')} presentes</Badge>
            <Badge tone="danger">{countOf('no_show')} ausentes</Badge>
            <Badge tone="neutral">{countOf('booked')} reservadas</Badge>
            <Badge tone="outline">{countOf('cancelled') + countOf('late_cancelled')} canceladas</Badge>
          </div>
          <ul className={styles.list}>
            {classes.map((item) => {
              const { starts_at, ends_at, instructors } = item.class_sessions;
              const canCancel = item.status === 'booked' && new Date(starts_at).getTime() > Date.now();
              return (
                <li key={item.id} className={cx(styles.row, item.status === 'cancelled' && styles.muted)}>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>{formatDateTime(starts_at)}</span>
                    <span className={styles.rowMeta}>
                      Hasta las {formatTime(ends_at)} · {instructors?.name ?? 'Clase de pilates'}
                    </span>
                  </span>
                  <span className={styles.rowSide}>
                    <Badge tone={bookingStatusTone[item.status]}>{bookingStatusLabel[item.status]}</Badge>
                    {canCancel && (
                      <Button size="sm" variant="secondary" onClick={() => setToCancel({ id: item.id, startsAt: starts_at })}>
                        Cancelar
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <CancelBookingModal
        target={toCancel}
        cancelWindowHours={settings.data?.cancel_window_hours ?? 12}
        onClose={() => setToCancel(null)}
        onCancelled={bookings.reload}
      />
    </>
  );
}
