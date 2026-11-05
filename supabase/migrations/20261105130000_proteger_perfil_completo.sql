-- Refuerza el trigger de protección de profiles: bloquea que una alumna
-- cambie su propio role, active o email. Solo un admin puede tocar esas columnas.
-- Las funciones deactivate_student y reactivate_student (security definer)
-- no se ven afectadas porque el caller es admin.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Solo un admin puede cambiar el rol';
    end if;
    if new.active is distinct from old.active then
      raise exception 'Solo un admin puede activar o desactivar una cuenta';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Solo un admin puede cambiar el email';
    end if;
  end if;
  return new;
end;
$$;
