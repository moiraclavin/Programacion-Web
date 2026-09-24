import type { Instructor } from '../../content/instructors';
import { Photo } from '../ui';
import styles from './InstructorCard.module.css';

export interface InstructorCardProps {
  instructor: Instructor;
  /** Muestra bio y formación (página de profesoras). */
  detailed?: boolean;
  headingLevel?: 'h2' | 'h3';
}

export function InstructorCard({ instructor, detailed = false, headingLevel: Heading = 'h3' }: InstructorCardProps) {
  return (
    <article className={styles.card}>
      <Photo src={instructor.photo.src} alt={instructor.photo.alt} ratio="4 / 5" className={styles.photo} />
      <div className={styles.body}>
        <Heading className={styles.name}>{instructor.name}</Heading>
        <p className={styles.specialty}>{instructor.specialty}</p>
        {detailed && (
          <>
            <p className={styles.bio}>{instructor.bio}</p>
            <p className={styles.credentials}>{instructor.credentials}</p>
          </>
        )}
      </div>
    </article>
  );
}
