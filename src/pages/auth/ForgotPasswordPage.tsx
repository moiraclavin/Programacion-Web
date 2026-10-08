import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/site';
import { Button, Input } from '../../components/ui';
import { authErrorMessage } from '../../features/auth/errors';
import { supabase } from '../../lib/supabase';
import styles from './AuthPage.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    // El link del mail lo arma la plantilla "recovery" de Supabase y apunta a /crear-contrasena.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    setSubmitting(false);
    if (resetError) {
      setError(authErrorMessage(resetError));
      return;
    }
    setSent(true);
  };

  return (
    <>
      <title>{`Olvidé mi contraseña · ${studio.name}`}</title>
      <PageHeader
        eyebrow="Alumnas"
        title="Olvidé mi contraseña"
        lead="Escribí tu email y te mandamos un link para elegir una contraseña nueva."
      />
      <Container size="narrow" className={styles.root}>
        {sent ? (
          <p className={styles.notice} role="status">
            Si <strong>{email}</strong> tiene una cuenta en el estudio, en unos minutos te llega un mail con el botón
            para cambiar tu contraseña. Revisá también la carpeta de spam.
          </p>
        ) : (
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
            <Button type="submit" size="lg" fullWidth loading={submitting} disabled={!email}>
              Enviarme el link
            </Button>
          </form>
        )}
        <div className={styles.links}>
          <Link to="/ingresar">Volver a ingresar</Link>
        </div>
      </Container>
    </>
  );
}
