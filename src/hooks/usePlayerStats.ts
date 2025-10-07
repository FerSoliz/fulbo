'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';

// --- Interfaces de Tipos para Estadísticas ---
// (Estas interfaces podrían moverse a un archivo central de tipos como `lib/types.ts` en el futuro)
interface StatDetails {
  matchesPlayed: number;
  goals: number;
  assists: number;
  mvp: number;
}

export interface PlayerStats {
  totals: StatDetails;
  byTournament?: { [key: string]: StatDetails & { tournamentName: string } };
}

interface UsePlayerStatsReturn {
  stats: PlayerStats | null;
  loading: boolean;
}

/**
 * Un hook personalizado para obtener y escuchar las estadísticas de un jugador en tiempo real.
 * 
 * @param userId - El ID del usuario cuyas estadísticas se quieren obtener.
 * @returns Un objeto con `stats` (los datos de las estadísticas) y `loading` (el estado de carga).
 */
export function usePlayerStats(userId: string | undefined | null): UsePlayerStatsReturn {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay userId, no hacemos nada.
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const statsRef = ref(db, `playerStats/${userId}`);

    // Nos suscribimos a los cambios en tiempo real.
    const unsubscribe = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      } else {
        // Si no hay datos, lo establecemos a null.
        setStats(null);
      }
      setLoading(false);
    }, (error) => {
      // Manejo de errores en caso de que falle la lectura.
      console.error(`Error al obtener las estadísticas para el usuario ${userId}:`, error);
      setStats(null);
      setLoading(false);
    });

    // La función de limpieza que se ejecuta cuando el componente que usa el hook se desmonta.
    // Es crucial para cancelar la suscripción y evitar fugas de memoria.
    return () => off(statsRef, 'value', unsubscribe);

  }, [userId]); // El efecto se volverá a ejecutar si el userId cambia.

  return { stats, loading };
}
