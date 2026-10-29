// Recibe los avisos de Mercado Pago y deja el pago y la mensualidad al día.
//
// Nunca se confía en lo que dice la notificación: se usa solo el id del pago para consultarlo
// directamente a Mercado Pago con nuestro token. Si MP_WEBHOOK_SECRET está configurado,
// además se verifica la firma. Es idempotente: recibir el mismo aviso dos veces da el mismo resultado.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { amountsMatch, mapPaymentStatus, verifySignature } from '../_shared/mercadopago.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reply(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ error: 'Método no permitido' }, 405);

  const url = new URL(req.url);
  const body = await req.json().catch(() => null);

  // Mercado Pago manda el aviso de dos formas: JSON (data.id) o por la URL (?topic=payment&id=...).
  const type = body?.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const dataId = String(body?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');

  if (type !== 'payment' || !dataId) return reply({ ignored: 'No es un aviso de pago' });

  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (secret) {
    const valid = await verifySignature({
      secret,
      signatureHeader: req.headers.get('x-signature'),
      requestId: req.headers.get('x-request-id'),
      dataId: url.searchParams.get('data.id') ?? dataId,
    });
    if (!valid) return reply({ error: 'Firma inválida' }, 401);
  }

  // Se consulta el pago a Mercado Pago: esa respuesta es la única fuente de verdad.
  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` },
  });
  if (mpResponse.status === 404) return reply({ ignored: 'Mercado Pago no conoce ese pago' });
  if (!mpResponse.ok) {
    console.error('No se pudo consultar el pago', dataId, mpResponse.status);
    return reply({ error: 'No pudimos consultar el pago' }, 502); // MP reintenta más tarde
  }
  const mp = await mpResponse.json();

  const reference = String(mp.external_reference ?? '');
  if (!UUID.test(reference)) return reply({ ignored: 'El pago no es de esta app' });

  const { data: payment, error: findError } = await admin
    .from('payments')
    .select('id, amount, membership_id')
    .eq('id', reference)
    .maybeSingle();
  if (findError) return reply({ error: 'Error de base de datos' }, 500);
  if (!payment) return reply({ ignored: 'No encontramos ese pago' });

  const status = mapPaymentStatus(mp.status);

  // Un pago aprobado por otro monto no activa la mensualidad.
  if (status === 'approved' && !amountsMatch(mp.transaction_amount, payment.amount)) {
    console.error('El monto aprobado no coincide', { reference, pagado: mp.transaction_amount, esperado: payment.amount });
    return reply({ ignored: 'El monto no coincide' });
  }

  const { error: updateError } = await admin
    .from('payments')
    .update({
      status,
      mp_payment_id: String(mp.id),
      paid_at: status === 'approved' ? (mp.date_approved ?? new Date().toISOString()) : null,
      // Solo se guardan los datos necesarios, no los del pagador.
      raw_payload: {
        id: mp.id,
        status: mp.status,
        status_detail: mp.status_detail,
        payment_method_id: mp.payment_method_id,
        payment_type_id: mp.payment_type_id,
        transaction_amount: mp.transaction_amount,
        date_approved: mp.date_approved,
      },
    })
    .eq('id', payment.id);
  if (updateError) {
    console.error('No se pudo actualizar el pago', updateError.message);
    return reply({ error: 'Error de base de datos' }, 500);
  }

  if (payment.membership_id && (status === 'approved' || status === 'refunded')) {
    const { error: membershipError } = await admin
      .from('memberships')
      .update({ status: status === 'approved' ? 'active' : 'pending' })
      .eq('id', payment.membership_id);
    if (membershipError) return reply({ error: 'Error de base de datos' }, 500);
  }

  return reply({ ok: true, status });
});
