'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMatchHistoryForTeam } from '@/lib/firebase/db';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match, Tournament, Team } from '@/lib/types';

// --- TIPOS ENRIQUECIDOS (CORREGIDOS) ---
// El producto final que nuestro hook entregará, ahora con los nombres de propiedad correctos.
export interface EnrichedMatch extends Match {
  tournamentName: string;
  homeTeamName: string;
  homeTeamLogo?: string; // Corregido de homeTeamCrestUrl a homeTeamLogo
  awayTeamName: string;
  awayTeamLogo?: string; // Corregido de awayTeamCrestUrl a awayTeamLogo
}

interface UseMatchHistoryReturn {
  matches: EnrichedMatch[];
  tournaments: Tournament[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook experto para obtener el historial de partidos de un equipo.
 * Abstrae la lógica compleja de:
 * 1. Obtener los partidos de un equipo.
 * 2. Obtener los IDs únicos de torneos y equipos involucrados.
 * 3. "Enriquecer" cada partido con los nombres/datos de esos torneos y equipos.
 * @param teamId El ID del equipo para el cual buscar el historial.
 * @returns Un objeto con los partidos enriquecidos, una lista de torneos, y los estados de carga y error.
 */
export function useMatchHistory(teamId: string | undefined | null): UseMatchHistoryReturn {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchAndEnrichHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const rawMatches = await getMatchHistoryForTeam(teamId);
        if (rawMatches.length === 0) {
          setMatches([]);
          setTournaments([]);
          setLoading(false);
          return;
        }

        const tournamentIds = [...new Set(rawMatches.map(m => m.tournamentId))];
        const teamIds = [...new Set(rawMatches.flatMap(m => [m.homeTeamId, m.awayTeamId]))];

        const tournamentPromises = tournamentIds.map(id => get(ref(db, `tournaments/${id}`)));
        const teamPromises = teamIds.map(id => get(ref(db, `teams/${id}`)));

        const [tournamentSnapshots, teamSnapshots] = await Promise.all([
          Promise.all(tournamentPromises),
          Promise.all(teamPromises),
        ]);

        const tournamentsMap: Record<string, Tournament> = {};
        tournamentSnapshots.forEach(snap => {
          if (snap.exists()) tournamentsMap[snap.key!] = { id: snap.key!, ...snap.val() };
        });

        const teamsMap: Record<string, Team> = {};
        teamSnapshots.forEach(snap => {
          if (snap.exists()) teamsMap[snap.key!] = { id: snap.key!, ...snap.val() };
        });

        // 4. ENRIQUECER LOS PARTIDOS (LÓGICA CORREGIDA)
        const enriched = rawMatches
          .map((match): EnrichedMatch => ({
            ...match,
            tournamentName: tournamentsMap[match.tournamentId]?.name || 'Torneo Desconocido',
            homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
            homeTeamLogo: teamsMap[match.homeTeamId]?.logoUrl, // Corregido: lee logoUrl
            awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
            awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl, // Corregido: lee logoUrl
          }))
          .sort((a, b) => new Date(b.details?.date).getTime() - new Date(a.details?.date).getTime());

        setMatches(enriched);
        setTournaments(Object.values(tournamentsMap));

      } catch (err) {
        console.error("[useMatchHistory] Error al procesar el historial:", err);
        setError(err instanceof Error ? err : new Error('Ocurrió un error desconocido'));
        toast({ title: "Error", description: "No se pudo cargar el historial.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAndEnrichHistory();
  }, [teamId, toast]);

  return { matches, tournaments, loading, error };
}
