import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Badge, Button, EmptyState, Spinner } from '../../components/ui';
import { cx } from '../../lib/cx';
import { formatDateTime, formatTime } from '../../lib/dates';
import { bookingStatusLabel, bookingStatusTone, fullName } from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

/** Reservas que ocupan lugar en la clase. */
const OCCUPYING = ['booked', 'attended', 'no_show'];

export function AdminSessionPage() {
  const { id = '' } = useParams();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const session = useQuery(
    () =>
      unwrap(
        supabase
          .from('class_sessions')
          .select('id, starts_at, ends_at, capacity, status, instructors(name)')
          .eq('id', id)
          .single(),
      ),
    [id],
  );
  const bookings = useQuery(
    () =>
      unwrap(
        supabase
          .from('bookings')
          .select('id, status, profiles!student_id(first_name, last_name, phone)')
          .eq('session_id', id)
          .order('created_at'),
      ),
    [id],
  );

  async function mark(bookingId: string, status: 'attended' | 'no_show') {
    setBusyId(bookingId);
    setActionError(null);
    const { error } = await supabase.rpc('mark_attendance', { p_booking_id: bookingId, p_status: status });
    setBusyId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    bookings.reload();
  }

  if (session.loading && !session.data) return <Spinner />;
  if (session.error || !session.data) {
    return (
      <>
        <Link to="/admin" className={styles.back}>
          ← Volver a la agenda
        </Link>
        <EmptyState title="No encontramos esa clase" description="Puede que ya no exista." />
      </>
    );
  }

  const data = session.data;
  const taken = bookings.data?.filter((b) => OCCUPYING.includes(b.status)).length ?? 0;

  return (
    <>
      <Link to="/admin" className={styles.back}>
        ← Volver a la agenda
      </Link>
      <h1 className={styles.title}>{formatDateTime(data.starts_at)}</h1>
      <p className={styles.subtitle}>
        {formatTime(data.starts_at)} – {formatTime(data.ends_at)} · {data.instructors?.name ?? 'Sin profesora asignada'} ·{' '}
        {taken}/{data.capacity} lugares
        {data.status === 'cancelled' && ' · Clase cancelada'}
      </p>

      <section className={styles.section} aria-label="Alumnas anotadas">
        <h2 className={styles.sectionTitle}>Alumnas</h2>

        {actionError && (
          <p className={cx(styles.alert, styles.alertError)} role="alert">
            {actionError}
          </p>
        )}
        {bookings.error && (
          <p className={cx(styles.alert, styles.alertError)} role="alert">
            No pudimos cargar las reservas: {bookings.error}
          </p>
        )}

        {bookings.loading && !bookings.data ? (
          <Spinner />
        ) : bookings.data?.length === 0 ? (
          <EmptyState title="Todavía no hay alumnas anotadas" />
        ) : (
          <ul className={styles.list}>
            {bookings.data?.map((booking) => {
              const canMark = OCCUPYING.includes(booking.status);
              const cancelled = !canMark;
              return (
                <li key={booking.id} className={cx(styles.row, styles.attendRow, cancelled && styles.muted)}>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>{fullName(booking.profiles)}</span>
                    {booking.profiles?.phone && <span className={styles.rowMeta}>{booking.profiles.phone}</span>}
                  </span>
                  <span className={styles.rowSide}>
                    <Badge tone={bookingStatusTone[booking.status]}>{bookingStatusLabel[booking.status]}</Badge>
                    {canMark && (
                      <span className={styles.actions}>
                        <Button
                          size="sm"
                          variant={booking.status === 'attended' ? 'primary' : 'secondary'}
                          loading={busyId === booking.id}
                          disabled={busyId !== null}
                          onClick={() => mark(booking.id, 'attended')}
                        >
                          Presente
                        </Button>
                        <Button
                          size="sm"
                          variant={booking.status === 'no_show' ? 'primary' : 'secondary'}
                          disabled={busyId !== null}
                          onClick={() => mark(booking.id, 'no_show')}
                        >
                          Ausente
                        </Button>
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
