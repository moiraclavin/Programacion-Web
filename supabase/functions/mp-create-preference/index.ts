// Crea el cobro de la mensualidad del mes y devuelve el link de pago de Mercado Pago (Checkout Pro).
//
// La alumna llama a esta función con su sesión. El monto y el mes los decide el servidor:
// nunca se toman de lo que manda el navegador.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { allowedOrigin, periodOf } from '../_shared/mercadopago.ts';

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://programacion-web-theta-orpin.vercel.app';
const ALLOWED_ORIGINS = [SITE_URL, 'http://localhost:5173', 'http://localhost:5199'];

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(origin && {
        'Access-Control-Allow-Origin': origin,
        Vary: 'Origin',
      }),
    },
  });
}

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

  // 1. Quién es la alumna (se valida el token con Supabase Auth).
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Tenés que iniciar sesión' }, 401, origin);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: 'Tu sesión venció. Volvé a ingresar.' }, 401, origin);
  const user = userData.user;

  // 2. Cuánto y qué mes se cobra.
  const { data: settings, error: settingsError } = await admin.from('studio_settings').select('monthly_fee').single();
  if (settingsError) return json({ error: 'No pudimos leer el valor de la mensualidad' }, 500, origin);
  const fee = Number(settings.monthly_fee);
  if (!(fee > 0)) return json({ error: 'El estudio todavía no cargó el valor de la mensualidad.' }, 409, origin);

  const period = periodOf(new Date());

  const { data: existing, error: membershipError } = await admin
    .from('memberships')
    .select('id, status')
    .eq('student_id', user.id)
    .eq('period', period)
    .maybeSingle();
  if (membershipError) return json({ error: 'No pudimos revisar tu mensualidad' }, 500, origin);
  if (existing?.status === 'active') return json({ error: 'Ya pagaste la mensualidad de este mes.' }, 409, origin);

  let membershipId = existing?.id;
  if (!membershipId) {
    const { data: created, error: createError } = await admin
      .from('memberships')
      .insert({ student_id: user.id, period, amount: fee, status: 'pending' })
      .select('id')
      .single();
    if (createError) return json({ error: 'No pudimos crear tu mensualidad' }, 500, origin);
    membershipId = created.id;
  }

  // 3. Los intentos anteriores que nunca se pagaron se descartan, para no llenar el historial.
  await admin
    .from('payments')
    .delete()
    .eq('membership_id', membershipId)
    .eq('status', 'pending')
    .is('mp_payment_id', null);

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({ student_id: user.id, membership_id: membershipId, amount: fee, status: 'pending' })
    .select('id')
    .single();
  if (paymentError) return json({ error: 'No pudimos registrar el pago' }, 500, origin);

  // 4. Se crea la preferencia en Mercado Pago. Nuestro id de pago viaja como external_reference
  //    y es lo que usa el webhook para saber de qué pago se trata.
  const base = origin ?? SITE_URL;
  const back = (result: string) => `${base}/app/pagos?resultado=${result}`;
  const monthName = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
    new Date(`${period}T00:00:00Z`),
  );

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ title: `Mensualidad ${monthName}`, quantity: 1, unit_price: fee, currency_id: 'ARS' }],
      external_reference: payment.id,
      payer: { email: user.email },
      back_urls: { success: back('ok'), failure: back('error'), pending: back('pendiente') },
      // Mercado Pago solo acepta volver automáticamente a direcciones https.
      ...(base.startsWith('https://') && { auto_return: 'approved' }),
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
      statement_descriptor: 'CASA PILATES',
    }),
  });

  const preference = await mpResponse.json().catch(() => null);
  if (!mpResponse.ok || !preference?.init_point) {
    console.error('Mercado Pago rechazó la preferencia', mpResponse.status, JSON.stringify(preference));
    await admin.from('payments').delete().eq('id', payment.id);
    return json({ error: 'No pudimos iniciar el pago. Probá de nuevo en unos minutos.' }, 502, origin);
  }

  await admin.from('payments').update({ mp_preference_id: preference.id }).eq('id', payment.id);

  return json({ url: preference.init_point }, 200, origin);
});
