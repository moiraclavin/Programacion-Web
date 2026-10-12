import { supabase } from '../../lib/supabase';
import { unwrap, useQuery } from '../../lib/useQuery';

/** Reglas del estudio (cancelación, tope semanal, mensualidad). Son públicas. */
export function useStudioSettings() {
  return useQuery(
    () =>
      unwrap(
        supabase
          .from('studio_settings')
          .select('cancel_window_hours, booking_horizon_days, max_classes_per_week, monthly_fee')
          .single(),
      ),
    [],
  );
}
