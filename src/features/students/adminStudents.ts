export interface AccessResult {
  studentId: string;
  email: string;
  /** Link para que la alumna elija su contraseña. Se lo pasa el estudio (por ejemplo, por WhatsApp). */
  link: string;
}

export interface NewStudent {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

async function callAdminStudents(accessToken: string, payload: Record<string, unknown>): Promise<AccessResult> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-students`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as (Partial<AccessResult> & { error?: string }) | null;
  if (!response.ok || !body?.link || !body.studentId || !body.email) {
    throw new Error(body?.error ?? 'No pudimos completar la acción. Probá de nuevo en unos minutos.');
  }
  return { studentId: body.studentId, email: body.email, link: body.link };
}

/** Crea la alumna en Supabase (usuario de login + perfil) y devuelve el link para que elija su contraseña. */
export function createStudent(accessToken: string, student: NewStudent): Promise<AccessResult> {
  return callAdminStudents(accessToken, { action: 'create', ...student });
}

/** Genera un link nuevo para una alumna que ya existe (olvidó la contraseña, o el link anterior venció). */
export function newAccessLink(accessToken: string, studentId: string): Promise<AccessResult> {
  return callAdminStudents(accessToken, { action: 'new-link', studentId });
}
