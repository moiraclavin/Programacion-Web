# Casa Pilates

Sitio web de un estudio de pilates: presentación del estudio, reserva de clases por semana,
pago de la mensualidad con Mercado Pago, historial de clases y asistencia, y un panel de administración.

Proyecto de la materia Programación Web (ITBA).

- **Sitio publicado:** https://programacion-web-theta-orpin.vercel.app
- **Preview de cada PR:** lo genera Vercel automáticamente y aparece como comentario en el PR.

## Qué incluye

| Área | Rutas | Quién |
|---|---|---|
| Institucional | `/`, `/nosotros`, `/profesoras`, `/estudio`, `/contacto` | Todos |
| Alumnas | `/app/reservar`, `/app/mis-clases`, `/app/pagos`, `/app/cuenta` | Alumnas con sesión |
| Panel | `/admin` (agenda, clase, horarios, alumnas) | Admin y profesoras |

Reglas del estudio: clases de 1 hora con cupo limitado, máximo 3 clases por semana por alumna,
cancelación sin costo hasta 12 horas antes (después, la clase se descuenta), y reservas solo con el mes pagado.

## Tecnologías

- **Frontend:** React 19 + TypeScript + Vite, React Router, CSS Modules y variables CSS (sin frameworks de estilos).
- **Backend:** Supabase (Postgres, Auth y Edge Functions). Los permisos los aplica la base con RLS,
  y las reglas de reservas viven en funciones SQL (`book_session`, `cancel_booking`, `mark_attendance`).
- **Pagos:** Mercado Pago Checkout Pro.
- **Publicación:** Vercel. **CI:** GitHub Actions.

## Cómo correrlo

Requisitos: Node.js 24 (las pruebas usan TypeScript sin compilar, que Node 24 soporta).

```bash
npm install
cp .env.example .env.local   # completar con los datos del proyecto de Supabase
npm run dev                  # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | Revisión de tipos |
| `npm test` | Pruebas de la lógica de pagos |
| `npm run build` | Build de producción |

### Variables de entorno

| Variable | Dónde | Notas |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` y Vercel | Pública |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` y Vercel | Pública: la protegen las reglas RLS |
| `MP_ACCESS_TOKEN` | Secreto de Supabase | **Privado.** `supabase secrets set MP_ACCESS_TOKEN=...` |
| `MP_WEBHOOK_SECRET` | Secreto de Supabase (opcional) | Si está, el webhook verifica la firma de Mercado Pago |
| `SITE_URL` | Secreto de Supabase (opcional) | Dirección a la que vuelve la alumna después de pagar |

## Estructura

```
src/
  components/ui/       Componentes base (Button, Input, Modal, Tabs…), cada uno con su .module.css
  components/layout/   Header, footer y layouts (público, alumnas, panel)
  components/site/     Bloques de las páginas institucionales
  content/             Textos y datos del estudio
  features/            Lógica por tema: auth, bookings, payments, studio
  pages/               Una carpeta por área: public, auth, student, admin
  lib/                 Cliente de Supabase, fechas, etiquetas, hook de consultas
supabase/
  migrations/          Esquema de la base, permisos y funciones
  functions/           Edge Functions: mp-create-preference y mp-webhook
```

## Pagos con Mercado Pago

1. La alumna toca **Pagar** → el sitio llama (con `fetch`) a la función `mp-create-preference`.
2. La función valida la sesión, decide el monto y el mes, crea el pago en estado pendiente
   y devuelve el link de Mercado Pago.
3. La alumna paga en Mercado Pago y vuelve a `/app/pagos`.
4. Mercado Pago avisa a `mp-webhook`, que consulta el pago directamente a Mercado Pago, verifica el monto
   y recién ahí marca el pago como aprobado y activa la mensualidad. Es idempotente.

## Cómo trabajamos

- `main` es producción: **no se sube directo**. Cada cambio va en una rama (`feature/...`, `fix/...`, `chore/...`)
  y entra por pull request.
- Cada PR usa la plantilla con checklist, corre el CI y tiene su preview en Vercel.
- Los cambios en la base van como migraciones nuevas en `supabase/migrations/`.
- [`PROMPTS.md`](PROMPTS.md) registra los pedidos hechos a Claude durante el desarrollo.
