import type { ReactNode } from 'react';
import type { ImageAsset } from '../../content/types';
import { cx } from '../../lib/cx';
import { Photo } from '../ui';
import styles from './MediaSplit.module.css';

export interface MediaSplitProps {
  image: ImageAsset;
  ratio?: string;
  /** En desktop, pone la foto a la izquierda. */
  reverse?: boolean;
  children: ReactNode;
  className?: string;
}

/** Texto + foto: apilados en mobile, dos columnas desde 960px. */
export function MediaSplit({ image, ratio = '4 / 5', reverse = false, children, className }: MediaSplitProps) {
  return (
    <div className={cx(styles.split, reverse && styles.reverse, className)}>
      <div className={styles.text}>{children}</div>
      <Photo src={image.src} alt={image.alt} ratio={ratio} className={styles.media} />
    </div>
  );
}
