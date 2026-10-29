import { Button } from '../../components/ui';
import { cx } from '../../lib/cx';
import { formatMonthName, periodsOfYear, type Ymd } from '../../lib/dates';
import { canPay, monthState, type MonthState } from '../../lib/months';
import styles from './YearCalendar.module.css';

export interface YearCalendarProps {
  year: number;
  /** Primer día del mes actual. */
  current: Ymd;
  /** Períodos ("2026-11-01") con la mensualidad pagada. */
  paid: Set<Ymd>;
  minYear: number;
  maxYear: number;
  onYearChange: (year: number) => void;
  /** Se tocó un mes que se puede pagar. */
  onPick: (period: Ymd) => void;
}

const LABEL: Record<MonthState, string> = {
  paid: 'Pagado',
  due: 'Sin pagar',
  upcoming: 'Pagar',
  missed: 'Sin pagar',
};

const STATE_CLASS: Record<MonthState, string> = {
  paid: styles.paid,
  due: styles.due,
  upcoming: styles.upcoming,
  missed: styles.missed,
};

/** Los 12 meses del año en colores según estén pagados o no; los que se pueden pagar son botones. */
export function YearCalendar({ year, current, paid, minYear, maxYear, onYearChange, onPick }: YearCalendarProps) {
  return (
    <section aria-label={`Mensualidades de ${year}`}>
      <div className={styles.yearNav}>
        <Button variant="secondary" size="sm" onClick={() => onYearChange(year - 1)} disabled={year <= minYear} aria-label="Año anterior">
          ←
        </Button>
        <span className={styles.year}>{year}</span>
        <Button variant="secondary" size="sm" onClick={() => onYearChange(year + 1)} disabled={year >= maxYear} aria-label="Año siguiente">
          →
        </Button>
      </div>

      <ul className={styles.grid}>
        {periodsOfYear(year).map((period) => {
          const state = monthState(period, current, paid.has(period));
          const payable = canPay(state, period, current);
          const name = formatMonthName(period);
          const content = (
            <>
              <span className={styles.name}>{name}</span>
              <span className={styles.state}>{LABEL[state]}</span>
            </>
          );
          const className = cx(styles.month, STATE_CLASS[state], period === current && styles.now);

          return (
            <li key={period}>
              {payable ? (
                <button
                  type="button"
                  className={cx(className, styles.button)}
                  onClick={() => onPick(period)}
                  aria-label={`${name} ${year}: ${state === 'due' ? 'sin pagar, tocá para pagar' : 'tocá para pagar por adelantado'}`}
                  aria-current={period === current ? 'date' : undefined}
                >
                  {content}
                </button>
              ) : (
                <div className={className} aria-current={period === current ? 'date' : undefined}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ul className={styles.legend} aria-label="Referencias">
        <li>
          <span className={cx(styles.swatch, styles.paid)} /> Pagado
        </li>
        <li>
          <span className={cx(styles.swatch, styles.due)} /> Mes actual sin pagar
        </li>
        <li>
          <span className={cx(styles.swatch, styles.upcoming)} /> Para pagar por adelantado
        </li>
        <li>
          <span className={cx(styles.swatch, styles.missed)} /> Mes pasado sin pagar
        </li>
      </ul>
    </section>
  );
}
