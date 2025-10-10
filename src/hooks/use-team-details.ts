'use client';

import { useState, useEffect } from 'react';
import { getTeamDetails, getTeamRoster } from '@/lib/firebase/db';
import { TeamDetails, RosterPlayer } from '@/lib/types';

interface UseTeamDetailsReturn {
  teamDetails: TeamDetails | null;
  members: RosterPlayer[];
  loading: boolean;
  error: string | null;
}

export function useTeamDetails(teamId: string | null): UseTeamDetailsReturn {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [members, setMembers] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Obtener los detalles básicos del equipo
        const details = await getTeamDetails(teamId);
        if (!details) {
          throw new Error('El equipo no fue encontrado.');
        }
        setTeamDetails(details);

        // 2. Obtener la plantilla COMPLETA (registrados + invitados)
        const roster = await getTeamRoster(teamId);
        setMembers(roster);

      } catch (err: any) {
        console.error("[useTeamDetails] Error:", err);
        setError(err.message || 'Ocurrió un error al cargar los datos del equipo.');
        // Limpiamos los datos en caso de error para no mostrar info incorrecta
        setTeamDetails(null);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();

  }, [teamId]);

  return { teamDetails, members, loading, error };
}
