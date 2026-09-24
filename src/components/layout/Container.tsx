import type { ComponentPropsWithoutRef } from 'react';
import { cx } from '../../lib/cx';
import styles from './Container.module.css';

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  size?: 'default' | 'narrow';
}

/** Centra el contenido con ancho máximo y márgenes laterales (gutter) responsivos. */
export function Container({ size = 'default', className, ...rest }: ContainerProps) {
  return <div className={cx(styles.container, size === 'narrow' && styles.narrow, className)} {...rest} />;
}
