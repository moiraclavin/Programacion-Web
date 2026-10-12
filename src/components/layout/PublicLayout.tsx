import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import styles from './PublicLayout.module.css';

export function PublicLayout() {
  // En el área de alumnas el pie de página taparía la barra de navegación fija.
  const inStudentArea = useLocation().pathname.startsWith('/app');

  return (
    <div className={styles.shell}>
      <a href="#contenido" className={styles.skipLink}>
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      {!inStudentArea && <SiteFooter />}
      <ScrollRestoration />
    </div>
  );
}
