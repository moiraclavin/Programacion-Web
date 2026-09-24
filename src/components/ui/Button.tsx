import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

export interface ButtonStyleOptions {
  /** `inverse` es para usar sobre fotos o fondos oscuros. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/** Clases de botón, para aplicarlas a un <a> o <Link> que debe verse como botón. */
export function buttonClassName(
  { variant = 'primary', size = 'md', fullWidth = false }: ButtonStyleOptions = {},
  className?: string,
): string {
  return cx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className);
}

export interface ButtonProps extends ComponentPropsWithRef<'button'>, ButtonStyleOptions {
  /** Muestra un spinner y deshabilita el botón sin cambiar su ancho. */
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth }, cx(loading && styles.loading, className))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size="sm" decorative className={styles.spinner} />}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
