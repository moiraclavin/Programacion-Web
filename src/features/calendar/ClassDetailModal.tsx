import { useEffect, useState } from 'react';
import { Button, ButtonLink, Modal } from '../../components/ui';
import { formatDateTime, formatTime } from '../../lib/dates';
import { cancelSession, reopenSession } from './sessions';
import type { CalendarSession } from './WeekCalendar';

export interface ClassDetailModalProps {
  /** La clase tocada; null mantiene el modal cerrado. */
  session: CalendarSession | null;
  /** Solo el admin puede cancelar o reactivar clases; las profesoras solo ven el detalle. */
  canManage: boolean;
  teacher: string;
  onClose: () => void;
  /** Mensaje para mostrar en pantalla; se vuelven a pedir los datos del calendario. */
  onChanged: (message: string) => void;
}

/** Detalle de una clase: ver alumnas y asistencia, cancelarla (con confirmación) o reactivarla. */
export function ClassDetailModal({ session, canManage, teacher, onClose, onChanged }: ClassDetailModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirming(false);
    setError(null);
  }, [session?.id]);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setError(null);
    try {
      onChanged(await action());
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos completar la acción.');
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <Modal open={false} onClose={onClose} title="Clase" />;

  const cancelled = session.status === 'cancelled';
  const started = new Date(session.starts_at).getTime() <= Date.now();
  const when = `${formatDateTime(session.starts_at)} a ${formatTime(session.ends_at)}`;

  const errorText = error && (
    <p role="alert" style={{ marginTop: 'var(--space-4)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
      {error}
    </p>
  );

  if (confirming) {
    return (
      <Modal
        open
        onClose={onClose}
        title="¿Cancelar esta clase?"
        description={when}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Volver
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={() =>
                run(async () => {
                  const cancelledBookings = await cancelSession(session.id);
                  return cancelledBookings > 0
                    ? `Clase cancelada. Se cancelaron las reservas de ${cancelledBookings} alumna${cancelledBookings === 1 ? '' : 's'}: conviene avisarles.`
                    : 'Clase cancelada.';
                })
              }
            >
              Sí, cancelar clase
            </Button>
          </>
        }
      >
        <p>
          {session.booked > 0
            ? `Hay ${session.booked} alumna${session.booked === 1 ? '' : 's'} anotada${session.booked === 1 ? '' : 's'}. Se les cancela la reserva y no se les descuenta la clase. Por ahora no se les avisa automáticamente.`
            : 'Todavía no hay alumnas anotadas.'}
        </p>
        {errorText}
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={cancelled ? 'Clase cancelada' : 'Clase'}
      description={when}
      footer={
        <>
          {canManage && !cancelled && !started && (
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Cancelar clase
            </Button>
          )}
          {canManage && cancelled && !started && (
            <Button
              variant="secondary"
              loading={busy}
              onClick={() =>
                run(async () => {
                  await reopenSession(session.id);
                  return 'Clase reactivada. Las alumnas tienen que volver a reservar.';
                })
              }
            >
              Reactivar clase
            </Button>
          )}
          <ButtonLink to={`/admin/clases/${session.id}`}>Ver alumnas</ButtonLink>
        </>
      }
    >
      <p>
        {teacher} · {session.booked} de {session.capacity} lugares ocupados
        {cancelled ? ' (las reservas se cancelaron al cancelar la clase)' : ''}.
      </p>
      {errorText}
    </Modal>
  );
}
