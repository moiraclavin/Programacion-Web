import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { EmailOtpType } from '@supabase/supabase-js';
import { studio } from '../../content/studio';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/site';
import { Button, Input, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { authErrorMessage } from '../../features/auth/errors';
import { supabase } from '../../lib/supabase';
import styles from './AuthPage.module.css';

const MIN_LENGTH = 8;

/**
 * Destino del botón de los mails de invitación y de "olvidé mi contraseña".
 * El link trae ?token_hash=...&type=invite|recovery; con eso se valida el link,
 * queda iniciada la sesión y la alumna elige su contraseña.
 */
export function SetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  const isInvite = type === 'invite';

  const [verifying, setVerifying] = useState(Boolean(tokenHash));
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // El token sirve una sola vez; el ref evita usarlo dos veces en modo desarrollo (StrictMode).
  const verified = useRef(false);

  useEffect(() => {
    if (!tokenHash || !type || verified.current) return;
    verified.current = true;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error: verifyError }) => {
      if (verifyError) setLinkError(authErrorMessage(verifyError));
      setVerifying(false);
    });
  }, [tokenHash, type]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`La contraseña tiene que tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(authErrorMessage(updateError));
      return;
    }
    navigate('/app', { replace: true });
  };

  const title = isInvite ? 'Creá tu contraseña' : 'Cambiá tu contraseña';

  let content;
  if (verifying || loading) {
    content = (
      <div className={styles.center}>
        <Spinner label="Validando el link" />
      </div>
    );
  } else if (linkError || !session) {
    content = (
      <>
        <p className={styles.alert} role="alert">
          {linkError ?? 'Este link no es válido. Abrí de nuevo el botón del mail que te mandamos.'}
        </p>
        <div className={styles.links}>
          <Link to="/recuperar">Pedir un link nuevo</Link>
        </div>
      </>
    );
  } else {
    content = (
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        )}
        <p>
          Tu usuario es <strong>{session.user.email}</strong>.
        </p>
        <Input
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          hint={`Al menos ${MIN_LENGTH} caracteres.`}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Input
          label="Repetí la contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
        <Button type="submit" size="lg" fullWidth loading={submitting} disabled={!password || !confirm}>
          Guardar contraseña
        </Button>
      </form>
    );
  }

  return (
    <>
      <title>{`${title} · ${studio.name}`}</title>
      <PageHeader eyebrow="Alumnas" title={title} />
      <Container size="narrow" className={styles.root}>
        {content}
      </Container>
    </>
  );
}
