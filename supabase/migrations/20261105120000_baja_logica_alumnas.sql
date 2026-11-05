-- Baja lógica de alumnas: columna active en profiles y funciones para dar de baja y reactivar.

alter table public.profiles add column active boolean not null default true;

-- book_session rechaza alumnas inactivas.
create or replace function public.book_session(p_session_id uuid)
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
  v_active boolean;
begin
  if v_uid is null then
    raise exception 'Tenés que iniciar sesión para reservar';
  end if;

  select active into v_active from public.profiles where id = v_uid;
  if not v_active then
    raise exception 'Tu cuenta está desactivada. Contactá al estudio.';
  end if;

  select * into v_settings from public.studio_settings;

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

-- Dar de baja a una alumna: desactiva su perfil y cancela sus reservas futuras activas.
create function public.deactivate_student(p_student_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Solo el admin puede dar de baja alumnas';
  end if;

  update public.profiles set active = false where id = p_student_id and role = 'student';
  if not found then
    raise exception 'No encontramos a esa alumna';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where student_id = p_student_id
    and status = 'booked'
    and session_id in (
      select id from public.class_sessions where starts_at > now()
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Reactivar una alumna.
create function public.reactivate_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el admin puede reactivar alumnas';
  end if;

  update public.profiles set active = true where id = p_student_id and role = 'student';
  if not found then
    raise exception 'No encontramos a esa alumna';
  end if;
end;
$$;

revoke execute on function public.deactivate_student(uuid), public.reactivate_student(uuid) from public, anon;
grant execute on function public.deactivate_student(uuid), public.reactivate_student(uuid) to authenticated;
