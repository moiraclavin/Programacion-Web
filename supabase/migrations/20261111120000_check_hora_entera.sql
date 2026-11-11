-- Las clases deben empezar en hora exacta (minuto 00).
-- Se evalúa en la zona horaria del estudio para evitar falsos positivos
-- por offsets que no caen en hora redonda en UTC.

alter table public.class_sessions
  add constraint class_sessions_starts_at_whole_hour
  check (extract(minute from starts_at at time zone 'America/Argentina/Buenos_Aires') = 0);
