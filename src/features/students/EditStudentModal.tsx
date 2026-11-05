import { useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '../../components/ui';
import { isValidName, isValidPhone } from '../../lib/validation';
import { supabase } from '../../lib/supabase';

export interface EditStudentData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface EditStudentModalProps {
  student: EditStudentData | null;
  onClose: () => void;
  onSaved: () => void;
}

interface Fields {
  firstName: string;
  lastName: string;
  phone: string;
}

function validate(fields: Fields): Partial<Record<keyof Fields, string>> {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!fields.firstName.trim()) errors.firstName = 'Escribí el nombre.';
  else if (!isValidName(fields.firstName)) errors.firstName = 'El nombre tiene que tener entre 2 y 80 caracteres.';
  if (!fields.lastName.trim()) errors.lastName = 'Escribí el apellido.';
  else if (!isValidName(fields.lastName)) errors.lastName = 'El apellido tiene que tener entre 2 y 80 caracteres.';
  if (fields.phone.trim() && !isValidPhone(fields.phone)) {
    errors.phone = 'Revisá el celular: tiene que tener código de área y número, por ejemplo 11 5555 5555.';
  }
  return errors;
}

export function EditStudentModal({ student, onClose, onSaved }: EditStudentModalProps) {
  const [fields, setFields] = useState<Fields>({
    firstName: student?.first_name ?? '',
    lastName: student?.last_name ?? '',
    phone: student?.phone ?? '',
  });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = validate(fields);
  const shown = touched ? errors : {};

  const set = (name: keyof Fields) => (event: { target: { value: string } }) =>
    setFields((current) => ({ ...current, [name]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    setServerError(null);
    if (Object.keys(errors).length > 0 || !student) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: fields.firstName.trim(),
        last_name: fields.lastName.trim(),
        phone: fields.phone.trim() || null,
      })
      .eq('id', student.id);
    setSaving(false);

    if (error) {
      setServerError(error.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open={student !== null} onClose={onClose} title="Editar alumna">
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Input label="Nombre" autoComplete="off" value={fields.firstName} onChange={set('firstName')} error={shown.firstName} />
        <Input label="Apellido" autoComplete="off" value={fields.lastName} onChange={set('lastName')} error={shown.lastName} />
        <Input
          label="Celular (opcional)"
          type="tel"
          autoComplete="off"
          hint="Para mandarle el link por WhatsApp."
          value={fields.phone}
          onChange={set('phone')}
          error={shown.phone}
        />
        {serverError && (
          <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {serverError}
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
