import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/site';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { authErrorMessage } from '../../features/auth/errors';
import { supabase } from '../../lib/supabase';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(authErrorMessage(signInError));
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <>
      <title>{`Ingresar · ${studio.name}`}</title>
      <PageHeader eyebrow="Alumnas" title="Ingresar" lead="Reservá tus clases y mirá tus pagos y tu asistencia." />
      <Container size="narrow" className={styles.root}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p className={styles.alert} role="alert">
              {error}
            </p>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" size="lg" fullWidth loading={submitting} disabled={!email || !password}>
            Ingresar
          </Button>
        </form>
        <div className={styles.links}>
          <Link to="/recuperar">Olvidé mi contraseña</Link>
          <span>¿Todavía no tenés cuenta? Te la crea el estudio cuando te anotás.</span>
        </div>
      </Container>
    </>
  );
}
