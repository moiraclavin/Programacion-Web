import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface PostgrestResult {
  data: unknown;
  error: { message: string } | null;
}

/**
 * Convierte la respuesta de Supabase en un valor, o tira el error para que lo capture useQuery.
 * El tipo del resultado se toma solo de la respuesta exitosa (la que tiene error: null).
 */
export async function unwrap<R extends PostgrestResult>(
  request: PromiseLike<R>,
): Promise<Extract<R, { error: null }>['data']> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data as Extract<R, { error: null }>['data'];
}

export interface QueryState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  /** Vuelve a pedir los datos (por ejemplo, después de guardar un cambio). */
  reload: () => void;
}

/**
 * Pide datos cuando cambian las dependencias. Si cambian antes de que llegue la
 * respuesta, descarta la vieja para que no pise a la nueva.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: DependencyList): QueryState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Error desconocido');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, error, loading, reload };
}
