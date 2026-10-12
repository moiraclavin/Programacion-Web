import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge, Button, EmptyState, Spinner, Tabs } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { CancelBookingModal, type CancelTarget } from '../../features/bookings/CancelBookingModal';
import { useStudioSettings } from '../../features/studio/useStudioSettings';
import { cx } from '../../lib/cx';
import {
  addDays,
  firstOfMonth,
  formatDayTab,
  formatMonth,
  formatShortDay,
  formatTime,
  mondayOf,
  startOfDay,
  toYmd,
  ymdOfTimestamp,
} from '../../lib/dates';
import { bookingStatusLabel, bookingStatusTone, type BookingStatus } from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './student.module.css';

/** Estados que ocupan un lugar en la clase. */
const OCCUPYING: BookingStatus[] = ['booked', 'attended', 'no_show'];
/** Estados que cuentan para el tope semanal (la cancelación tardía también consume la clase). */
const COUNTED: BookingStatus[] = [...OCCUPYING, 'late_cancelled'];

const DAY_MS = 86_400_000;

export function ReservePage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const settings = useStudioSettings();

  const today = toYmd();
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0);
  const [day, setDay] = useState(today);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<CancelTarget | null>(null);

  const monday = addDays(mondayOf(today), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const from = startOfDay(monday).toISOString();
  const to = startOfDay(addDays(monday, 7)).toISOString();

  const sessions = useQuery(() => unwrap(supabase.rpc('session_availability', { p_from: from, p_to: to })), [monday]);
  const instructors = useQuery(() => unwrap(supabase.from('instructors').select('id, name')), []);
  const mine = useQuery(
    () =>
      unwrap(
        supabase
          .from('bookings')
          .select('id, status, session_id, class_sessions!inner(starts_at)')
          .eq('student_id', userId)
          .in('status', COUNTED)
          .gte('class_sessions.starts_at', from)
          .lt('class_sessions.starts_at', to),
      ),
    [monday, userId],
  );
  const paid = useQuery(
    () => unwrap(supabase.from('memberships').select('period').eq('student_id', userId).eq('status', 'active')),
    [userId],
  );

  const instructorName = new Map(instructors.data?.map((i) => [i.id, i.name]));
  const myBooking = new Map(mine.data?.filter((b) => OCCUPYING.includes(b.status)).map((b) => [b.session_id, b]));
  const paidPeriods = new Set(paid.data?.map((m) => m.period));

  const weekCount = mine.data?.length ?? 0;
  const weekLimit = settings.data?.max_classes_per_week ?? 3;
  const limitReached = weekCount >= weekLimit;
  const horizonMs = (settings.data?.booking_horizon_days ?? 14) * DAY_MS;

  const dayPeriod = firstOfMonth(day);
  const unpaid = paid.data !== undefined && !paidPeriods.has(dayPeriod);

  function chooseWeek(offset: 0 | 1) {
    setWeekOffset(offset);
    setDay(offset === 0 ? today : addDays(mondayOf(today), 7));
  }

  async function reserve(sessionId: string) {
    setBusyId(sessionId);
    setError(null);
    const { error: rpcError } = await supabase.rpc('book_session', { p_session_id: sessionId });
    setBusyId(null);
    if (rpcError) setError(rpcError.message);
    // Se vuelve a pedir todo, también al fallar: puede que el cupo haya cambiado.
    sessions.reload();
    mine.reload();
  }

  const reload = () => {
    sessions.reload();
    mine.reload();
  };

  const daySessions = sessions.data?.filter((s) => ymdOfTimestamp(s.starts_at) === day) ?? [];

  function renderAction(session: NonNullable<typeof sessions.data>[number]): ReactNode {
    const startsMs = new Date(session.starts_at).getTime();
    const booking = myBooking.get(session.id);

    if (session.status === 'cancelled') return <Badge tone="outline">Cancelada</Badge>;
    if (booking) {
      if (booking.status === 'booked' && startsMs > Date.now()) {
        return (
          <>
            <Badge tone="success">Reservada</Badge>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setToCancel({ id: booking.id, startsAt: session.starts_at })}
            >
              Cancelar
            </Button>
          </>
        );
      }
      return <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>;
    }
    if (startsMs <= Date.now()) return <Badge tone="outline">Ya pasó</Badge>;
    if (startsMs > Date.now() + horizonMs) return <Badge tone="outline">Abre pronto</Badge>;
    if (session.spots_left === 0) return <Badge tone="outline">Completa</Badge>;
    return (
      <Button
        size="sm"
        loading={busyId === session.id}
        disabled={unpaid || limitReached || busyId !== null}
        onClick={() => reserve(session.id)}
      >
        Reservar
      </Button>
    );
  }

  function spotsText(spots: number, booked: boolean): string {
    if (booked) return 'Tu lugar está reservado';
    if (spots === 0) return 'Sin lugares';
    if (spots === 1) return 'Último lugar';
    return `${spots} lugares`;
  }

  return (
    <>
      <h1 className={styles.title}>Reservar</h1>
      <p className={styles.subtitle}>Elegí el día y el horario de tu clase.</p>

      <div className={styles.toolbar}>
        <div className={styles.segmented} role="group" aria-label="Semana">
          <Button size="sm" variant={weekOffset === 0 ? 'primary' : 'secondary'} aria-pressed={weekOffset === 0} onClick={() => chooseWeek(0)}>
            Esta semana
          </Button>
          <Button size="sm" variant={weekOffset === 1 ? 'primary' : 'secondary'} aria-pressed={weekOffset === 1} onClick={() => chooseWeek(1)}>
            Próxima
          </Button>
        </div>
        <p className={styles.counter}>
          {formatShortDay(monday)} – {formatShortDay(addDays(monday, 6))} · {weekCount} de {weekLimit} clases
        </p>
      </div>

      {unpaid && (
        <p className={cx(styles.alert, styles.alertInfo)} role="status">
          Para reservar en {formatMonth(dayPeriod)} tenés que tener pagada la mensualidad. <Link to="/app/pagos">Ir a Pagos</Link>
        </p>
      )}
      {!unpaid && limitReached && (
        <p className={cx(styles.alert, styles.alertInfo)} role="status">
          Ya usaste tus {weekLimit} clases de esta semana. Las cancelaciones con poca anticipación también cuentan.
        </p>
      )}
      {error && (
        <p className={cx(styles.alert, styles.alertError)} role="alert">
          {error}
        </p>
      )}
      {sessions.error && (
        <p className={cx(styles.alert, styles.alertError)} role="alert">
          No pudimos cargar los horarios. Probá de nuevo en unos minutos.
        </p>
      )}

      <Tabs
        label="Días de la semana"
        value={day}
        onChange={setDay}
        items={days.map((d) => ({ id: d, label: formatDayTab(d), disabled: d < today }))}
      >
        {sessions.loading && !sessions.data ? (
          <Spinner />
        ) : daySessions.length === 0 ? (
          <EmptyState title="No hay clases este día" description="Probá con otro día de la semana." />
        ) : (
          <ul className={styles.list}>
            {daySessions.map((session) => {
              const booking = myBooking.get(session.id);
              const cancelled = session.status === 'cancelled';
              return (
                <li key={session.id} className={cx(styles.row, cancelled && styles.muted)}>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>
                      {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                    </span>
                    <span className={styles.rowMeta}>
                      {(session.instructor_id && instructorName.get(session.instructor_id)) || 'Clase de pilates'} ·{' '}
                      {spotsText(session.spots_left, booking?.status === 'booked')}
                    </span>
                  </span>
                  <span className={styles.rowSide}>{renderAction(session)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Tabs>

      <CancelBookingModal
        target={toCancel}
        cancelWindowHours={settings.data?.cancel_window_hours ?? 12}
        onClose={() => setToCancel(null)}
        onCancelled={reload}
      />
    </>
  );
}
