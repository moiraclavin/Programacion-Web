import { useState } from 'react';
import { Button, Spinner } from '../../components/ui';
import { AddClassModal, type Slot } from '../../features/calendar/AddClassModal';
import { ClassDetailModal } from '../../features/calendar/ClassDetailModal';
import { createSessions } from '../../features/calendar/sessions';
import { WeekCalendar, type CalendarSession } from '../../features/calendar/WeekCalendar';
import { useAuth } from '../../features/auth/AuthProvider';
import { cx } from '../../lib/cx';
import { addDays, formatShortDay, mondayOf, startOfDay, toYmd } from '../../lib/dates';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

type Notice = { kind: 'ok' | 'error'; text: string };

export function AdminAgendaPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [monday, setMonday] = useState(() => mondayOf(toYmd()));
  const [slotToAdd, setSlotToAdd] = useState<Slot | null>(null);
  const [selected, setSelected] = useState<CalendarSession | null>(null);
  const [copying, setCopying] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

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
  const instructors = useQuery(() => unwrap(supabase.from('instructors').select('id, name, active').order('name')), []);

  const instructorName = new Map(instructors.data?.map((i) => [i.id, i.name]));
  const activeInstructors = instructors.data?.filter((i) => i.active) ?? [];
  const thisMonday = mondayOf(toYmd());

  async function copyToNextWeek() {
    const scheduled = sessions.data?.filter((s) => s.status === 'scheduled') ?? [];
    if (scheduled.length === 0) {
      setNotice({ kind: 'error', text: 'Esta semana no tiene clases para copiar.' });
      return;
    }
    setCopying(true);
    setNotice(null);
    try {
      const result = await createSessions(
        scheduled.map((s) => ({
          startsAt: new Date(new Date(s.starts_at).getTime() + 7 * 86_400_000),
          capacity: s.capacity,
          instructorId: s.instructor_id,
        })),
      );
      setNotice({
        kind: 'ok',
        text:
          `Se copiaron ${result.created} clases a la semana del ${formatShortDay(addDays(monday, 7))}.` +
          (result.skipped > 0 ? ` ${result.skipped} ya existían.` : ''),
      });
    } catch (caught) {
      setNotice({ kind: 'error', text: caught instanceof Error ? caught.message : 'No pudimos copiar la semana.' });
    } finally {
      setCopying(false);
    }
  }

  return (
    <>
      <h1 className={styles.title}>Agenda</h1>
      <p className={styles.subtitle}>
        {isAdmin
          ? 'Tocá un horario vacío para agregar una clase, o una clase para verla o cancelarla.'
          : 'Las clases de cada semana y cuántas alumnas se anotaron. Tocá una clase para ver el detalle.'}
      </p>

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
        {isAdmin && (
          <Button variant="secondary" size="sm" onClick={copyToNextWeek} loading={copying}>
            Copiar semana a la siguiente
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
      ) : (
        <WeekCalendar
          monday={monday}
          sessions={sessions.data ?? []}
          instructorName={instructorName}
          // Las profesoras (sin rol de admin) ven el calendario pero no pueden agregar clases.
          onAdd={(day, hour) => isAdmin && setSlotToAdd({ day, hour })}
          onOpen={setSelected}
        />
      )}

      <AddClassModal
        slot={isAdmin ? slotToAdd : null}
        instructors={activeInstructors}
        onClose={() => setSlotToAdd(null)}
        onCreated={({ created, skipped, weeks }) => {
          setNotice({
            kind: 'ok',
            text:
              weeks === 1
                ? created > 0
                  ? 'Clase agregada.'
                  : 'Ya había una clase en ese horario.'
                : `Se agregaron ${created} clases.` + (skipped > 0 ? ` ${skipped} ya existían.` : ''),
          });
          sessions.reload();
        }}
      />

      <ClassDetailModal
        session={selected}
        canManage={isAdmin}
        teacher={(selected?.instructor_id && instructorName.get(selected.instructor_id)) || 'Sin profesora asignada'}
        onClose={() => setSelected(null)}
        onChanged={(message) => {
          setNotice({ kind: 'ok', text: message });
          sessions.reload();
        }}
      />
    </>
  );
}
