import { useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '../../components/ui';
import { isValidEmail } from '../../lib/validation';
import { whatsappNumber } from '../../lib/phone';
import { useAuth } from '../auth/AuthProvider';
import { createStudent } from './adminStudents';
import type { AccessInfo } from './AccessLinkModal';

export interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  /** La alumna ya está creada: se muestra el link de acceso y se vuelve a pedir la lista. */
  onCreated: (access: AccessInfo) => void;
}

interface Fields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const EMPTY: Fields = { firstName: '', lastName: '', email: '', phone: '' };

function validate(fields: Fields): Partial<Record<keyof Fields, string>> {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!fields.firstName.trim()) errors.firstName = 'Escribí el nombre.';
  if (!fields.lastName.trim()) errors.lastName = 'Escribí el apellido.';
  if (!fields.email.trim()) errors.email = 'Escribí el email: es su usuario para ingresar.';
  else if (!isValidEmail(fields.email)) errors.email = 'Revisá el email: tiene que ser como nombre@correo.com.';
  if (fields.phone.trim() && !whatsappNumber(fields.phone)) {
    errors.phone = 'Revisá el celular: tiene que tener código de área y número, por ejemplo 11 5555 5555.';
  }
  return errors;
}

/** Formulario de alta de una alumna. Crea el usuario en Supabase a través del servidor. */
export function AddStudentModal({ open, onClose, onCreated }: AddStudentModalProps) {
  const { session } = useAuth();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = validate(fields);
  // Los errores aparecen después del primer intento de guardar, no mientras se escribe.
  const shown = touched ? errors : {};

  const set = (name: keyof Fields) => (event: { target: { value: string } }) =>
    setFields((current) => ({ ...current, [name]: event.target.value }));

  function close() {
    setFields(EMPTY);
    setTouched(false);
    setServerError(null);
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    setServerError(null);
    if (Object.keys(errors).length > 0 || !session) return;

    setSaving(true);
    try {
      const result = await createStudent(session.access_token, {
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        email: fields.email.trim().toLowerCase(),
        phone: fields.phone.trim(),
      });
      onCreated({
        name: `${fields.firstName.trim()} ${fields.lastName.trim()}`,
        email: result.email,
        phone: fields.phone.trim() || null,
        link: result.link,
        isNew: true,
      });
      close();
    } catch (caught) {
      setServerError(caught instanceof Error ? caught.message : 'No pudimos crear la alumna.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Agregar alumna"
      description="Se crea su usuario y te damos un link para que elija su contraseña."
    >
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Input label="Nombre" autoComplete="off" value={fields.firstName} onChange={set('firstName')} error={shown.firstName} />
        <Input label="Apellido" autoComplete="off" value={fields.lastName} onChange={set('lastName')} error={shown.lastName} />
        <Input
          label="Email"
          type="email"
          autoComplete="off"
          hint="Es su usuario para ingresar."
          value={fields.email}
          onChange={set('email')}
          error={shown.email}
        />
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
          <Button variant="ghost" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Crear alumna
          </Button>
        </div>
      </form>
    </Modal>
  );
}
