import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/site';
import { EmptyState } from '../../components/ui';

// Placeholder: el login real se implementa en el paso 3.
export function LoginPage() {
  return (
    <>
      <title>{`Ingresar · ${studio.name}`}</title>
      <PageHeader eyebrow="Alumnas" title="Ingresar" />
      <Container size="narrow" style={{ paddingBottom: 'var(--section-space)' }}>
        <EmptyState
          title="Muy pronto"
          description="Desde acá vas a poder reservar tus clases, ver tus pagos y tu asistencia."
        />
      </Container>
    </>
  );
}
