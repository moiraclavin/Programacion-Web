// Lógica pura de los pagos con Mercado Pago. No importa nada de Deno ni de Supabase,
// así se puede probar con `npm test`.

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

/** Traduce el estado de Mercado Pago al estado de nuestra tabla `payments`. */
export function mapPaymentStatus(mpStatus: string | undefined): PaymentStatus {
  switch (mpStatus) {
    case 'approved':
      return 'approved';
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      // pending, in_process, authorized, in_mediation, y cualquier estado nuevo que aparezca.
      return 'pending';
  }
}

/** Compara montos en pesos sin que molesten los decimales de punto flotante. */
export function amountsMatch(a: number | string, b: number | string): boolean {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

/** Primer día del mes (hora de Buenos Aires) de un instante: así se identifica cada mensualidad. */
export function periodOf(date: Date): string {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return `${ymd.slice(0, 8)}01`;
}

/** Devuelve el origen si es uno de los permitidos (para CORS y para las URLs de regreso); si no, null. */
export function allowedOrigin(origin: string | null, allowed: string[]): string | null {
  return origin && allowed.includes(origin) ? origin : null;
}

/**
 * Texto que firma Mercado Pago en cada notificación:
 * "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" (las partes que falten se omiten).
 */
export function signatureManifest(parts: { dataId?: string | null; requestId?: string | null; ts: string }): string {
  let manifest = '';
  if (parts.dataId) manifest += `id:${parts.dataId.toLowerCase()};`;
  if (parts.requestId) manifest += `request-id:${parts.requestId};`;
  manifest += `ts:${parts.ts};`;
  return manifest;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Verifica el header `x-signature` ("ts=...,v1=...") de una notificación de Mercado Pago. */
export async function verifySignature(args: {
  secret: string;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): Promise<boolean> {
  if (!args.signatureHeader) return false;

  const fields = Object.fromEntries(
    args.signatureHeader.split(',').map((piece) => {
      const [name, ...value] = piece.trim().split('=');
      return [name, value.join('=')];
    }),
  );
  const { ts, v1 } = fields;
  if (!ts || !v1) return false;

  const expected = await hmacSha256Hex(
    args.secret,
    signatureManifest({ dataId: args.dataId, requestId: args.requestId, ts }),
  );

  // Comparación en tiempo constante.
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}
