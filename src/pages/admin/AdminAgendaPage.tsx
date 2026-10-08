import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Badge, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import {
  addDays,
  formatDay,
  formatShortDay,
  formatTime,
  mondayOf,
  startOfDay,
  toYmd,
  ymdOfTimestamp,
} from '../../lib/dates';
import { cx } from '../../lib/cx';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

export function AdminAgendaPage() {
  const { profile } = useAuth();
  const [monday, setMonday] = useState(() => mondayOf(toYmd()));
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const sessions = useQuery(
    () =>
      unwrap(
        supabase.rpc('session_availability', {
          p_from: startOfDay(monday).toISOString(),
          p_to: startOfDay(addDays(monday, 7)).toISOString(),
        }),
      ),
    [monday],
  );
  const instructors = useQuery(() => unwrap(supabase.from('instructors').select('id, name')), []);
  const instructorName = new Map(instructors.data?.map((i) => [i.id, i.name]));

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const thisMonday = mondayOf(toYmd());

  async function generate() {
    setGenerating(true);
    setNotice(null);
    const { data, error } = await supabase.rpc('generate_sessions', { p_week_start: monday });
    setGenerating(false);
    if (error) {
      setNotice({ kind: 'error', text: error.message });
      return;
    }
    setNotice({
      kind: 'ok',
      text:
        data === 0
          ? 'Las clases de esta semana ya estaban creadas (o no hay horarios activos).'
          : `Se crearon ${data} clases.`,
    });
    sessions.reload();
  }

  return (
    <>
      <h1 className={styles.title}>Agenda</h1>
      <p className={styles.subtitle}>Las clases de cada semana y cuántas alumnas se anotaron.</p>

      <div className={styles.toolbar}>
        <div className={styles.weekNav}>
          <Button variant="secondary" size="sm" onClick={() => setMonday(addDays(monday, -7))} aria-label="Semana anterior">
            ←
          </Button>
          <span className={styles.weekLabel}>
            {formatShortDay(monday)} – {formatShortDay(addDays(monday, 6))}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setMonday(addDays(monday, 7))} aria-label="Semana siguiente">
            →
          </Button>
          {monday !== thisMonday && (
            <Button variant="ghost" size="sm" onClick={() => setMonday(thisMonday)}>
              Hoy
            </Button>
          )}
        </div>
        {profile?.role === 'admin' && (
          <Button size="sm" onClick={generate} loading={generating}>
            Generar clases de esta semana
          </Button>
        )}
      </div>

      {notice && (
        <p
          className={cx(styles.alert, notice.kind === 'ok' ? styles.alertOk : styles.alertError)}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </p>
      )}

      {sessions.error && (
        <p className={cx(styles.alert, styles.alertError)} role="alert">
          No pudimos cargar las clases: {sessions.error}
        </p>
      )}

      {sessions.loading && !sessions.data ? (
        <Spinner />
      ) : sessions.data?.length === 0 ? (
        <EmptyState
          title="No hay clases esta semana"
          description={
            profile?.role === 'admin'
              ? 'Cargá los horarios en la pestaña Horarios y después generá las clases de la semana.'
              : 'Todavía no se crearon las clases de esta semana.'
          }
        />
      ) : (
        days.map((day) => {
          const ofDay = sessions.data?.filter((s) => ymdOfTimestamp(s.starts_at) === day) ?? [];
          return (
            <section key={day} className={styles.day} aria-label={formatDay(day)}>
              <h2 className={styles.dayName}>{formatDay(day)}</h2>
              {ofDay.length === 0 ? (
                <p className={styles.dayEmpty}>Sin clases.</p>
              ) : (
                <ul className={styles.list}>
                  {ofDay.map((session) => {
                    const cancelled = session.status === 'cancelled';
                    return (
                      <li key={session.id}>
                        <Link to={`/admin/clases/${session.id}`} className={cx(styles.row, cancelled && styles.muted)}>
                          <span className={styles.rowMain}>
                            <span className={styles.rowTitle}>
                              {formatTime(session.starts_at)} – {formatTime(session.ends_at)}
                            </span>
                            <span className={styles.rowMeta}>
                              {(session.instructor_id && instructorName.get(session.instructor_id)) || 'Sin profesora asignada'}
                            </span>
                          </span>
                          <span className={styles.rowSide}>
                            {cancelled && <Badge tone="outline">Cancelada</Badge>}
                            <span className={cx(styles.count, session.spots_left === 0 && styles.countFull)}>
                              {session.booked}/{session.capacity}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}
    </>
  );
}
