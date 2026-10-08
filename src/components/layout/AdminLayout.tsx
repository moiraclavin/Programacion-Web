import { NavLink, Outlet } from 'react-router';
import { studio } from '../../content/studio';
import { useAuth } from '../../features/auth/AuthProvider';
import { Container } from './Container';
import styles from './AdminLayout.module.css';

const links = [
  { to: '/admin', label: 'Agenda', end: true },
  { to: '/admin/horarios', label: 'Horarios', end: false },
  { to: '/admin/alumnas', label: 'Alumnas', end: false },
];

export function AdminLayout() {
  const { profile } = useAuth();

  return (
    <>
      <title>{`Panel · ${studio.name}`}</title>
      <Container className={styles.root}>
        <p className={styles.eyebrow}>{profile?.role === 'admin' ? 'Administración' : 'Profesoras'}</p>
        <nav aria-label="Panel" className={styles.nav}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={styles.link}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </Container>
    </>
  );
}
