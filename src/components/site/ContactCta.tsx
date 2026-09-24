import { FIRST_CLASS_MESSAGE, whatsappUrl } from '../../lib/links';
import { Container } from '../layout/Container';
import { buttonClassName } from '../ui';
import { ArrowLink } from './ArrowLink';
import styles from './ContactCta.module.css';

/**
 * Cierre de las páginas públicas. Como el estudio da de alta a las alumnas,
 * la acción principal para quien no es alumna es escribir por WhatsApp.
 */
export function ContactCta() {
  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <Container size="narrow" className={styles.inner}>
        <h2 id="cta-title" className={styles.title}>
          ¿Primera vez en el estudio?
        </h2>
        <p className={styles.text}>
          Escribinos y coordinamos una clase de prueba. Si ya sos alumna, ingresá para reservar tus turnos.
        </p>
        <div className={styles.actions}>
          <a
            href={whatsappUrl(FIRST_CLASS_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ size: 'lg' }, styles.primary)}
          >
            Escribinos por WhatsApp
          </a>
          <ArrowLink to="/ingresar">Ingresar</ArrowLink>
        </div>
      </Container>
    </section>
  );
}
