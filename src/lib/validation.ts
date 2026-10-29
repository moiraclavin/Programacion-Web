/** Revisión básica de formato de email: algo@algo.algo, sin espacios. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
