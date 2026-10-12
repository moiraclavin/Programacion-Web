/** Pide al servidor el link de pago de la mensualidad del mes (Mercado Pago, Checkout Pro). */
export async function createCheckout(accessToken: string): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mp-create-preference`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    // El monto y el mes los decide el servidor, por eso no se manda nada.
    body: '{}',
  });

  const body = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!response.ok || !body?.url) {
    throw new Error(body?.error ?? 'No pudimos iniciar el pago. Probá de nuevo en unos minutos.');
  }
  return body.url;
}
