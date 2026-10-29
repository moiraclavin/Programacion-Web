// Alta de alumnas y links de acceso, solo para el admin.
//
// Crear un usuario de login necesita la clave de servicio, que nunca puede estar en el navegador.
// Por eso el panel llama a esta función, que primero comprueba que quien llama es admin.
//
// No manda mails: devuelve un link para que el estudio se lo pase a la alumna (por WhatsApp, por ejemplo).
// Con ese link la alumna elige su contraseña. Su usuario es su email.
//
// Acciones (POST, JSON):
//   { "action": "create",   "email", "firstName", "lastName", "phone"? } → crea la alumna y devuelve el link
//   { "action": "new-link", "studentId" }                               → link nuevo para una alumna que ya existe

import { createClient } from 'npm:@supabase/supabase-js@2';
import { allowedOrigin } from '../_shared/mercadopago.ts';

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://programacion-web-theta-orpin.vercel.app';
const ALLOWED_ORIGINS: Array<string | RegExp> = [
  SITE_URL,
  'http://localhost:5173',
  /^https:\/\/programacion-web-[a-z0-9-]+-patsy\.vercel\.app$/,
];

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(origin && { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }),
    },
  });
}

const clean = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');

Deno.serve(async (req) => {
  const origin = allowedOrigin(req.headers.get('origin'), ALLOWED_ORIGINS);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin && { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405, origin);

  // 1. Quién llama, y si es admin.
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Tenés que iniciar sesión' }, 401, origin);
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json({ error: 'Tu sesión venció. Volvé a ingresar.' }, 401, origin);

  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.user.id).single();
  if (callerProfile?.role !== 'admin') return json({ error: 'Solo el admin puede hacer esto.' }, 403, origin);

  const body = await req.json().catch(() => null);

  // 2a. Alta de una alumna nueva.
  if (body?.action === 'create') {
    const email = clean(body.email, 200).toLowerCase();
    const firstName = clean(body.firstName, 80);
    const lastName = clean(body.lastName, 80);
    const phone = clean(body.phone, 30);

    if (!EMAIL.test(email)) return json({ error: 'El email no es válido.' }, 400, origin);
    if (!firstName || !lastName) return json({ error: 'Faltan el nombre y el apellido.' }, 400, origin);

    // generateLink "invite" crea el usuario (sin contraseña) y devuelve el código del link.
    // El perfil lo crea solo el trigger de la base, con estos datos.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { data: { first_name: firstName, last_name: lastName, phone: phone || null } },
    });

    if (error || !data?.properties?.hashed_token) {
      const exists = error?.code === 'email_exists' || /already|registered/i.test(error?.message ?? '');
      if (exists) return json({ error: 'Ya existe una cuenta con ese email.' }, 409, origin);
      console.error('No se pudo crear la alumna', error?.message);
      return json({ error: 'No pudimos crear la alumna. Probá de nuevo.' }, 500, origin);
    }

    return json(
      {
        studentId: data.user.id,
        email,
        link: `${SITE_URL}/crear-contrasena?token_hash=${data.properties.hashed_token}&type=invite`,
      },
      200,
      origin,
    );
  }

  // 2b. Link nuevo para una alumna que ya existe (olvidó la contraseña, o el link venció).
  if (body?.action === 'new-link') {
    const studentId = clean(body.studentId, 50);
    if (!studentId) return json({ error: 'Falta la alumna.' }, 400, origin);

    const { data: target } = await admin.from('profiles').select('role, email').eq('id', studentId).maybeSingle();
    if (!target?.email) return json({ error: 'No encontramos a esa alumna.' }, 404, origin);
    // No se generan links de acceso para cuentas de admin desde acá.
    if (target.role === 'admin') return json({ error: 'No se puede generar un link para una cuenta de admin.' }, 403, origin);

    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: target.email });
    if (error || !data?.properties?.hashed_token) {
      console.error('No se pudo generar el link', error?.message);
      return json({ error: 'No pudimos generar el link. Probá de nuevo.' }, 500, origin);
    }

    return json(
      {
        studentId,
        email: target.email,
        link: `${SITE_URL}/crear-contrasena?token_hash=${data.properties.hashed_token}&type=recovery`,
      },
      200,
      origin,
    );
  }

  return json({ error: 'Acción no válida' }, 400, origin);
});
