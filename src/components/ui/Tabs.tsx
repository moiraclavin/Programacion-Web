import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Nombre accesible del grupo, ej. "Días de la semana". */
  label: string;
  /** Contenido del tab activo. */
  children?: ReactNode;
  className?: string;
}

/**
 * Tabs accesibles (patrón WAI-ARIA): flechas ←/→, Inicio y Fin mueven y activan el tab.
 * Controlado: el padre guarda `value` y renderiza como `children` el contenido del tab activo.
 * En mobile la lista scrollea horizontalmente (ej. los 7 días de la semana).
 */
export function Tabs({ items, value, onChange, label, children, className }: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  function selectAndFocus(id: string) {
    onChange(id);
    const tab = tabRefs.current.get(id);
    tab?.focus();
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = items.filter((item) => !item.disabled);
    if (enabled.length === 0) return;
    const current = Math.max(0, enabled.findIndex((item) => item.id === value));

    let next: TabItem;
    switch (event.key) {
      case 'ArrowRight':
        next = enabled[(current + 1) % enabled.length];
        break;
      case 'ArrowLeft':
        next = enabled[(current - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    selectAndFocus(next.id);
  }

  return (
    <div className={cx(styles.tabs, className)}>
      <div role="tablist" aria-label={label} className={styles.list} onKeyDown={handleKeyDown}>
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) tabRefs.current.set(item.id, el);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={tabId(item.id)}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className={cx(styles.tab, selected && styles.selected)}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={tabId(value)} tabIndex={0} className={styles.panel}>
        {children}
      </div>
    </div>
  );
}
