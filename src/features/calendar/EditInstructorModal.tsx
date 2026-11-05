import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '../../components/ui';
import { isValidName } from '../../lib/validation';
import { supabase } from '../../lib/supabase';

export interface EditInstructorData {
  id: string;
  name: string;
  specialty: string | null;
}

export interface EditInstructorModalProps {
  instructor: EditInstructorData | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditInstructorModal({ instructor, onClose, onSaved }: EditInstructorModalProps) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  useEffect(() => {
    if (instructor) {
      setName(instructor.name);
      setSpecialty(instructor.specialty ?? '');
      setNameError(undefined);
      setError(null);
    }
  }, [instructor]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setNameError('Escribí el nombre.');
      return;
    }
    if (!isValidName(name)) {
      setNameError('El nombre tiene que tener entre 2 y 80 caracteres.');
      return;
    }
    setNameError(undefined);
    if (!instructor) return;

    setSaving(true);
    const { error: updateError } = await supabase
      .from('instructors')
      .update({ name: name.trim(), specialty: specialty.trim() || null })
      .eq('id', instructor.id);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open={instructor !== null} onClose={onClose} title="Editar profesora">
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
        <Input label="Especialidad (opcional)" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        {error && (
          <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
