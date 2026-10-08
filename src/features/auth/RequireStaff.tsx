import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../../components/ui';
import { useAuth } from './AuthProvider';

/**
 * Protege el panel: sin sesión manda al login; con sesión pero sin rol de admin o
 * profesora, manda al área de alumnas. La seguridad real la ponen las reglas RLS
 * de la base: esto solo evita mostrar pantallas que no le corresponden.
 */
export function RequireStaff() {
  const { session, isStaff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', paddingBlock: 'var(--space-24)' }}>
        <Spinner label="Cargando" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  }

  if (!isStaff) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
