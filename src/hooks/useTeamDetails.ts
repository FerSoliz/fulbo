'use client';

import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';

// Tipos que el hook devolverá.
export interface TeamDetails {
  id: string;
  name: string;
  crestUrl?: string;
  captainId: string | null;
}

// El tipo TeamMember ahora es más flexible para acomodar datos de invitados.
export interface TeamMember {
  id: string;
  name: string;
  avatar?: string; // El avatar es opcional para invitados
  username?: string; // Username es opcional (los invitados no tienen)
  isGuest: boolean;
}

interface UseTeamDetailsReturn {
  teamDetails: TeamDetails | null;
  members: TeamMember[];
  loading: boolean;
  error: Error | null;
}

/**
 * Un hook para obtener los detalles completos de un equipo, incluyendo su lista de miembros (registrados e invitados).
 * @param teamId - El ID del equipo a buscar. Si es nulo, no se realiza ninguna búsqueda.
 */
export function useTeamDetails(teamId: string | undefined | null): UseTeamDetailsReturn {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Si no hay teamId, no hay nada que buscar.
    if (!teamId) {
      setLoading(false);
      setTeamDetails(null);
      setMembers([]);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const teamRef = ref(db, `teams/${teamId}`);
        const teamSnapshot = await get(teamRef);

        if (!teamSnapshot.exists()) {
          console.warn(`No se encontró el equipo con ID: ${teamId}`);
          setTeamDetails(null);
          setMembers([]);
          return;
        }

        const teamData = teamSnapshot.val();
        setTeamDetails({
          id: teamSnapshot.key,
          name: teamData.name,
          crestUrl: teamData.logoUrl,
          captainId: teamData.captainId || null,
        });

        if (teamData.players && typeof teamData.players === 'object') {
          const playerEntries = Object.entries(teamData.players);

          const memberPromises = playerEntries.map(async ([playerId, playerData]) => {
            const { isGuest } = playerData as { isGuest: boolean };

            if (isGuest) {
              // Es un jugador invitado, buscar en /guestPlayers
              const guestRef = ref(db, `guestPlayers/${playerId}`);
              const guestSnapshot = await get(guestRef);
              if (guestSnapshot.exists()) {
                const guestData = guestSnapshot.val();
                // Adaptamos el invitado a la estructura de TeamMember
                return {
                  id: guestSnapshot.key,
                  name: guestData.name,
                  isGuest: true,
                  // Los invitados no tienen avatar o username en la app, usamos placeholders
                  username: `invitado-${guestData.dni}`.toLowerCase(),
                  avatar: '/user-placeholder.png' // Placeholder genérico para invitados
                } as TeamMember;
              }
            } else {
              // Es un usuario registrado, buscar en /users
              const userRef = ref(db, `users/${playerId}`);
              const userSnapshot = await get(userRef);
              if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                // Adaptamos el usuario a la estructura de TeamMember
                return {
                  id: userSnapshot.key,
                  name: userData.name,
                  avatar: userData.avatar,
                  username: userData.username,
                  isGuest: false,
                } as TeamMember;
              }
            }
            return null; // Si no se encuentra el jugador en ninguna colección
          });

          const memberResults = (await Promise.all(memberPromises)).filter(Boolean) as TeamMember[];
          setMembers(memberResults);
          
        } else {
          setMembers([]);
        }

      } catch (err: any) {
        console.error(`Error al obtener los detalles del equipo ${teamId}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    
  }, [teamId]);

  return { teamDetails, members, loading, error };
}
