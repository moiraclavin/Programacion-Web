/**
 * Convierte un celular argentino al formato de WhatsApp (wa.me): solo dígitos, con 54 y 9 adelante.
 * Acepta "11 5555-5555", "011 5555 5555", "+54 11 5555 5555" o "+54 9 11 5555 5555".
 * Devuelve null si no parece un número válido (así la pantalla puede pedir que lo revisen).
 */
export function whatsappNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('54')) {
    const rest = digits.slice(2);
    digits = rest.startsWith('9') ? digits : `549${rest}`;
  } else {
    digits = `549${digits.replace(/^0/, '')}`;
  }

  // 54 + 9 + 10 dígitos (área + número) = 13
  return digits.length === 13 ? digits : null;
}
