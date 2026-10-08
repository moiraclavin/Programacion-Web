import { useState, type FormEvent } from 'react';
import { Badge, Button, EmptyState, Input, Select, Spinner } from '../../components/ui';
import { studio } from '../../content/studio';
import { useAuth } from '../../features/auth/AuthProvider';
import { cx } from '../../lib/cx';
import { weekdayLabel } from '../../lib/dates';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export function AdminSchedulePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const templates = useQuery(
    () =>
      unwrap(
        supabase
          .from('class_templates')
          .select('id, weekday, start_time, duration_min, capacity, active, instructors(name)')
          .order('weekday')
          .order('start_time'),
      ),
    [],
  );
  const instructors = useQuery(
    () => unwrap(supabase.from('instructors').select('id, name, specialty, active').order('sort_order').order('name')),
    [],
  );

  const [error, setError] = useState<string | null>(null);

  // Formulario de horario
  const [weekday, setWeekday] = useState('1');
  const [startTime, setStartTime] = useState('08:00');
  const [capacity, setCapacity] = useState(String(studio.maxClassSize));
  const [instructorId, setInstructorId] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Formulario de profesora
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [savingInstructor, setSavingInstructor] = useState(false);

  async function addTemplate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSavingTemplate(true);
    const { error: insertError } = await supabase.from('class_templates').insert({
      weekday: Number(weekday),
      start_time: startTime,
      capacity: Number(capacity),
      instructor_id: instructorId || null,
    });
    setSavingTemplate(false);
    if (insertError) return setError(insertError.message);
    templates.reload();
  }

  async function toggleTemplate(id: string, active: boolean) {
    setError(null);
    const { error: updateError } = await supabase.from('class_templates').update({ active }).eq('id', id);
    if (updateError) return setError(updateError.message);
    templates.reload();
  }

  async function addInstructor(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSavingInstructor(true);
    const { error: insertError } = await supabase
      .from('instructors')
      .insert({ name: name.trim(), specialty: specialty.trim() || null });
    setSavingInstructor(false);
    if (insertError) return setError(insertError.message);
    setName('');
    setSpecialty('');
    instructors.reload();
  }

  const activeInstructors = instructors.data?.filter((i) => i.active) ?? [];

  return (
    <>
      <h1 className={styles.title}>Horarios</h1>
      <p className={styles.subtitle}>
        El horario fijo de cada semana. Con estos horarios se generan las clases desde la Agenda.
      </p>

      {error && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          {error}
        </p>
      )}

      <section className={styles.section} aria-label="Horarios semanales">
        <h2 className={styles.sectionTitle}>Horarios semanales</h2>
        {templates.loading && !templates.data ? (
          <Spinner />
        ) : templates.data?.length === 0 ? (
          <EmptyState title="Todavía no cargaste horarios" description="Agregá el primero con el formulario de abajo." />
        ) : (
          <ul className={styles.list}>
            {templates.data?.map((template) => (
              <li key={template.id} className={cx(styles.row, !template.active && styles.muted)}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>
                    {weekdayLabel(template.weekday)} · {template.start_time.slice(0, 5)}
                  </span>
                  <span className={styles.rowMeta}>
                    {template.instructors?.name ?? 'Sin profesora asignada'} · {template.capacity} lugares
                  </span>
                </span>
                <span className={styles.rowSide}>
                  {!template.active && <Badge tone="outline">Pausado</Badge>}
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => toggleTemplate(template.id, !template.active)}>
                      {template.active ? 'Pausar' : 'Activar'}
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section className={styles.section} aria-label="Agregar horario">
          <h2 className={styles.sectionTitle}>Agregar horario</h2>
          <form className={styles.form} onSubmit={addTemplate}>
            <Select label="Día" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {weekdayLabel(day)}
                </option>
              ))}
            </Select>
            <Input label="Hora de inicio" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input
              label="Lugares"
              type="number"
              min={1}
              required
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
            <Select label="Profesora" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              <option value="">Sin asignar</option>
              {activeInstructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </Select>
            <div className={cx(styles.formActions, styles.formWide)}>
              <Button type="submit" loading={savingTemplate} disabled={!startTime || Number(capacity) < 1}>
                Agregar horario
              </Button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.section} aria-label="Profesoras">
        <h2 className={styles.sectionTitle}>Profesoras</h2>
        {instructors.loading && !instructors.data ? (
          <Spinner />
        ) : instructors.data?.length === 0 ? (
          <EmptyState title="Todavía no cargaste profesoras" />
        ) : (
          <ul className={styles.list}>
            {instructors.data?.map((instructor) => (
              <li key={instructor.id} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{instructor.name}</span>
                  {instructor.specialty && <span className={styles.rowMeta}>{instructor.specialty}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <form className={styles.form} onSubmit={addInstructor} style={{ marginTop: 'var(--space-6)' }}>
            <Input label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Especialidad (opcional)" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            <div className={cx(styles.formActions, styles.formWide)}>
              <Button type="submit" variant="secondary" loading={savingInstructor} disabled={!name.trim()}>
                Agregar profesora
              </Button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
