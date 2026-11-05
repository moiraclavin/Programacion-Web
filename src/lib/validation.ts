import { whatsappNumber } from './phone.ts';

/** Revisión básica de formato de email: algo@algo.algo, sin espacios. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Mínimo 8 caracteres, al menos una letra y un número. */
export function isValidPassword(value: string): boolean {
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}

/** Nombre o apellido: entre min y max caracteres después de trim. */
export function isValidName(value: string, min = 2, max = 80): boolean {
  const len = value.trim().length;
  return len >= min && len <= max;
}

/** Teléfono argentino válido para WhatsApp: se puede normalizar al formato wa.me. */
export function isValidPhone(value: string): boolean {
  return whatsappNumber(value) !== null;
}

/** Capacidad de una clase: entero entre 1 y max. */
export function isValidCapacity(value: number, max = 30): boolean {
  return Number.isInteger(value) && value >= 1 && value <= max;
}
