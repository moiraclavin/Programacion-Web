import { Container } from '../layout/Container';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  lead?: string;
}

/** Encabezado de las páginas internas (h1 + bajada). */
export function PageHeader({ title, eyebrow, lead }: PageHeaderProps) {
  return (
    <Container className={styles.root}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className={styles.lead}>{lead}</p>}
    </Container>
  );
}
