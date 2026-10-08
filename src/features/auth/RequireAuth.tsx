import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../../components/ui';
import { useAuth } from './AuthProvider';

/** Protege las rutas hijas: sin sesión, manda al login y después vuelve a donde estaba. */
export function RequireAuth() {
  const { session, loading } = useAuth();
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

  return <Outlet />;
}
