import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Badge, Button, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { AccessLinkModal, type AccessInfo } from '../../features/students/AccessLinkModal';
import { EditStudentModal, type EditStudentData } from '../../features/students/EditStudentModal';
import { newAccessLink } from '../../features/students/adminStudents';
import { cx } from '../../lib/cx';
import { formatDateTime, formatMonth, toYmd, ymdOfTimestamp } from '../../lib/dates';
import {
  bookingStatusLabel,
  bookingStatusTone,
  formatMoney,
  fullName,
  membershipStatusLabel,
  membershipStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

export function AdminStudentPage() {
  const { id = '' } = useParams();
  const { session, profile: me } = useAuth();
  const isAdmin = me?.role === 'admin';
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [editing, setEditing] = useState<EditStudentData | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const profile = useQuery(
    () => unwrap(supabase.from('profiles').select('id, first_name, last_name, phone, email, active').eq('id', id).single()),
    [id],
  );
  const memberships = useQuery(
    () =>
      unwrap(
        supabase.from('memberships').select('id, period, amount, status').eq('student_id', id).order('period', { ascending: false }),
      ),
    [id],
  );
  const payments = useQuery(
    () =>
      unwrap(
        supabase
          .from('payments')
          .select('id, amount, status, provider, paid_at, created_at')
          .eq('student_id', id)
          .order('created_at', { ascending: false }),
      ),
    [id],
  );
  const bookings = useQuery(
    () => unwrap(supabase.from('bookings').select('id, status, class_sessions(starts_at)').eq('student_id', id)),
    [id],
  );

  async function generateLink() {
    if (!session || !profile.data) return;
    setLinkBusy(true);
    setLinkError(null);
    try {
      const result = await newAccessLink(session.access_token, id);
      setAccess({
        name: fullName(profile.data),
        email: result.email,
        phone: profile.data.phone,
        link: result.link,
        isNew: false,
      });
    } catch (caught) {
      setLinkError(caught instanceof Error ? caught.message : 'No pudimos generar el link.');
    } finally {
      setLinkBusy(false);
    }
  }

  async function toggleActive() {
    if (!profile.data) return;
    setStatusBusy(true);
    setStatusError(null);
    setStatusMsg(null);
    const isActive = profile.data.active;
    if (isActive) {
      const { data, error } = await supabase.rpc('deactivate_student', { p_student_id: id });
      setStatusBusy(false);
      if (error) return setStatusError(error.message);
      setStatusMsg(`Alumna dada de baja. Se cancelaron ${data} reservas futuras.`);
    } else {
      const { error } = await supabase.rpc('reactivate_student', { p_student_id: id });
      setStatusBusy(false);
      if (error) return setStatusError(error.message);
      setStatusMsg('Alumna reactivada.');
    }
    profile.reload();
    bookings.reload();
  }

  if (profile.loading && !profile.data) return <Spinner />;
  if (profile.error || !profile.data) {
    return (
      <>
        <Link to="/admin/alumnas" className={styles.back}>
          ← Volver a alumnas
        </Link>
        <EmptyState title="No encontramos a esa alumna" />
      </>
    );
  }

  // Clases ordenadas de la más reciente a la más vieja.
  const classes = (bookings.data ?? [])
    .filter((b) => b.class_sessions)
    .map((b) => ({ id: b.id, status: b.status, startsAt: b.class_sessions!.starts_at }))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  const thisMonth = toYmd().slice(0, 7);
  const monthClasses = classes.filter((c) => ymdOfTimestamp(c.startsAt).startsWith(thisMonth));
  const countOf = (status: string) => monthClasses.filter((c) => c.status === status).length;

  return (
    <>
      <Link to="/admin/alumnas" className={styles.back}>
        ← Volver a alumnas
      </Link>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{fullName(profile.data)}</h1>
        {isAdmin && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(profile.data ?? null)}>
            Editar
          </Button>
        )}
      </div>
      <p className={styles.subtitle}>
        {[profile.data.email, profile.data.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
        {profile.data.active === false && (
          <>
            {' · '}
            <Badge tone="danger">Inactiva</Badge>
          </>
        )}
      </p>

      {isAdmin && (
        <section className={styles.section} aria-label="Estado de la cuenta">
          <h2 className={styles.sectionTitle}>Estado de la cuenta</h2>
          <p className={styles.rowMeta}>
            {profile.data.active
              ? 'La alumna está activa: puede reservar clases y pagar mensualidades.'
              : 'La alumna está dada de baja: no puede reservar ni pagar. Sus datos y su historial se conservan.'}
          </p>
          <div className={styles.actions} style={{ marginTop: 'var(--space-4)' }}>
            <Button
              variant={profile.data.active ? 'danger' : 'secondary'}
              size="sm"
              loading={statusBusy}
              onClick={toggleActive}
            >
              {profile.data.active ? 'Dar de baja' : 'Reactivar'}
            </Button>
          </div>
          {statusMsg && (
            <p className={cx(styles.alert, styles.alertOk)} role="status" style={{ marginTop: 'var(--space-4)' }}>
              {statusMsg}
            </p>
          )}
          {statusError && (
            <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-4)' }}>
              {statusError}
            </p>
          )}
        </section>
      )}

      {isAdmin && (
        <section className={styles.section} aria-label="Acceso">
          <h2 className={styles.sectionTitle}>Acceso</h2>
          <p className={styles.rowMeta}>
            Su usuario para ingresar es su email. Si olvidó la contraseña o el link que le pasaron venció, generá uno nuevo y
            mandáselo.
          </p>
          <div className={styles.actions} style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" size="sm" loading={linkBusy} onClick={generateLink}>
              Generar link de acceso
            </Button>
          </div>
          {linkError && (
            <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-4)' }}>
              {linkError}
            </p>
          )}
        </section>
      )}

      {[memberships, payments, bookings].some((q) => q.error) && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          No pudimos cargar todos los datos de esta alumna.
        </p>
      )}

      <section className={styles.section} aria-label="Mensualidades">
        <h2 className={styles.sectionTitle}>Mensualidades</h2>
        {memberships.loading && !memberships.data ? (
          <Spinner />
        ) : memberships.data?.length === 0 ? (
          <p className={styles.dayEmpty}>Todavía no tiene mensualidades.</p>
        ) : (
          <ul className={styles.list}>
            {memberships.data?.map((m) => (
              <li key={m.id} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{formatMonth(m.period)}</span>
                  <span className={styles.rowMeta}>{formatMoney(m.amount)}</span>
                </span>
                <Badge tone={membershipStatusTone[m.status]}>{membershipStatusLabel[m.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-label="Pagos">
        <h2 className={styles.sectionTitle}>Pagos</h2>
        {payments.loading && !payments.data ? (
          <Spinner />
        ) : payments.data?.length === 0 ? (
          <p className={styles.dayEmpty}>Todavía no hay pagos registrados.</p>
        ) : (
          <ul className={styles.list}>
            {payments.data?.map((p) => (
              <li key={p.id} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{formatMoney(p.amount)}</span>
                  <span className={styles.rowMeta}>{formatDateTime(p.paid_at ?? p.created_at)}</span>
                </span>
                <Badge tone={paymentStatusTone[p.status]}>{paymentStatusLabel[p.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-label="Clases">
        <h2 className={styles.sectionTitle}>Clases</h2>
        {monthClasses.length > 0 && (
          <div className={styles.stats} aria-label="Resumen del mes">
            <Badge tone="success">{countOf('attended')} presentes</Badge>
            <Badge tone="danger">{countOf('no_show')} ausentes</Badge>
            <Badge tone="neutral">{countOf('booked')} reservadas</Badge>
            <Badge tone="warning">{countOf('late_cancelled')} cancelaciones tardías</Badge>
          </div>
        )}
        {bookings.loading && !bookings.data ? (
          <Spinner />
        ) : classes.length === 0 ? (
          <p className={styles.dayEmpty}>Todavía no reservó clases.</p>
        ) : (
          <ul className={styles.list} style={{ marginTop: 'var(--space-4)' }}>
            {classes.map((c) => (
              <li key={c.id} className={cx(styles.row, c.status === 'cancelled' && styles.muted)}>
                <span className={styles.rowTitle}>{formatDateTime(c.startsAt)}</span>
                <Badge tone={bookingStatusTone[c.status]}>{bookingStatusLabel[c.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
      <AccessLinkModal access={access} onClose={() => setAccess(null)} />
      <EditStudentModal student={editing} onClose={() => setEditing(null)} onSaved={() => profile.reload()} />
    </>
  );
}
