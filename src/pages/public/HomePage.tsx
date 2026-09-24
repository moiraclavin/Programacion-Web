import { home } from '../../content/home';
import { instructors } from '../../content/instructors';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { ArrowLink, ContactCta, FeatureList, InstructorCard, MediaSplit, SectionHeading } from '../../components/site';
import { buttonClassName, Photo } from '../../components/ui';
import { FIRST_CLASS_MESSAGE, whatsappUrl } from '../../lib/links';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <>
      <title>{`${studio.name} · ${studio.tagline}`}</title>

      {/* Hero: foto a pantalla completa */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Photo src={home.hero.image.src} alt={home.hero.image.alt} fill priority placeholderTone="dark" />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <Container className={styles.heroContent}>
          <p className={styles.heroEyebrow}>{home.hero.eyebrow}</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            {home.hero.title}
          </h1>
          <p className={styles.heroLead}>{home.hero.lead}</p>
          <div className={styles.heroActions}>
            <a
              href={whatsappUrl(FIRST_CLASS_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className={buttonClassName({ variant: 'inverse', size: 'lg' }, styles.heroButton)}
            >
              Coordiná tu primera clase
            </a>
            <ArrowLink to="/estudio" tone="inverse">
              Conocé el estudio
            </ArrowLink>
          </div>
        </Container>
      </section>

      {/* Presentación */}
      <section className={styles.section}>
        <Container>
          <MediaSplit image={home.intro.image}>
            <SectionHeading eyebrow={home.intro.eyebrow} title={home.intro.title} className={styles.flushHeading} />
            {home.intro.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            <ArrowLink to="/nosotros">Nuestra historia</ArrowLink>
          </MediaSplit>
        </Container>
      </section>

      {/* Pilares */}
      <section className={styles.sectionMuted}>
        <Container>
          <SectionHeading eyebrow={home.pillars.eyebrow} title={home.pillars.title} />
          <FeatureList items={home.pillars.items} />
        </Container>
      </section>

      {/* Profesoras */}
      <section className={styles.section} aria-labelledby="home-profesoras">
        <Container>
          <SectionHeading
            id="home-profesoras"
            eyebrow="El equipo"
            title="Profesoras"
            action={<ArrowLink to="/profesoras">Conocelas</ArrowLink>}
          />
          {/* En mobile es un carrusel horizontal; tabIndex permite scrollearlo con teclado. */}
          <ul className={styles.rail} tabIndex={0} aria-label="Profesoras del estudio">
            {instructors.map((instructor) => (
              <li key={instructor.id} className={styles.railItem}>
                <InstructorCard instructor={instructor} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Banda de foto a sangre */}
      <section className={styles.band} aria-label="La sala">
        <Photo src={home.band.image.src} alt={home.band.image.alt} fill placeholderTone="dark" />
        <div className={styles.bandOverlay} aria-hidden="true" />
        <Container className={styles.bandContent}>
          <p className={styles.bandCaption}>{home.band.caption}</p>
          <ArrowLink to="/estudio" tone="inverse">
            Ver instalaciones
          </ArrowLink>
        </Container>
      </section>

      <ContactCta />
    </>
  );
}
