import { useState } from 'react';
import { Link } from 'react-router';
import { Badge, EmptyState, Input, Spinner } from '../../components/ui';
import { cx } from '../../lib/cx';
import { currentPeriod } from '../../lib/dates';
import { fullName, membershipStatusLabel, membershipStatusTone } from '../../lib/labels';
import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';
import styles from './admin.module.css';

export function AdminStudentsPage() {
  const [search, setSearch] = useState('');

  const students = useQuery(
    () =>
      unwrap(
        supabase
          .from('profiles')
          .select('id, first_name, last_name, phone')
          .eq('role', 'student')
          .order('last_name')
          .order('first_name'),
      ),
    [],
  );
  const memberships = useQuery(
    () => unwrap(supabase.from('memberships').select('student_id, status').eq('period', currentPeriod())),
    [],
  );
  const statusOf = new Map(memberships.data?.map((m) => [m.student_id, m.status]));

  const term = search.trim().toLowerCase();
  const visible = students.data?.filter((s) => fullName(s).toLowerCase().includes(term)) ?? [];

  return (
    <>
      <h1 className={styles.title}>Alumnas</h1>
      <p className={styles.subtitle}>Quién tiene el mes al día y el historial de cada una.</p>

      {students.error && (
        <p className={cx(styles.alert, styles.alertError)} role="alert" style={{ marginTop: 'var(--space-6)' }}>
          No pudimos cargar las alumnas: {students.error}
        </p>
      )}

      {students.loading && !students.data ? (
        <Spinner />
      ) : students.data?.length === 0 ? (
        <div style={{ marginTop: 'var(--space-8)' }}>
          <EmptyState title="Todavía no hay alumnas" description="Cuando el estudio las dé de alta, van a aparecer acá." />
        </div>
      ) : (
        <>
          <Input
            className={styles.search}
            label="Buscar por nombre"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {visible.length === 0 ? (
            <p className={styles.dayEmpty}>No hay alumnas con ese nombre.</p>
          ) : (
            <ul className={styles.list}>
              {visible.map((student) => {
                const status = statusOf.get(student.id);
                return (
                  <li key={student.id}>
                    <Link to={`/admin/alumnas/${student.id}`} className={styles.row}>
                      <span className={styles.rowMain}>
                        <span className={styles.rowTitle}>{fullName(student)}</span>
                        {student.phone && <span className={styles.rowMeta}>{student.phone}</span>}
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
    </>
  );
}
