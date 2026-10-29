import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select } from '../../components/ui';
import { studio } from '../../content/studio';
import { addDays, formatDay, slotStart, type Ymd } from '../../lib/dates';
import { createSessions } from './sessions';

export interface Slot {
  day: Ymd;
  hour: number;
}

export interface AddClassModalProps {
  /** El horario elegido en el calendario; null mantiene el modal cerrado. */
  slot: Slot | null;
  instructors: Array<{ id: string; name: string }>;
  onClose: () => void;
  /** Resultado para mostrar en pantalla y volver a pedir los datos. */
  onCreated: (result: { created: number; skipped: number; weeks: number }) => void;
}

const REPEAT_OPTIONS = [
  { weeks: 1, label: 'Solo esta clase' },
  { weeks: 4, label: 'Esta y las próximas 3 semanas' },
  { weeks: 8, label: 'Esta y las próximas 7 semanas' },
  { weeks: 12, label: 'Esta y las próximas 11 semanas' },
];

const MAX_CAPACITY = 30;

const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/** Agrega una clase de 1 hora en el horario tocado, opcionalmente repetida varias semanas. */
export function AddClassModal({ slot, instructors, onClose, onCreated }: AddClassModalProps) {
  const [capacity, setCapacity] = useState(String(studio.maxClassSize));
  const [instructorId, setInstructorId] = useState('');
  const [weeks, setWeeks] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cada vez que se abre en otro horario se limpia el error; los demás valores se conservan
  // para que cargar varias clases seguidas sea rápido.
  useEffect(() => {
    setError(null);
  }, [slot?.day, slot?.hour]);

  const capacityNumber = Number(capacity);
  const capacityError =
    !Number.isInteger(capacityNumber) || capacityNumber < 1 || capacityNumber > MAX_CAPACITY
      ? `Los lugares tienen que ser un número entre 1 y ${MAX_CAPACITY}.`
      : undefined;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!slot || capacityError) return;
    setSaving(true);
    setError(null);
    try {
      const count = Number(weeks);
      const result = await createSessions(
        Array.from({ length: count }, (_, i) => ({
          startsAt: slotStart(addDays(slot.day, 7 * i), slot.hour),
          capacity: capacityNumber,
          instructorId: instructorId || null,
        })),
      );
      onCreated({ ...result, weeks: count });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos agregar la clase.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={slot !== null}
      onClose={onClose}
      title="Agregar clase"
      description={slot ? `${formatDay(slot.day)} · ${pad(slot.hour)} a ${pad(slot.hour + 1)}` : undefined}
    >
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Select label="Profesora" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
          <option value="">Sin asignar</option>
          {instructors.map((instructor) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </option>
          ))}
        </Select>
        <Input
          label="Lugares"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_CAPACITY}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          error={capacityError}
        />
        <Select label="Repetir" value={weeks} onChange={(e) => setWeeks(e.target.value)}>
          {REPEAT_OPTIONS.map((option) => (
            <option key={option.weeks} value={option.weeks}>
              {option.label}
            </option>
          ))}
        </Select>
        {error && (
          <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Volver
          </Button>
          <Button type="submit" loading={saving} disabled={Boolean(capacityError)}>
            Agregar clase
          </Button>
        </div>
      </form>
    </Modal>
  );
}
