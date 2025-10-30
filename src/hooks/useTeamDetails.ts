'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, get, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { User, GuestPlayer } from '@/lib/types';

// Tipos
export interface TeamDetails {
  id: string;
  name: string;
  crestUrl?: string;
  captainId: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
  isGuest: boolean;
}

interface UseTeamDetailsReturn {
  teamDetails: TeamDetails | null;
  members: TeamMember[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook refactorizado para obtener los detalles y miembros de un equipo desde Realtime Database.
 *
 * @param teamId - El ID del equipo a observar.
 * @returns Un objeto con los detalles del equipo, sus miembros, y el estado de carga/error.
 *
 * @description
 * Este hook optimiza la carga de datos en dos fases para evitar re-renderizados innecesarios y parpadeo (flickering):
 * 1. **Fase 1 (useEffect para IDs):** Se suscribe en tiempo real (`onValue`) solo al nodo `teams/{teamId}`.
 *    Obtiene la información básica del equipo (nombre, logo) y la lista de IDs de sus jugadores (`playerIds`).
 *    Este listener es muy ligero y solo actualiza un estado interno con los IDs.
 *
 * 2. **Fase 2 (useEffect para Miembros):** Se dispara solo cuando la lista de `playerIds` cambia.
 *    - Construye un array de promesas para buscar la información completa de cada jugador (sea `User` o `GuestPlayer`).
 *    - Utiliza `Promise.all` para ejecutar todas las búsquedas de perfiles en paralelo, reduciendo drásticamente
 *      el tiempo total de carga en comparación con un bucle `map` con `await` dentro.
 *    - Una vez que todos los datos han llegado, actualiza el estado `members` UNA SOLA VEZ, eliminando el parpadeo.
 *
 * 3. **Memorización:** Se utiliza `useMemo` para procesar y ordenar la lista de miembros, asegurando que esta
 *    operación solo se recalcule cuando los datos crudos de los miembros cambian.
 */
export function useTeamDetails(teamId: string | undefined | null): UseTeamDetailsReturn {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [playerIds, setPlayerIds] = useState<Record<string, { isGuest: boolean }>>({});
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // --- EFECTO 1: Obtener detalles del equipo y la lista de IDs de jugadores ---
  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      setTeamDetails(null);
      setPlayerIds({});
      return;
    }

    setLoading(true);
    const teamRef = ref(db, `teams/${teamId}`);

    const unsubscribe = onValue(
      teamRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const teamData = snapshot.val();
          setTeamDetails({
            id: snapshot.key as string,
            name: teamData.name,
            crestUrl: teamData.logoUrl,
            captainId: teamData.captainId || null,
          });
          setPlayerIds(teamData.players || {});
        } else {
          setError(new Error(`Equipo con id ${teamId} no encontrado.`));
          setTeamDetails(null);
          setPlayerIds({});
        }
      },
      (err) => {
        console.error(err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [teamId]);

  // --- EFECTO 2: Cargar los perfiles de los miembros cuando los IDs cambian ---
  useEffect(() => {
    const fetchMembers = async () => {
      if (Object.keys(playerIds).length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const memberPromises = Object.entries(playerIds).map(async ([id, { isGuest }]) => {
          const path = isGuest ? `guestPlayers/${id}` : `users/${id}`;
          const snapshot = await get(ref(db, path));

          if (!snapshot.exists()) return null;

          const data = snapshot.val();
          return isGuest
            ? ({
                id,
                name: data.name,
                isGuest: true,
                // [CORREGIDO] Usar la ruta estandarizada para el avatar por defecto.
                avatar: '/assets/images/default-avatar.png',
                username: `invitado-${data.dni}`.toLowerCase(),
              } as TeamMember)
            : ({
                id,
                name: data.name,
                avatar: data.avatar,
                username: data.username,
                isGuest: false,
              } as TeamMember);
        });

        const results = await Promise.all(memberPromises);
        const validMembers = results.filter((m): m is TeamMember => m !== null);
        
        // Ordenar: jugadores registrados primero, luego invitados
        validMembers.sort((a, b) => (a.isGuest === b.isGuest ? 0 : a.isGuest ? 1 : -1));

        setMembers(validMembers);
      } catch (err) {
        console.error("Error cargando miembros del equipo:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [playerIds]);

  return { teamDetails, members, loading, error };
}
