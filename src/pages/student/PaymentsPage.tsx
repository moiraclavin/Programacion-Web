import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge, Button, Modal, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { createCheckout } from '../../features/payments/checkout';
import { YearCalendar } from '../../features/payments/YearCalendar';
import { useStudioSettings } from '../../features/studio/useStudioSettings';
import { cx } from '../../lib/cx';
import { currentPeriod, formatDateTime, formatMonth, type Ymd } from '../../lib/dates';
import { formatMoney, paymentStatusLabel, paymentStatusTone } from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './student.module.css';

export function PaymentsPage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const current = currentPeriod();
  const currentYear = Number(current.slice(0, 4));
  const settings = useStudioSettings();

  const memberships = useQuery(
    () => unwrap(supabase.from('memberships').select('period, status').eq('student_id', userId)),
    [userId],
  );
  const payments = useQuery(
    () =>
      unwrap(
        supabase
          .from('payments')
          .select('id, amount, status, paid_at, created_at, memberships(period)')
          .eq('student_id', userId)
          .order('created_at', { ascending: false }),
      ),
    [userId],
  );

  const [year, setYear] = useState(currentYear);
  const [picked, setPicked] = useState<Ymd | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const paid = new Set<Ymd>(memberships.data?.filter((m) => m.status === 'active').map((m) => m.period));
  const fee = settings.data?.monthly_fee;

  // Mercado Pago vuelve acá con ?resultado=ok|error|pendiente&mes=YYYY-MM (el mes que se estaba pagando).
  const [searchParams] = useSearchParams();
  const result = searchParams.get('resultado');
  const monthParam = searchParams.get('mes');
  const resultMonth: Ymd = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? `${monthParam}-01` : current;
  const resultPaid = paid.has(resultMonth);

  // El aviso de Mercado Pago (webhook) puede tardar unos segundos: si la alumna vuelve de pagar
  // y todavía no figura pagado, se vuelve a consultar cada 3 segundos, hasta 10 veces.
  const { reload: reloadMemberships } = memberships;
  const { reload: reloadPayments } = payments;
  useEffect(() => {
    if (result !== 'ok' && result !== 'pendiente') return;
    if (resultPaid) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      reloadMemberships();
      reloadPayments();
      if (attempts >= 10) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [result, resultPaid, reloadMemberships, reloadPayments]);

  function closePicker() {
    if (paying) return;
    setPicked(null);
    setPayError(null);
  }

  async function pay() {
    if (!session || !picked) return;
    setPaying(true);
    setPayError(null);
    try {
      window.location.assign(await createCheckout(session.access_token, picked));
    } catch (caught) {
      setPayError(caught instanceof Error ? caught.message : 'No pudimos iniciar el pago.');
      setPaying(false);
    }
  }

  return (
    <>
      <h1 className={styles.title}>Pagos</h1>
      <p className={styles.subtitle}>
        Tocá un mes para pagarlo{fee !== undefined ? ` (${formatMoney(fee)} por mes)` : ''}. Podés pagar por adelantado.
      </p>

      {result === 'ok' && (
        <p className={cx(styles.alert, resultPaid ? styles.alertOk : styles.alertInfo)} role="status" style={{ marginTop: 'var(--space-6)' }}>
          {resultPaid
            ? `¡Listo! Tu pago de ${formatMonth(resultMonth)} está acreditado.`
            : 'Recibimos tu pago. Estamos confirmándolo, puede tardar unos minutos.'}
        </p>
      )}
      {result === 'pendiente' && !resultPaid && (
        <p className={cx(styles.alert, styles.alertInfo)} role="status" style={{ marginTop: 'var(--space-6)' }}>
          Tu pago está pendiente. Cuando Mercado Pago lo confirme, se acredita solo.
        </p>
      )}
      {result === 'error' && !resultPaid && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          El pago no se pudo completar. Podés intentarlo de nuevo.
        </p>
      )}
      {(memberships.error || payments.error) && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          No pudimos cargar tus pagos. Probá de nuevo en unos minutos.
        </p>
      )}

      <section className={styles.section} aria-label="Calendario de mensualidades">
        {memberships.loading && memberships.data === undefined ? (
          <Spinner />
        ) : (
          <YearCalendar
            year={year}
            current={current}
            paid={paid}
            minYear={currentYear - 1}
            maxYear={currentYear + 1}
            onYearChange={setYear}
            onPick={setPicked}
          />
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
                  <span className={styles.rowTitle}>
                    {payment.memberships ? `Mensualidad de ${formatMonth(payment.memberships.period)}` : 'Mensualidad'}
                  </span>
                  <span className={styles.rowMeta}>
                    {formatMoney(payment.amount)} · {formatDateTime(payment.paid_at ?? payment.created_at)}
                  </span>
                </span>
                <Badge tone={paymentStatusTone[payment.status]}>{paymentStatusLabel[payment.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={picked !== null}
        onClose={closePicker}
        title={picked ? `Pagar ${formatMonth(picked)}` : 'Pagar'}
        description={fee !== undefined ? `Mensualidad: ${formatMoney(fee)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={closePicker} disabled={paying}>
              Volver
            </Button>
            <Button onClick={pay} loading={paying}>
              {fee !== undefined ? `Pagar ${formatMoney(fee)}` : 'Pagar'}
            </Button>
          </>
        }
      >
        <p>
          Vas a pagar en Mercado Pago y volver acá automáticamente. Con el mes pagado podés reservar tus clases de ese mes.
        </p>
        {payError && (
          <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-4)' }}>
            {payError}
          </p>
        )}
      </Modal>
    </>
  );
}
