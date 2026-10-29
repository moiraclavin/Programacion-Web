/**
 * Pide al servidor el link de pago de una mensualidad (Mercado Pago, Checkout Pro).
 * `period` es el primer día del mes a pagar ("2026-11-01"); el servidor valida que sea el actual o uno
 * futuro dentro del límite, y decide el monto.
 */
export async function createCheckout(accessToken: string, period: string): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mp-create-preference`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ period }),
  });

  const body = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!response.ok || !body?.url) {
    throw new Error(body?.error ?? 'No pudimos iniciar el pago. Probá de nuevo en unos minutos.');
  }
  return body.url;
}
