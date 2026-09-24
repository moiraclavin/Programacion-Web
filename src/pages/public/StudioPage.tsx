import { facilities } from '../../content/facilities';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { ContactCta, MediaSplit, PageHeader, SectionHeading } from '../../components/site';
import styles from './StudioPage.module.css';

export function StudioPage() {
  return (
    <>
      <title>{`Instalaciones · ${studio.name}`}</title>
      <PageHeader {...facilities.header} />

      <Container className={styles.spaces}>
        {facilities.spaces.map((space, index) => (
          <section key={space.id} aria-labelledby={`espacio-${space.id}`}>
            {/* Alterna foto izquierda/derecha en desktop */}
            <MediaSplit image={space.photo} ratio="4 / 3" reverse={index % 2 === 1}>
              <h2 id={`espacio-${space.id}`} className={styles.spaceTitle}>
                {space.name}
              </h2>
              <p className={styles.spaceText}>{space.description}</p>
            </MediaSplit>
          </section>
        ))}
      </Container>

      <section className={styles.amenities}>
        <Container>
          <SectionHeading eyebrow="Para tu comodidad" title="Qué vas a encontrar" />
          <ul className={styles.amenityList}>
            {facilities.amenities.map((amenity) => (
              <li key={amenity} className={styles.amenity}>
                {amenity}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <ContactCta />
    </>
  );
}
