import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (ver .env.example).');
}

/**
 * Cliente único de Supabase para todo el sitio.
 * La clave publishable puede estar en el navegador: los datos los protegen las reglas RLS.
 */
export const supabase = createClient<Database>(url, publishableKey);
