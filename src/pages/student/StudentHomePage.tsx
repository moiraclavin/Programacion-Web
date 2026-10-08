import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/site';
import { Button, EmptyState } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { supabase } from '../../lib/supabase';

// Inicio del área de alumnas. Reservar, mis clases y pagos se suman en los próximos pasos.
export function StudentHomePage() {
  const { session, signOut } = useAuth();
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('first_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setFirstName(data?.first_name ?? null));
  }, [session]);

  return (
    <>
      <title>{`Mi cuenta · ${studio.name}`}</title>
      <PageHeader eyebrow="Mi cuenta" title={firstName ? `Hola, ${firstName}` : 'Hola'} />
      <Container size="narrow" style={{ paddingBottom: 'var(--section-space)' }}>
        <EmptyState
          title="Muy pronto"
          description="Desde acá vas a poder reservar tus clases, ver tus pagos y tu asistencia."
        />
        <p style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
          <Link to="/crear-contrasena">Cambiar mi contraseña</Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Cerrar sesión
          </Button>
        </p>
      </Container>
    </>
  );
}
