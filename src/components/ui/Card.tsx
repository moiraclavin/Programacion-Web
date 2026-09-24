import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'section' | 'li';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Realza el borde al pasar el mouse (para cards que contienen un link o botón). */
  interactive?: boolean;
}

export function Card({
  as: Component = 'div',
  padding = 'md',
  interactive = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cx(styles.card, styles[`padding-${padding}`], interactive && styles.interactive, className)}
      {...rest}
    />
  );
}
