import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/site';
import { buttonClassName } from '../../components/ui';
import { emailUrl, FIRST_CLASS_MESSAGE, instagramUrl, mapsEmbedUrl, mapsUrl, whatsappUrl } from '../../lib/links';
import styles from './ContactPage.module.css';

export function ContactPage() {
  const { contact, hours } = studio;

  return (
    <>
      <title>{`Contacto · ${studio.name}`}</title>
      <PageHeader
        eyebrow="Contacto"
        title="Vení a conocernos"
        lead="La forma más rápida de coordinar una clase de prueba o hacer una consulta es por WhatsApp."
      />

      <Container className={styles.layout}>
        <div className={styles.info}>
          <dl className={styles.details}>
            <div className={styles.row}>
              <dt>Dirección</dt>
              <dd>
                {contact.address}
                <br />
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  Cómo llegar
                </a>
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Horarios</dt>
              <dd>
                <ul className={styles.hours}>
                  {hours.map((row) => (
                    <li key={row.days}>
                      <span>{row.days}</span>
                      <span>{row.time}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className={styles.row}>
              <dt>WhatsApp</dt>
              <dd>
                <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                  {contact.whatsappDisplay}
                </a>
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Email</dt>
              <dd>
                <a href={emailUrl}>{contact.email}</a>
              </dd>
            </div>
            <div className={styles.row}>
              <dt>Instagram</dt>
              <dd>
                <a href={instagramUrl} target="_blank" rel="noreferrer">
                  @{contact.instagram}
                </a>
              </dd>
            </div>
          </dl>

          <a
            href={whatsappUrl(FIRST_CLASS_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ size: 'lg' }, styles.cta)}
          >
            Escribinos por WhatsApp
          </a>
        </div>

        <div className={styles.map}>
          <iframe
            src={mapsEmbedUrl}
            title={`Mapa con la ubicación de ${studio.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Container>
    </>
  );
}
