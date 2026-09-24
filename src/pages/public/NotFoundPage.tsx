import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { ButtonLink } from '../../components/ui';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <>
      <title>{`Página no encontrada · ${studio.name}`}</title>
      <Container size="narrow" className={styles.root}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>No encontramos esta página</h1>
        <p className={styles.text}>Puede que el link esté mal escrito o que la página ya no exista.</p>
        <ButtonLink to="/">Volver al inicio</ButtonLink>
      </Container>
    </>
  );
}
