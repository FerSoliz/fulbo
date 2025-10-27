'use client';

import { useState, useEffect } from 'react';
import { ref, get, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';

// Tipos (sin cambios)
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
 * Hook refactorizado para obtener detalles del equipo en tiempo real de forma eficiente.
 * Separa la carga de los detalles del equipo de la carga de los miembros para evitar
 * recargas innecesarias y eliminar el parpadeo.
 */
export function useTeamDetails(teamId: string | undefined | null): UseTeamDetailsReturn {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // --- EFECTO 1: Escuchar los detalles del equipo (nombre, logo, capitán) ---
  useEffect(() => {
    if (!teamId) {
      setTeamDetails(null);
      return;
    }

    const detailsRef = ref(db, `teams/${teamId}`);
    const unsubscribeDetails = onValue(detailsRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamData = snapshot.val();
        setTeamDetails({
          id: snapshot.key as string,
          name: teamData.name,
          crestUrl: teamData.logoUrl,
          captainId: teamData.captainId || null,
        });
      } else {
        setError(new Error(`Equipo con id ${teamId} no encontrado.`));
        setTeamDetails(null);
      }
    });

    return () => unsubscribeDetails();
  }, [teamId]);

  // --- EFECTO 2: Escuchar la lista de jugadores y cargarlos ---
  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const playersRef = ref(db, `teams/${teamId}/players`);
    setLoading(true);

    const unsubscribePlayers = onValue(playersRef, async (snapshot) => {
      if (!snapshot.exists() || !snapshot.hasChildren()) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const playersData = snapshot.val();
      const playerEntries = Object.entries(playersData);

      try {
        const memberPromises = playerEntries.map(async ([playerId, playerData]) => {
          const { isGuest } = playerData as { isGuest: boolean };
          const playerRef = ref(db, isGuest ? `guestPlayers/${playerId}` : `users/${playerId}`);
          const playerSnapshot = await get(playerRef);

          if (playerSnapshot.exists()) {
            const data = playerSnapshot.val();
            return isGuest
              ? {
                  id: playerSnapshot.key as string,
                  name: data.name,
                  isGuest: true,
                  username: `invitado-${data.dni}`.toLowerCase(),
                  avatar: '/user-placeholder.png',
                }
              : {
                  id: playerSnapshot.key as string,
                  name: data.name,
                  avatar: data.avatar,
                  username: data.username,
                  isGuest: false,
                };
          }
          return null;
        });

        const memberResults = (await Promise.all(memberPromises)).filter(
          (m): m is TeamMember => m !== null
        );
        setMembers(memberResults);
      } catch (err) {
        console.error("Error cargando miembros del equipo:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setMembers([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribePlayers();
  }, [teamId]);

  return { teamDetails, members, loading, error };
}
