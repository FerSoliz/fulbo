'use client';

import { useState, useEffect, useCallback } from 'react';
import { EnrichedMatch } from '@/lib/types';
import { getFinishedMatches } from '@/lib/firebase/db';

/**
 * Hook personalizado para obtener todos los partidos finalizados.
 * Encapsula la lógica de obtención de datos, estados de carga y errores.
 * Proporciona una función `refetch` para volver a cargar los datos bajo demanda.
 */
export function useFinishedMatches() {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = useCallback(async () => {
    console.log("[useFinishedMatches] Iniciando la obtención de partidos...");
    try {
      setLoading(true);
      setError(null);
      const finishedMatches = await getFinishedMatches();
      setMatches(finishedMatches);
      console.log(`[useFinishedMatches] Se cargaron ${finishedMatches.length} partidos.`);
    } catch (err: any) {
      console.error("[useFinishedMatches] Error al obtener partidos:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]); // Se ejecuta solo una vez al montar el componente

  return { matches, loading, error, refetch: fetchMatches };
}
