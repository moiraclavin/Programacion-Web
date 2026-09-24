import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, EmptyState, Input, Modal, Spinner, Tabs } from '../components/ui';
import styles from './UiShowcase.module.css';

// Página temporal para revisar los componentes base. Se elimina cuando existan las páginas reales.

const DAYS = [
  { id: 'lun', label: 'Lun 29' },
  { id: 'mar', label: 'Mar 30' },
  { id: 'mie', label: 'Mié 1' },
  { id: 'jue', label: 'Jue 2' },
  { id: 'vie', label: 'Vie 3' },
  { id: 'sab', label: 'Sáb 4' },
  { id: 'dom', label: 'Dom 5', disabled: true },
];

const SLOTS = [
  { time: '08:00', teacher: 'Lucía', spots: 3 },
  { time: '09:00', teacher: 'Martina', spots: 0 },
  { time: '18:00', teacher: 'Lucía', spots: 5 },
];

export function UiShowcase() {
  const [day, setDay] = useState('lun');
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [email, setEmail] = useState('');

  const emailError = email && !email.includes('@') ? 'Ingresá un email válido.' : undefined;

  function confirmCancel() {
    setCancelling(true);
    setTimeout(() => {
      setCancelling(false);
      setModalOpen(false);
    }, 1200);
  }

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Sistema de diseño</p>
        <h1 className={styles.heading}>Componentes base</h1>
        <p className={styles.lead}>Paleta bone, sand, stone, ink y sage. Tipografía Manrope.</p>
      </header>

      <Section title="Paleta">
        <div className={styles.swatches}>
          {['bone', 'sand', 'stone', 'ink', 'sage'].map((name) => (
            <div key={name} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(--color-${name})` }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className={styles.row}>
          <Button>Reservar</Button>
          <Button variant="secondary">Ver horarios</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button loading>Pagando</Button>
          <Button disabled>Sin cupo</Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">Chico</Button>
          <Button size="lg">Grande</Button>
        </div>
        <Button fullWidth size="lg">
          Pagar octubre
        </Button>
      </Section>

      <Section title="Input">
        <div className={styles.stack}>
          <Input
            label="Email"
            type="email"
            placeholder="nombre@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />
          <Input label="Contraseña" type="password" hint="Mínimo 8 caracteres." />
          <Input label="DNI" disabled defaultValue="30.123.456" />
        </div>
      </Section>

      <Section title="Badge">
        <div className={styles.row}>
          <Badge>Reservada</Badge>
          <Badge tone="success">Presente</Badge>
          <Badge tone="warning">Pago pendiente</Badge>
          <Badge tone="danger">Ausente</Badge>
          <Badge tone="outline">Cancelada</Badge>
        </div>
      </Section>

      <Section title="Tabs + Card">
        <Tabs items={DAYS} value={day} onChange={setDay} label="Días de la semana">
          <ul className={styles.slots}>
            {SLOTS.map((slot) => (
              <Card as="li" key={slot.time} interactive className={styles.slot}>
                <div>
                  <p className={styles.slotTime}>{slot.time}</p>
                  <p className={styles.slotMeta}>
                    Reformer · {slot.teacher}
                  </p>
                </div>
                {slot.spots > 0 ? (
                  <Button size="sm" variant="secondary">
                    Reservar
                  </Button>
                ) : (
                  <Badge tone="outline">Completa</Badge>
                )}
              </Card>
            ))}
          </ul>
        </Tabs>
      </Section>

      <Section title="Modal">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Cancelar una clase
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="¿Cancelar la clase?"
          description="Lunes 29 · 08:00 · Reformer con Lucía"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={cancelling}>
                Volver
              </Button>
              <Button onClick={confirmCancel} loading={cancelling}>
                Sí, cancelar
              </Button>
            </>
          }
        >
          <p>Faltan más de 12 horas, así que el lugar se libera y no se descuenta de tu plan.</p>
        </Modal>
      </Section>

      <Section title="Spinner">
        <div className={styles.row}>
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
              <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
              <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          }
          title="Todavía no reservaste clases este mes"
          description="Elegí un horario en la grilla semanal para empezar."
          action={<Button>Ver horarios</Button>}
        />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}
