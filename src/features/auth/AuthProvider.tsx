import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

export type UserRole = Database['public']['Enums']['user_role'];

export interface Profile {
  firstName: string | null;
  role: UserRole;
}

interface AuthState {
  /** null si no hay sesión iniciada. */
  session: Session | null;
  /** Datos de la tabla profiles; null mientras carga o sin sesión. */
  profile: Profile | null;
  /** true si es admin o profesora (puede entrar al panel). */
  isStaff: boolean;
  /** true mientras se recupera la sesión guardada y el perfil al abrir el sitio. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });

    // Se entera de cada login, logout o renovación de la sesión.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // El perfil se busca aparte (no dentro del callback de arriba, para no trabar el login).
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('first_name, role')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data ? { firstName: data.first_name, role: data.role } : null);
        setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isStaff = profile?.role === 'admin' || profile?.role === 'instructor';

  return (
    <AuthContext.Provider
      value={{ session, profile, isStaff, loading: sessionLoading || profileLoading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return value;
}
