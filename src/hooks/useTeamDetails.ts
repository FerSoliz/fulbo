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

export interface TeamMember extends UserProfile {
  id: string;
}

interface UseTeamDetailsReturn {
  teamDetails: TeamDetails | null;
  members: TeamMember[];
  loading: boolean;
}

/**
 * Un hook para obtener los detalles completos de un equipo, incluyendo su lista de miembros.
 * @param teamId - El ID del equipo a buscar. Si es nulo, no se realiza ninguna búsqueda.
 */
export function useTeamDetails(teamId: string | undefined | null): UseTeamDetailsReturn {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay teamId, no hay nada que buscar.
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const teamRef = ref(db, `teams/${teamId}`);
        const teamSnapshot = await get(teamRef);

        if (!teamSnapshot.exists()) {
          console.warn(`No se encontró el equipo con ID: ${teamId}`);
          setTeamDetails(null);
          setMembers([]);
          setLoading(false);
          return;
        }

        const teamData = teamSnapshot.val();
        setTeamDetails({
          id: teamSnapshot.key,
          name: teamData.name,
          crestUrl: teamData.logoUrl, // Asegúrate que el nombre del campo sea correcto
          captainId: teamData.captainId || null,
        });

        // Asumimos la estructura de datos profesional (objetos con keys)
        if (teamData.players && typeof teamData.players === 'object') {
          const playerIds = Object.keys(teamData.players);

          // Buscamos los perfiles de todos los jugadores en paralelo.
          const memberPromises = playerIds.map(async (playerId) => {
            const userRef = ref(db, `users/${playerId}`);
            const userSnapshot = await get(userRef);
            return userSnapshot.exists() ? { id: userSnapshot.key, ...userSnapshot.val() } : null;
          });

          const memberResults = (await Promise.all(memberPromises)).filter(Boolean) as TeamMember[];
          setMembers(memberResults);
        } else {
          // Si no hay jugadores o el formato es incorrecto, devolvemos una lista vacía.
          setMembers([]);
        }

      } catch (error) {
        console.error(`Error al obtener los detalles del equipo ${teamId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    
  }, [teamId]); // El hook se re-ejecuta si el teamId cambia.

  return { teamDetails, members, loading };
}
