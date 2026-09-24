import { Link, type LinkProps } from 'react-router';
import { cx } from '../../lib/cx';
import styles from './ArrowLink.module.css';

export interface ArrowLinkProps extends LinkProps {
  /** `inverse` para usar sobre fotos o fondos oscuros. */
  tone?: 'default' | 'inverse';
}

/** Link de texto secundario con flecha: "Nuestra historia →". */
export function ArrowLink({ tone = 'default', className, children, ...rest }: ArrowLinkProps) {
  return (
    <Link className={cx(styles.link, tone === 'inverse' && styles.inverse, className)} {...rest}>
      <span>{children}</span>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
