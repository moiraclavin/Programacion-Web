import type { Feature } from '../../content/types';
import styles from './FeatureList.module.css';

export interface FeatureListProps {
  items: Feature[];
}

/** Lista numerada (01, 02, 03) de pilares o valores, en columnas desde 960px. */
export function FeatureList({ items }: FeatureListProps) {
  return (
    <ol className={styles.list}>
      {items.map((item, index) => (
        <li key={item.title} className={styles.item}>
          <span className={styles.number} aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={styles.title}>{item.title}</h3>
          <p className={styles.text}>{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
