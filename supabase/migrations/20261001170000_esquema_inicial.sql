-- Esquema inicial del estudio de pilates.
-- Tablas, permisos (RLS) y funciones para reservar, cancelar y tomar asistencia.
-- Las reglas de cupo, tope semanal y cancelación se validan acá, no en el frontend.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('student', 'instructor', 'admin');
create type public.session_status as enum ('scheduled', 'cancelled');
create type public.booking_status as enum ('booked', 'cancelled', 'late_cancelled', 'attended', 'no_show');
create type public.membership_status as enum ('pending', 'active', 'expired');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'refunded');

-- ---------------------------------------------------------------------------
-- Configuración del estudio (una sola fila)
-- ---------------------------------------------------------------------------

create table public.studio_settings (
  id boolean primary key default true check (id),
  monthly_fee numeric(12, 2) not null default 0 check (monthly_fee >= 0),
  max_classes_per_week int not null default 3 check (max_classes_per_week > 0),
  cancel_window_hours int not null default 12 check (cancel_window_hours >= 0),
  booking_horizon_days int not null default 14 check (booking_horizon_days > 0),
  timezone text not null default 'America/Argentina/Buenos_Aires'
);

insert into public.studio_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- Perfiles (1 a 1 con auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- Helpers de rol. Son security definer para poder leer profiles sin chocar con RLS.
create function public.current_role_is(roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any (roles)
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role_is(array['admin']::public.user_role[]);
$$;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role_is(array['admin', 'instructor']::public.user_role[]);
$$;

-- Crea el perfil automáticamente cuando se da de alta un usuario en Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Una alumna puede editar sus datos, pero no cambiarse el rol.
-- Desde el panel de Supabase (sin usuario logueado) sí se puede.
create function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Solo un admin puede cambiar el rol';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Profesoras
-- ---------------------------------------------------------------------------

create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text,
  bio text,
  photo_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  profile_id uuid references public.profiles (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Horarios: plantilla semanal y clases concretas
-- ---------------------------------------------------------------------------

-- Horario recurrente, por ejemplo "lunes 8:00". weekday: 1 = lunes ... 7 = domingo.
create table public.class_templates (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  duration_min int not null default 60 check (duration_min > 0),
  capacity int not null default 8 check (capacity > 0),
  instructor_id uuid references public.instructors (id) on delete set null,
  active boolean not null default true
);

-- Una clase en una fecha y hora puntual. Se generan desde las plantillas.
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.class_templates (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null check (capacity > 0),
  instructor_id uuid references public.instructors (id) on delete set null,
  status public.session_status not null default 'scheduled',
  check (ends_at > starts_at),
  unique (template_id, starts_at)
);

create index class_sessions_starts_at_idx on public.class_sessions (starts_at);

-- ---------------------------------------------------------------------------
-- Reservas (la asistencia vive en el estado de la reserva)
-- ---------------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.booking_status not null default 'booked',
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  attendance_marked_at timestamptz,
  attendance_marked_by uuid references public.profiles (id) on delete set null
);

-- Una alumna no puede tener dos reservas vigentes para la misma clase.
create unique index bookings_one_active_per_session
  on public.bookings (session_id, student_id)
  where status <> 'cancelled';

create index bookings_student_idx on public.bookings (student_id);

-- ---------------------------------------------------------------------------
-- Mensualidades y pagos
-- ---------------------------------------------------------------------------

-- El "mes pagado". period es siempre el primer día del mes.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  period date not null check (extract(day from period) = 1),
  amount numeric(12, 2) not null check (amount >= 0),
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (student_id, period)
);

-- Cada intento de pago. Un mes puede tener un pago rechazado y después uno aprobado.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  membership_id uuid references public.memberships (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'ARS',
  status public.payment_status not null default 'pending',
  provider text not null default 'mercadopago',
  mp_preference_id text,
  mp_payment_id text unique,
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index payments_student_idx on public.payments (student_id);

-- ---------------------------------------------------------------------------
-- Permisos (Row Level Security)
-- ---------------------------------------------------------------------------

alter table public.studio_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.instructors enable row level security;
alter table public.class_templates enable row level security;
alter table public.class_sessions enable row level security;
alter table public.bookings enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;

-- Configuración: la lee cualquiera, la cambia el admin.
create policy "settings: lectura pública" on public.studio_settings
  for select using (true);
create policy "settings: admin edita" on public.studio_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Perfiles: cada una ve y edita el suyo; el staff ve todos; el admin edita todos.
create policy "profiles: ver el propio o staff" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "profiles: editar el propio o admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Profesoras: las activas son públicas; el admin las gestiona.
create policy "instructors: lectura pública" on public.instructors
  for select using (active or public.is_admin());
create policy "instructors: admin gestiona" on public.instructors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Plantillas: las ven las usuarias logueadas; el admin las gestiona.
create policy "templates: lectura logueadas" on public.class_templates
  for select to authenticated using (true);
create policy "templates: admin gestiona" on public.class_templates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Clases: la grilla es pública; el admin las gestiona.
create policy "sessions: lectura pública" on public.class_sessions
  for select using (true);
create policy "sessions: admin gestiona" on public.class_sessions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Reservas: cada alumna ve las suyas y el staff ve todas.
-- Reservar, cancelar y tomar asistencia se hace solo con las funciones de abajo.
create policy "bookings: ver las propias o staff" on public.bookings
  for select to authenticated using (student_id = auth.uid() or public.is_staff());
create policy "bookings: admin gestiona" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Mensualidades y pagos: cada alumna ve los suyos; el admin gestiona.
-- Más adelante, el webhook de Mercado Pago escribe con la service role (saltea RLS).
create policy "memberships: ver las propias o admin" on public.memberships
  for select to authenticated using (student_id = auth.uid() or public.is_admin());
create policy "memberships: admin gestiona" on public.memberships
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "payments: ver los propios o admin" on public.payments
  for select to authenticated using (student_id = auth.uid() or public.is_admin());
create policy "payments: admin gestiona" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Funciones de negocio (se llaman desde el frontend con supabase.rpc)
-- ---------------------------------------------------------------------------

-- Reservar una clase. Valida, en una sola transacción:
-- clase futura y dentro del horizonte, mes pagado, cupo y tope semanal.
create function public.book_session(p_session_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_settings public.studio_settings;
  v_session public.class_sessions;
  v_local_start timestamp;
  v_week_start timestamp;
  v_taken int;
  v_week_count int;
  v_booking public.bookings;
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para reservar';
  end if;

  select * into v_settings from public.studio_settings;

  -- Bloquea la clase para que dos reservas simultáneas no superen el cupo.
  select * into v_session
  from public.class_sessions
  where id = p_session_id
  for update;

  if not found or v_session.status <> 'scheduled' then
    raise exception 'La clase no existe o fue cancelada';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'La clase ya empezó';
  end if;

  if v_session.starts_at > now() + make_interval(days => v_settings.booking_horizon_days) then
    raise exception 'Todavía no se puede reservar esa clase';
  end if;

  v_local_start := v_session.starts_at at time zone v_settings.timezone;

  if not exists (
    select 1 from public.memberships
    where student_id = v_uid
      and period = date_trunc('month', v_local_start)::date
      and status = 'active'
  ) then
    raise exception 'Tenés que tener pagado el mes para reservar';
  end if;

  if exists (
    select 1 from public.bookings
    where session_id = p_session_id
      and student_id = v_uid
      and status <> 'cancelled'
  ) then
    raise exception 'Ya tenés una reserva en esta clase';
  end if;

  select count(*) into v_taken
  from public.bookings
  where session_id = p_session_id
    and status in ('booked', 'attended', 'no_show');

  if v_taken >= v_session.capacity then
    raise exception 'La clase no tiene lugares disponibles';
  end if;

  -- Tope semanal (semana de lunes a domingo, en hora de Argentina).
  -- La cancelación tardía también cuenta, porque consume la clase.
  v_week_start := date_trunc('week', v_local_start);

  select count(*) into v_week_count
  from public.bookings b
  join public.class_sessions s on s.id = b.session_id
  where b.student_id = v_uid
    and b.status in ('booked', 'attended', 'no_show', 'late_cancelled')
    and s.starts_at >= v_week_start at time zone v_settings.timezone
    and s.starts_at < (v_week_start + interval '7 days') at time zone v_settings.timezone;

  if v_week_count >= v_settings.max_classes_per_week then
    raise exception 'Llegaste al máximo de % clases por semana', v_settings.max_classes_per_week;
  end if;

  insert into public.bookings (session_id, student_id)
  values (p_session_id, v_uid)
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Cancelar una reserva propia. Con 12 h o más de anticipación libera el lugar;
-- con menos, queda como cancelación tardía y la clase cuenta como consumida.
create function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_settings public.studio_settings;
  v_booking public.bookings;
  v_starts_at timestamptz;
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para cancelar';
  end if;

  select * into v_settings from public.studio_settings;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and student_id = v_uid
  for update;

  if not found then
    raise exception 'No encontramos esa reserva';
  end if;

  if v_booking.status <> 'booked' then
    raise exception 'Esa reserva ya no se puede cancelar';
  end if;

  select starts_at into v_starts_at
  from public.class_sessions
  where id = v_booking.session_id;

  if v_starts_at <= now() then
    raise exception 'La clase ya empezó';
  end if;

  update public.bookings
  set status = case
        when v_starts_at - now() >= make_interval(hours => v_settings.cancel_window_hours)
          then 'cancelled'::public.booking_status
        else 'late_cancelled'::public.booking_status
      end,
      cancelled_at = now()
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Tomar asistencia. Solo profesoras y admin.
create function public.mark_attendance(p_booking_id uuid, p_status public.booking_status)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  if not public.is_staff() then
    raise exception 'Solo las profesoras o el admin pueden tomar asistencia';
  end if;

  if p_status not in ('attended', 'no_show') then
    raise exception 'La asistencia solo puede ser presente o ausente';
  end if;

  update public.bookings
  set status = p_status,
      attendance_marked_at = now(),
      attendance_marked_by = auth.uid()
  where id = p_booking_id
    and status in ('booked', 'attended', 'no_show')
  returning * into v_booking;

  if not found then
    raise exception 'No encontramos esa reserva o estaba cancelada';
  end if;

  return v_booking;
end;
$$;

-- Crea las clases de una semana a partir de las plantillas activas.
-- p_week_start tiene que ser un lunes. Si una clase ya existe, no la duplica.
create function public.generate_sessions(p_week_start date)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_count int;
begin
  if not public.is_admin() and auth.uid() is not null then
    raise exception 'Solo el admin puede generar clases';
  end if;

  if extract(isodow from p_week_start) <> 1 then
    raise exception 'La semana tiene que empezar un lunes';
  end if;

  select timezone into v_tz from public.studio_settings;

  insert into public.class_sessions (template_id, starts_at, ends_at, capacity, instructor_id)
  select
    t.id,
    (p_week_start + (t.weekday - 1) + t.start_time) at time zone v_tz,
    (p_week_start + (t.weekday - 1) + t.start_time + make_interval(mins => t.duration_min)) at time zone v_tz,
    t.capacity,
    t.instructor_id
  from public.class_templates t
  where t.active
  on conflict (template_id, starts_at) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Las funciones de negocio solo las pueden llamar usuarias logueadas.
revoke execute on function
  public.book_session(uuid),
  public.cancel_booking(uuid),
  public.mark_attendance(uuid, public.booking_status),
  public.generate_sessions(date)
from public, anon;

grant execute on function
  public.book_session(uuid),
  public.cancel_booking(uuid),
  public.mark_attendance(uuid, public.booking_status),
  public.generate_sessions(date)
to authenticated;
