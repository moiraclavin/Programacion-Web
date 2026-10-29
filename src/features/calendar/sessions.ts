import { supabase } from '../../lib/supabase';

export interface NewSession {
  startsAt: Date;
  capacity: number;
  instructorId: string | null;
}

const HOUR_MS = 3_600_000;

function friendly(message: string): string {
  return message.includes('class_sessions_one_scheduled') ? 'Ya hay otra clase en ese horario.' : message;
}

/**
 * Crea clases de 1 hora. Las que caen en un horario que ya tiene una clase se omiten
 * (la base también lo impide: una sola clase vigente por horario).
 */
export async function createSessions(slots: NewSession[]): Promise<{ created: number; skipped: number }> {
  if (slots.length === 0) return { created: 0, skipped: 0 };

  const { data: taken, error } = await supabase
    .from('class_sessions')
    .select('starts_at')
    .eq('status', 'scheduled')
    .in(
      'starts_at',
      slots.map((slot) => slot.startsAt.toISOString()),
    );
  if (error) throw new Error(friendly(error.message));

  const busy = new Set(taken.map((row) => new Date(row.starts_at).getTime()));
  const free = slots.filter((slot) => !busy.has(slot.startsAt.getTime()));

  if (free.length > 0) {
    const { error: insertError } = await supabase.from('class_sessions').insert(
      free.map((slot) => ({
        starts_at: slot.startsAt.toISOString(),
        ends_at: new Date(slot.startsAt.getTime() + HOUR_MS).toISOString(),
        capacity: slot.capacity,
        instructor_id: slot.instructorId,
      })),
    );
    if (insertError) throw new Error(friendly(insertError.message));
  }

  return { created: free.length, skipped: slots.length - free.length };
}

/** Cancela una clase y las reservas de las alumnas (sin descontarles la clase). Devuelve cuántas reservas se cancelaron. */
export async function cancelSession(sessionId: string): Promise<number> {
  const { data, error } = await supabase.rpc('cancel_session', { p_session_id: sessionId });
  if (error) throw new Error(error.message);
  return data;
}

/** Vuelve a abrir una clase cancelada. Las reservas que tenía quedan canceladas. */
export async function reopenSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('class_sessions').update({ status: 'scheduled' }).eq('id', sessionId);
  if (error) throw new Error(friendly(error.message));
}
