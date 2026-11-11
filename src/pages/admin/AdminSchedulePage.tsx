import { useState, type FormEvent } from 'react';
import { Badge, Button, EmptyState, Input, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { EditInstructorModal, type EditInstructorData } from '../../features/calendar/EditInstructorModal';
import { useStudioSettings } from '../../features/studio/useStudioSettings';
import { cx } from '../../lib/cx';
import { formatMoney } from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

export function AdminSchedulePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const instructors = useQuery(
    () => unwrap(supabase.from('instructors').select('id, name, specialty, active').order('sort_order').order('name')),
    [],
  );

  const settings = useStudioSettings();

  const [error, setError] = useState<string | null>(null);

  // Mensualidad
  const [feeInput, setFeeInput] = useState('');
  const [savingFee, setSavingFee] = useState(false);
  const [feeMsg, setFeeMsg] = useState<string | null>(null);

  // Formulario de profesora
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [savingInstructor, setSavingInstructor] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<EditInstructorData | null>(null);

  async function toggleInstructor(id: string, active: boolean) {
    setError(null);
    const { error: updateError } = await supabase.from('instructors').update({ active }).eq('id', id);
    if (updateError) return setError(updateError.message);
    instructors.reload();
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

  async function saveFee(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFeeMsg(null);
    const value = Number(feeInput);
    if (!Number.isFinite(value) || value <= 0) {
      setError('El valor tiene que ser un número mayor a 0.');
      return;
    }
    setSavingFee(true);
    const { error: updateError } = await supabase.from('studio_settings').update({ monthly_fee: value }).eq('id', true);
    setSavingFee(false);
    if (updateError) return setError(updateError.message);
    setFeeMsg('Valor actualizado.');
    setFeeInput('');
    settings.reload();
  }

  return (
    <>
      <h1 className={styles.title}>Ajustes</h1>
      <p className={styles.subtitle}>Valor de la mensualidad y profesoras del estudio.</p>

      {error && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          {error}
        </p>
      )}

      {isAdmin && (
        <section className={styles.section} aria-label="Mensualidad">
          <h2 className={styles.sectionTitle}>Valor de la mensualidad</h2>
          <p className={styles.rowMeta}>
            Valor actual: <strong>{settings.data ? formatMoney(settings.data.monthly_fee) : '…'}</strong>.
            El cambio aplica a pagos nuevos y no modifica los montos ya registrados.
          </p>
          <form className={styles.form} onSubmit={saveFee} style={{ marginTop: 'var(--space-4)' }}>
            <Input
              label="Nuevo valor ($)"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.01"
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              placeholder={settings.data ? String(settings.data.monthly_fee) : ''}
            />
            <div className={cx(styles.formActions, styles.formWide)}>
              <Button type="submit" loading={savingFee} disabled={!feeInput}>
                Actualizar valor
              </Button>
            </div>
          </form>
          {feeMsg && (
            <p className={cx(styles.alert, styles.alertOk)} role="status" style={{ marginTop: 'var(--space-4)' }}>
              {feeMsg}
            </p>
          )}
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
              <li key={instructor.id} className={cx(styles.row, !instructor.active && styles.muted)}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{instructor.name}</span>
                  {instructor.specialty && <span className={styles.rowMeta}>{instructor.specialty}</span>}
                </span>
                <span className={styles.rowSide}>
                  {!instructor.active && <Badge tone="outline">Inactiva</Badge>}
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setEditingInstructor(instructor)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleInstructor(instructor.id, !instructor.active)}>
                        {instructor.active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </>
                  )}
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
      <EditInstructorModal
        instructor={editingInstructor}
        onClose={() => setEditingInstructor(null)}
        onSaved={() => instructors.reload()}
      />
    </>
  );
}
