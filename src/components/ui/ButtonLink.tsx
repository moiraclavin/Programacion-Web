import { Link, type LinkProps } from 'react-router';
import { buttonClassName, type ButtonStyleOptions } from './Button';

export interface ButtonLinkProps extends LinkProps, ButtonStyleOptions {}

/** Link interno de React Router con aspecto de botón. Para links externos usar <a className={buttonClassName()}>. */
export function ButtonLink({ variant, size, fullWidth, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, size, fullWidth }, className)} {...rest} />;
}
