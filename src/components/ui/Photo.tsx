import { useState } from 'react';
import { cx } from '../../lib/cx';
import styles from './Photo.module.css';

export interface PhotoProps {
  src?: string;
  /** Descripción de la foto. Vacío ("") si es decorativa. */
  alt: string;
  /** Relación de aspecto, ej. "4 / 5". Se ignora con `fill`. */
  ratio?: string;
  /** Ocupa todo el contenedor posicionado (fotos de fondo, hero). */
  fill?: boolean;
  /** Carga inmediata para la foto principal de la página. */
  priority?: boolean;
  /** Color del placeholder: `dark` cuando va texto claro encima. */
  placeholderTone?: 'light' | 'dark';
  className?: string;
}

/**
 * Foto con relación de aspecto fija (evita saltos de layout al cargar).
 * Si falta el archivo, muestra un placeholder en los tonos de la paleta.
 */
export function Photo({
  src,
  alt,
  ratio = '4 / 3',
  fill = false,
  priority = false,
  placeholderTone = 'light',
  className,
}: PhotoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={cx(styles.frame, fill && styles.fill, placeholderTone === 'dark' && styles.dark, className)}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className={styles.image}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={styles.placeholder}
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        />
      )}
    </div>
  );
}
