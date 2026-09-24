import { Link } from 'react-router';
import { publicNav, studio } from '../../content/studio';
import { emailUrl, instagramUrl, mapsUrl, whatsappUrl } from '../../lib/links';
import { Container } from './Container';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.grid}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            {studio.name}
          </Link>
          <p className={styles.tagline}>{studio.tagline}</p>
        </div>

        <div>
          <h2 className={styles.heading}>Visitanos</h2>
          <address className={styles.address}>
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              {studio.contact.address}
            </a>
          </address>
          <ul className={styles.list}>
            {studio.hours.map((row) => (
              <li key={row.days}>
                {row.days}: {row.time}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={styles.heading}>Contacto</h2>
          <ul className={styles.list}>
            <li>
              <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={emailUrl}>{studio.contact.email}</a>
            </li>
            <li>
              <a href={instagramUrl} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Pie de página">
          <h2 className={styles.heading}>Estudio</h2>
          <ul className={styles.list}>
            {publicNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/ingresar">Ingresar</Link>
            </li>
          </ul>
        </nav>
      </Container>

      <Container>
        <p className={styles.legal}>
          © {new Date().getFullYear()} {studio.name}
        </p>
      </Container>
    </footer>
  );
}
