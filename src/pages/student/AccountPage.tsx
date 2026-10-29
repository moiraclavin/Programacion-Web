import { Link } from 'react-router';
import { Button } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import styles from './student.module.css';

export function AccountPage() {
  const { session, profile, signOut } = useAuth();

  return (
    <>
      <h1 className={styles.title}>{profile?.firstName ? `Hola, ${profile.firstName}` : 'Mi cuenta'}</h1>
      <p className={styles.subtitle}>{session?.user.email}</p>

      <p className={styles.actions}>
        <Link to="/crear-contrasena">Cambiar mi contraseña</Link>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Cerrar sesión
        </Button>
      </p>
    </>
  );
}
