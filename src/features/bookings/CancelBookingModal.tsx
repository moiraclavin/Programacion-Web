import { useEffect, useState } from 'react';
import { Button, Modal } from '../../components/ui';
import { formatDateTime } from '../../lib/dates';
import { supabase } from '../../lib/supabase';

export interface CancelTarget {
  id: string;
  startsAt: string;
}

export interface CancelBookingModalProps {
  /** La reserva a cancelar; null mantiene el modal cerrado. */
  target: CancelTarget | null;
  cancelWindowHours: number;
  onClose: () => void;
  /** Se llama después de cancelar, para que la pantalla vuelva a pedir sus datos. */
  onCancelled: () => void;
}

/** Confirma la cancelación y explica si la clase se descuenta (la regla la aplica la base). */
export function CancelBookingModal({ target, cancelWindowHours, onClose, onCancelled }: CancelBookingModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [target?.id]);

  const isLate = target ? new Date(target.startsAt).getTime() - Date.now() < cancelWindowHours * 3_600_000 : false;

  async function confirm() {
    if (!target) return;
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc('cancel_booking', { p_booking_id: target.id });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onCancelled();
    onClose();
  }

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title="¿Cancelar la clase?"
      description={target ? formatDateTime(target.startsAt) : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Volver
          </Button>
          <Button onClick={confirm} loading={busy}>
            Sí, cancelar
          </Button>
        </>
      }
    >
      <p>
        {isLate
          ? `Faltan menos de ${cancelWindowHours} horas: el lugar se libera, pero esta clase cuenta como usada (también para el máximo de clases por semana).`
          : `Faltan más de ${cancelWindowHours} horas, así que el lugar se libera y no se descuenta de tu plan.`}
      </p>
      {error && (
        <p role="alert" style={{ marginTop: 'var(--space-4)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
          {error}
        </p>
      )}
    </Modal>
  );
}
