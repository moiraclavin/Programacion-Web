/** Une clases CSS ignorando valores falsy: cx(styles.a, isOn && styles.b) */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
