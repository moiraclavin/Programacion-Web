import { about } from '../../content/about';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { ArrowLink, ContactCta, FeatureList, MediaSplit, PageHeader, SectionHeading } from '../../components/site';
import styles from './AboutPage.module.css';

export function AboutPage() {
  return (
    <>
      <title>{`Nosotros · ${studio.name}`}</title>
      <PageHeader {...about.header} />

      <section className={styles.section}>
        <Container>
          <MediaSplit image={about.story.image} reverse>
            <h2 className={styles.storyTitle}>{about.story.title}</h2>
            {about.story.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            <ArrowLink to="/profesoras">Conocé al equipo</ArrowLink>
          </MediaSplit>
        </Container>
      </section>

      <section className={styles.sectionMuted}>
        <Container>
          <SectionHeading eyebrow={about.values.eyebrow} title={about.values.title} />
          <FeatureList items={about.values.items} />
        </Container>
      </section>

      <ContactCta />
    </>
  );
}
