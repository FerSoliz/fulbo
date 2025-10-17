'use client';

import { useState, useEffect } from 'react';
import { listenToPlayerStats } from '@/lib/firebase/db';
import { PlayerStats } from '@/lib/types';
import { Unsubscribe } from 'firebase/database';

interface UsePlayerStatsReturn {
  stats: PlayerStats | null;
  loading: boolean;
}

/**
 * Hook para obtener y escuchar las estadísticas de un jugador en tiempo real,
 * utilizando la capa de acceso a datos centralizada.
 * 
 * @param userId - El ID del usuario cuyas estadísticas se quieren obtener.
 * @returns Un objeto con `stats` y `loading`.
 */
export function usePlayerStats(userId: string | undefined | null): UsePlayerStatsReturn {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setStats(null);
      return;
    }

    setLoading(true);
    let unsubscribe: Unsubscribe | null = null;

    try {
      unsubscribe = listenToPlayerStats(userId, (playerStats) => {
        setStats(playerStats);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error al suscribirse a las estadísticas del jugador:", error);
      setStats(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };

  }, [userId]);

  return { stats, loading };
}
