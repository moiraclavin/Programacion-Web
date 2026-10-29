import { useState } from 'react';
import { Link } from 'react-router';
import { Badge, Button, EmptyState, Input, Spinner } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { AccessLinkModal, type AccessInfo } from '../../features/students/AccessLinkModal';
import { AddStudentModal } from '../../features/students/AddStudentModal';
import { cx } from '../../lib/cx';
import { currentPeriod, formatMonth, shiftMonth, startOfDay } from '../../lib/dates';
import { formatMoney, fullName, membershipStatusLabel, membershipStatusTone } from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

type Filter = 'all' | 'paid' | 'unpaid';

export function AdminStudentsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [month, setMonth] = useState(currentPeriod());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [access, setAccess] = useState<AccessInfo | null>(null);

  const students = useQuery(
    () =>
      unwrap(
        supabase
          .from('profiles')
          .select('id, first_name, last_name, phone, email')
          .eq('role', 'student')
          .order('last_name')
          .order('first_name'),
      ),
    [],
  );
  const memberships = useQuery(
    () => unwrap(supabase.from('memberships').select('student_id, status, amount').eq('period', month)),
    [month],
  );
  const bookings = useQuery(
    () =>
      unwrap(
        supabase
          .from('bookings')
          .select('status, class_sessions!inner(starts_at)')
          .gte('class_sessions.starts_at', startOfDay(month).toISOString())
          .lt('class_sessions.starts_at', startOfDay(shiftMonth(month, 1)).toISOString()),
      ),
    [month],
  );

  const all = students.data ?? [];
  const membershipOf = new Map(memberships.data?.map((m) => [m.student_id, m]));
  const isPaid = (id: string) => membershipOf.get(id)?.status === 'active';

  // ── Métricas del mes elegido ─────────────────────────────
  const total = all.length;
  const paid = all.filter((s) => isPaid(s.id)).length;
  const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
  const collected = all.reduce((sum, s) => sum + (isPaid(s.id) ? Number(membershipOf.get(s.id)?.amount ?? 0) : 0), 0);
  const attended = bookings.data?.filter((b) => b.status === 'attended').length ?? 0;
  const noShow = bookings.data?.filter((b) => b.status === 'no_show').length ?? 0;
  const attendancePercent = attended + noShow > 0 ? Math.round((attended / (attended + noShow)) * 100) : null;

  // ── Lista ────────────────────────────────────────────────
  const term = search.trim().toLowerCase();
  const visible = all.filter((s) => {
    if (filter === 'paid' && !isPaid(s.id)) return false;
    if (filter === 'unpaid' && isPaid(s.id)) return false;
    return `${fullName(s)} ${s.email ?? ''}`.toLowerCase().includes(term);
  });

  const loadingMetrics = memberships.loading && !memberships.data;

  return (
    <>
      <div className={styles.titleRow}>
        <div>
          <h1 className={styles.title}>Alumnas</h1>
          <p className={styles.subtitle}>Quién tiene el mes al día y el historial de cada una.</p>
        </div>
        {isAdmin && <Button onClick={() => setAdding(true)}>Agregar alumna</Button>}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.weekNav}>
          <Button variant="secondary" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">
            ←
          </Button>
          <span className={styles.weekLabel}>{formatMonth(month)}</span>
          <Button variant="secondary" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente">
            →
          </Button>
          {month !== currentPeriod() && (
            <Button variant="ghost" size="sm" onClick={() => setMonth(currentPeriod())}>
              Este mes
            </Button>
          )}
        </div>
      </div>

      {(students.error || memberships.error) && (
        <p className={cx(styles.alert, styles.alertError)} role="alert">
          No pudimos cargar las alumnas: {students.error ?? memberships.error}
        </p>
      )}

      {students.loading && !students.data ? (
        <Spinner />
      ) : total === 0 ? (
        <EmptyState
          title="Todavía no hay alumnas"
          description={isAdmin ? 'Agregá la primera con el botón de arriba.' : 'Cuando el estudio las dé de alta, van a aparecer acá.'}
        />
      ) : (
        <>
          <section className={styles.metrics} aria-label={`Métricas de ${formatMonth(month)}`}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Alumnas</span>
              <span className={styles.metricValue}>{total}</span>
              <span className={styles.metricNote}>{total - paid} sin pagar en {formatMonth(month)}</span>
            </div>

            <div className={styles.metric}>
              <span className={styles.metricLabel}>Pagaron {formatMonth(month)}</span>
              <span className={styles.metricValue}>
                {loadingMetrics ? '…' : `${paid} de ${total}`}
              </span>
              <div
                className={styles.progress}
                role="progressbar"
                aria-label="Alumnas que pagaron el mes"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={paidPercent}
              >
                <div className={styles.progressBar} style={{ width: `${paidPercent}%` }} />
              </div>
              <span className={styles.metricNote}>{paidPercent}% de las alumnas</span>
            </div>

            <div className={styles.metric}>
              <span className={styles.metricLabel}>Cobrado</span>
              <span className={styles.metricValue}>{loadingMetrics ? '…' : formatMoney(collected)}</span>
              <span className={styles.metricNote}>en mensualidades de {formatMonth(month)}</span>
            </div>

            <div className={styles.metric}>
              <span className={styles.metricLabel}>Asistencia</span>
              <span className={styles.metricValue}>{attendancePercent === null ? '—' : `${attendancePercent}%`}</span>
              <span className={styles.metricNote}>
                {attended} presentes · {noShow} ausentes
              </span>
            </div>
          </section>

          <div className={styles.filters} role="group" aria-label="Filtrar alumnas">
            {(
              [
                ['all', `Todas (${total})`],
                ['paid', `Pagaron (${paid})`],
                ['unpaid', `Sin pagar (${total - paid})`],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? 'primary' : 'secondary'}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>

          <Input
            className={styles.search}
            label="Buscar por nombre o email"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {visible.length === 0 ? (
            <p className={styles.dayEmpty}>No hay alumnas que coincidan.</p>
          ) : (
            <ul className={styles.list}>
              {visible.map((student) => {
                const status = membershipOf.get(student.id)?.status;
                return (
                  <li key={student.id}>
                    <Link to={`/admin/alumnas/${student.id}`} className={styles.row}>
                      <span className={styles.rowMain}>
                        <span className={styles.rowTitle}>{fullName(student)}</span>
                        <span className={styles.rowMeta}>{student.email ?? student.phone ?? 'Sin datos de contacto'}</span>
                      </span>
                      {status ? (
                        <Badge tone={membershipStatusTone[status]}>{membershipStatusLabel[status]}</Badge>
                      ) : (
                        <Badge tone="outline">Sin pagar</Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <AddStudentModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(created) => {
          setAccess(created);
          students.reload();
        }}
      />
      <AccessLinkModal access={access} onClose={() => setAccess(null)} />
    </>
  );
}
