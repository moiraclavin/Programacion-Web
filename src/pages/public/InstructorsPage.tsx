import { instructors } from '../../content/instructors';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { ContactCta, InstructorCard, PageHeader } from '../../components/site';
import styles from './InstructorsPage.module.css';

export function InstructorsPage() {
  return (
    <>
      <title>{`Profesoras · ${studio.name}`}</title>
      <PageHeader
        eyebrow="El equipo"
        title="Nuestras profesoras"
        lead="Formadas, curiosas y atentas a cada detalle. Cada una tiene su estilo, y todas comparten la misma forma de enseñar."
      />

      <Container className={styles.section}>
        <ul className={styles.grid}>
          {instructors.map((instructor) => (
            <li key={instructor.id}>
              <InstructorCard instructor={instructor} detailed headingLevel="h2" />
            </li>
          ))}
        </ul>
      </Container>

      <ContactCta />
    </>
  );
}
