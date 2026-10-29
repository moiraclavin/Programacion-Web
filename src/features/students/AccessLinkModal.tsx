import { useEffect, useState } from 'react';
import { Button, Input, Modal, buttonClassName } from '../../components/ui';
import { studio } from '../../content/studio';
import { whatsappNumber } from '../../lib/phone';

export interface AccessInfo {
  name: string;
  email: string;
  /** Celular tal como lo cargó el estudio; null si no tiene. */
  phone: string | null;
  link: string;
  /** true cuando se acaba de crear la alumna; false cuando es un link nuevo para una que ya existía. */
  isNew: boolean;
}

export interface AccessLinkModalProps {
  /** Los datos del link; null mantiene el modal cerrado. */
  access: AccessInfo | null;
  onClose: () => void;
}

function whatsappUrl(access: AccessInfo, number: string): string {
  const firstName = access.name.split(' ')[0];
  const text = access.isNew
    ? `¡Hola ${firstName}! Te damos la bienvenida a ${studio.name}. Entrá a este link para crear tu contraseña y reservar tus clases: ${access.link}\n\nTu usuario es ${access.email}.`
    : `¡Hola ${firstName}! Entrá a este link para elegir una contraseña nueva en ${studio.name}: ${access.link}\n\nTu usuario es ${access.email}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Muestra el link para que la alumna elija su contraseña, con botones para copiarlo o mandarlo por WhatsApp. */
export function AccessLinkModal({ access, onClose }: AccessLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    setCopied(false);
    setCopyFailed(false);
  }, [access?.link]);

  async function copy() {
    if (!access) return;
    try {
      await navigator.clipboard.writeText(access.link);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Sin permiso de portapapeles: se deja el link visible para copiarlo a mano.
      setCopyFailed(true);
    }
  }

  const number = access?.phone ? whatsappNumber(access.phone) : null;

  return (
    <Modal
      open={access !== null}
      onClose={onClose}
      title={access?.isNew ? 'Alumna creada' : 'Link de acceso nuevo'}
      description={access ? `${access.name} · ${access.email}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="secondary" onClick={copy}>
            {copied ? 'Link copiado ✓' : 'Copiar link'}
          </Button>
          {access && number && (
            <a href={whatsappUrl(access, number)} target="_blank" rel="noreferrer" className={buttonClassName()}>
              Enviar por WhatsApp
            </a>
          )}
        </>
      }
    >
      {access && (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <p>
            Pasale este link a la alumna: con él elige su contraseña. Su usuario para ingresar es su email. El link sirve
            una sola vez y vence; si no lo usa a tiempo, generás uno nuevo desde su ficha.
          </p>
          <Input
            label="Link de acceso"
            readOnly
            value={access.link}
            onFocus={(event) => event.target.select()}
            hint={
              copyFailed
                ? 'No pudimos copiarlo solo: seleccionalo y copialo a mano.'
                : number
                  ? undefined
                  : 'Esta alumna no tiene un celular válido cargado, así que no se puede abrir WhatsApp desde acá.'
            }
          />
        </div>
      )}
    </Modal>
  );
}
