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

/**
 * Qué mes se está pagando. Sin dato, el mes actual. Se acepta "YYYY-MM" o "YYYY-MM-01",
 * desde el mes actual hasta 12 meses adelante. Devuelve null si el dato no es válido o está fuera de ese rango.
 */
export function resolvePeriod(input: unknown, now: Date): string | null {
  const current = periodOf(now);
  if (input === undefined || input === null || input === '') return current;
  if (typeof input !== 'string') return null;

  const match = /^(\d{4})-(\d{2})(?:-01)?$/.exec(input);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const [currentYear, currentMonth] = current.split('-').map(Number);
  const monthsAhead = (Number(match[1]) - currentYear) * 12 + (month - currentMonth);
  return monthsAhead >= 0 && monthsAhead <= 12 ? `${match[1]}-${match[2]}-01` : null;
}

/**
 * Devuelve el origen si está permitido (para CORS y para las URLs de regreso); si no, null.
 * Cada permitido puede ser una dirección exacta o una expresión regular (los previews de Vercel).
 */
export function allowedOrigin(origin: string | null, allowed: Array<string | RegExp>): string | null {
  if (!origin) return null;
  return allowed.some((rule) => (typeof rule === 'string' ? rule === origin : rule.test(origin))) ? origin : null;
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
