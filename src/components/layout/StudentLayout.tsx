import { NavLink, Outlet } from 'react-router';
import { Container } from './Container';
import styles from './StudentLayout.module.css';

const links = [
  { to: '/app/reservar', label: 'Reservar' },
  { to: '/app/mis-clases', label: 'Mis clases' },
  { to: '/app/pagos', label: 'Pagos' },
  { to: '/app/cuenta', label: 'Cuenta' },
];

/** Área de alumnas. En el celular el menú es una barra fija abajo; desde 960px, una fila arriba. */
export function StudentLayout() {
  return (
    <Container className={styles.root}>
      <nav aria-label="Mi cuenta" className={styles.nav}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={styles.link}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </Container>
  );
}
