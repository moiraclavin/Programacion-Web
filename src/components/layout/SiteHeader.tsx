import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { studio, publicNav } from '../../content/studio';
import { ButtonLink } from '../ui';
import { Container } from './Container';
import styles from './SiteHeader.module.css';

const MOBILE_MENU_ID = 'menu-mobile';
const DESKTOP_QUERY = '(min-width: 960px)';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuOpen(false);

  // Con el menú abierto: Esc lo cierra, la página de fondo no scrollea,
  // y si la ventana pasa a tamaño desktop se cierra solo.
  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const handleResize = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    desktop.addEventListener('change', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      desktop.removeEventListener('change', handleResize);
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <Container className={styles.bar}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          {studio.name}
        </Link>

        <nav aria-label="Principal" className={styles.desktopNav}>
          <ul className={styles.navList}>
            {publicNav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={styles.navLink}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <ButtonLink to="/ingresar" variant="secondary" size="sm" className={styles.loginDesktop}>
            Ingresar
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="visually-hidden">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      <div id={MOBILE_MENU_ID} className={styles.mobileMenu} hidden={!menuOpen}>
        <nav aria-label="Menú">
          <ul className={styles.mobileList}>
            {publicNav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={styles.mobileLink} onClick={closeMenu}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.mobileFooter}>
          <ButtonLink to="/ingresar" size="lg" fullWidth onClick={closeMenu}>
            Ingresar
          </ButtonLink>
          <p className={styles.mobileContact}>{studio.contact.address}</p>
        </div>
      </div>
    </header>
  );
}
