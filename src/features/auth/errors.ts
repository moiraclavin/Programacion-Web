import type { AuthError } from '@supabase/supabase-js';

/** Traduce los errores de Supabase Auth a mensajes para la alumna. */
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'El email o la contraseña no son correctos.';
    case 'email_not_confirmed':
      return 'Todavía no activaste tu cuenta. Buscá el mail de invitación del estudio.';
    case 'weak_password':
      return 'La contraseña es muy débil. Usá al menos 8 caracteres.';
    case 'same_password':
      return 'La contraseña nueva tiene que ser distinta de la anterior.';
    case 'otp_expired':
      return 'El link venció o ya se usó. Pedí uno nuevo desde "Olvidé mi contraseña".';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.';
    default:
      return 'Algo salió mal. Probá de nuevo en unos minutos.';
  }
}
