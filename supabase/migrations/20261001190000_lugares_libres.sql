-- Lugares libres por clase.
-- Las alumnas solo ven sus propias reservas (RLS), así que no pueden contar
-- las de las demás. Esta función devuelve el número de anotadas y de lugares
-- libres de cada clase, sin revelar quién reservó.

create function public.session_availability(p_from timestamptz, p_to timestamptz)
returns table (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int,
  instructor_id uuid,
  status public.session_status,
  booked int,
  spots_left int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.starts_at,
    s.ends_at,
    s.capacity,
    s.instructor_id,
    s.status,
    count(b.id)::int as booked,
    greatest(s.capacity - count(b.id), 0)::int as spots_left
  from public.class_sessions s
  left join public.bookings b
    on b.session_id = s.id
   and b.status in ('booked', 'attended', 'no_show')
  where s.starts_at >= p_from
    and s.starts_at < p_to
  group by s.id
  order by s.starts_at;
$$;

grant execute on function public.session_availability(timestamptz, timestamptz) to anon, authenticated;
