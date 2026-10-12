import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge, Button, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { createCheckout } from '../../features/payments/checkout';
import { useStudioSettings } from '../../features/studio/useStudioSettings';
import { cx } from '../../lib/cx';
import { currentPeriod, formatDateTime, formatMonth } from '../../lib/dates';
import {
  formatMoney,
  membershipStatusLabel,
  membershipStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './student.module.css';

export function PaymentsPage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const period = currentPeriod();
  const settings = useStudioSettings();

  const membership = useQuery(
    () =>
      unwrap(
        supabase.from('memberships').select('status, amount').eq('student_id', userId).eq('period', period).maybeSingle(),
      ),
    [userId, period],
  );
  const payments = useQuery(
    () =>
      unwrap(
        supabase
          .from('payments')
          .select('id, amount, status, paid_at, created_at')
          .eq('student_id', userId)
          .order('created_at', { ascending: false }),
      ),
    [userId],
  );

  const current = membership.data;
  const fee = current?.amount ?? settings.data?.monthly_fee;
  const isPaid = current?.status === 'active';

  // Mercado Pago vuelve acá con ?resultado=ok|error|pendiente.
  const [searchParams] = useSearchParams();
  const result = searchParams.get('resultado');

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // El aviso de Mercado Pago (webhook) puede tardar unos segundos: si la alumna vuelve de pagar
  // y todavía no figura pagado, se vuelve a consultar cada 3 segundos, hasta 10 veces.
  const { reload: reloadMembership } = membership;
  const { reload: reloadPayments } = payments;
  useEffect(() => {
    if (result !== 'ok' && result !== 'pendiente') return;
    if (isPaid) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      reloadMembership();
      reloadPayments();
      if (attempts >= 10) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [result, isPaid, reloadMembership, reloadPayments]);

  async function pay() {
    if (!session) return;
    setPaying(true);
    setPayError(null);
    try {
      window.location.assign(await createCheckout(session.access_token));
    } catch (caught) {
      setPayError(caught instanceof Error ? caught.message : 'No pudimos iniciar el pago.');
      setPaying(false);
    }
  }

  return (
    <>
      <h1 className={styles.title}>Pagos</h1>
      <p className={styles.subtitle}>Tu mensualidad y el historial de pagos.</p>

      {result === 'ok' && (
        <p className={cx(styles.alert, isPaid ? styles.alertOk : styles.alertInfo)} role="status" style={{ marginTop: 'var(--space-6)' }}>
          {isPaid ? '¡Listo! Tu pago está acreditado.' : 'Recibimos tu pago. Estamos confirmándolo, puede tardar unos minutos.'}
        </p>
      )}
      {result === 'pendiente' && !isPaid && (
        <p className={cx(styles.alert, styles.alertInfo)} role="status" style={{ marginTop: 'var(--space-6)' }}>
          Tu pago está pendiente. Cuando Mercado Pago lo confirme, se acredita solo.
        </p>
      )}
      {result === 'error' && !isPaid && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          El pago no se pudo completar. Podés intentarlo de nuevo.
        </p>
      )}

      {(membership.error || payments.error) && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          No pudimos cargar tus pagos. Probá de nuevo en unos minutos.
        </p>
      )}

      <section className={styles.section} aria-label="Mensualidad">
        <h2 className={styles.sectionTitle}>{formatMonth(period)}</h2>
        {membership.loading && membership.data === undefined ? (
          <Spinner />
        ) : membership.error ? null : (
          <div className={styles.summary}>
            <span>
              {current ? (
                <Badge tone={membershipStatusTone[current.status]}>{membershipStatusLabel[current.status]}</Badge>
              ) : (
                <Badge tone="outline">Sin pagar</Badge>
              )}
            </span>
            {fee !== undefined && <span className={styles.amount}>{formatMoney(fee)}</span>}
            {!isPaid && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Button size="lg" fullWidth onClick={pay} loading={paying}>
                  Pagar {formatMonth(period)}
                </Button>
                <span className={styles.rowMeta} style={{ display: 'block', marginTop: 'var(--space-3)' }}>
                  Vas a pagar en Mercado Pago y volver acá automáticamente.
                </span>
                {payError && (
                  <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-4)' }}>
                    {payError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className={styles.section} aria-label="Historial de pagos">
        <h2 className={styles.sectionTitle}>Historial</h2>
        {payments.loading && !payments.data ? (
          <Spinner />
        ) : payments.data?.length === 0 ? (
          <p className={styles.empty}>Todavía no hay pagos registrados.</p>
        ) : (
          <ul className={styles.list}>
            {payments.data?.map((payment) => (
              <li key={payment.id} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{formatMoney(payment.amount)}</span>
                  <span className={styles.rowMeta}>{formatDateTime(payment.paid_at ?? payment.created_at)}</span>
                </span>
                <Badge tone={paymentStatusTone[payment.status]}>{paymentStatusLabel[payment.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
