-- Calendario de clases del panel: una sola clase por horario y cancelar una clase entera.

-- Una sola clase vigente por horario (las canceladas no cuentan, así se puede volver a abrir el horario).
create unique index class_sessions_one_scheduled_per_start
  on public.class_sessions (starts_at)
  where status = 'scheduled';

-- generate_sessions ahora ignora cualquier conflicto (incluido el índice nuevo) en vez de solo el de la plantilla.
create or replace function public.generate_sessions(p_week_start date)
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
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Cancela una clase que todavía no empezó. Las reservas de las alumnas se cancelan sin descontarles la clase
-- (no es una cancelación tardía suya). Devuelve cuántas reservas se cancelaron.
create function public.cancel_session(p_session_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.class_sessions;
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Solo el admin puede cancelar clases';
  end if;

  select * into v_session
  from public.class_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'La clase no existe';
  end if;

  if v_session.status = 'cancelled' then
    raise exception 'La clase ya estaba cancelada';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'No se puede cancelar una clase que ya empezó';
  end if;

  update public.class_sessions set status = 'cancelled' where id = p_session_id;

  update public.bookings
  set status = 'cancelled', cancelled_at = now()
  where session_id = p_session_id and status = 'booked';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.cancel_session(uuid) from public, anon;
grant execute on function public.cancel_session(uuid) to authenticated;
