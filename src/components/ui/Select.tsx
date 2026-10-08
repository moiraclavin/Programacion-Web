import { useId, type ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import styles from './Select.module.css';

export interface SelectProps extends ComponentPropsWithRef<'select'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Lista desplegable nativa (en el celular abre el selector del sistema). Las opciones van como <option>. */
export function Select({ label, hint, error, id, className, children, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select
        id={selectId}
        className={cx(styles.select, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {children}
      </select>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
