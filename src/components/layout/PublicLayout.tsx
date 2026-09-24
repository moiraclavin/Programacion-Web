import { Outlet, ScrollRestoration } from 'react-router';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import styles from './PublicLayout.module.css';

export function PublicLayout() {
  return (
    <div className={styles.shell}>
      <a href="#contenido" className={styles.skipLink}>
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
