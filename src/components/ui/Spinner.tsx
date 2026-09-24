import { cx } from '../../lib/cx';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Texto para lectores de pantalla. */
  label?: string;
  /** true cuando otro elemento ya anuncia la carga (ej. un botón con aria-busy). */
  decorative?: boolean;
  className?: string;
}

export function Spinner({ size = 'md', label = 'Cargando…', decorative = false, className }: SpinnerProps) {
  return (
    <span
      className={cx(styles.root, className)}
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative || undefined}
    >
      <span className={cx(styles.ring, styles[size])} />
      {!decorative && <span className="visually-hidden">{label}</span>}
    </span>
  );
}
