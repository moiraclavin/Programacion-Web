import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './SectionHeading.module.css';

export interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  lead?: ReactNode;
  /** Link opcional alineado a la derecha, ej. "Ver todas". */
  action?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeading({ title, eyebrow, lead, action, id, className }: SectionHeadingProps) {
  return (
    <div className={cx(styles.root, className)}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
      {action}
    </div>
  );
}
