'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMatchHistoryForTeam } from '@/lib/firebase/db';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match, Tournament, Team } from '@/lib/types';

// --- TIPOS ENRIQUECIDOS ---
// Este es el "producto final" que nuestro hook entregará: un objeto Match con toda la información necesaria para la UI.
export interface EnrichedMatch extends Match {
  tournamentName: string;
  homeTeamName: string;
  homeTeamCrestUrl?: string;
  awayTeamName: string;
  awayTeamCrestUrl?: string;
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
    // Si no hay teamId, no hay nada que buscar.
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchAndEnrichHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. OBTENER PARTIDOS INICIALES
        const rawMatches = await getMatchHistoryForTeam(teamId);
        if (rawMatches.length === 0) {
          setMatches([]);
          setTournaments([]);
          setLoading(false);
          return;
        }

        // 2. EXTRAER IDs ÚNICOS para no hacer llamadas duplicadas a la DB
        const tournamentIds = [...new Set(rawMatches.map(m => m.tournamentId))];
        const teamIds = [...new Set(rawMatches.flatMap(m => [m.homeTeamId, m.awayTeamId]))];

        // 3. BUSCAR DATOS DE ENRIQUECIMIENTO (Torneos y Equipos) EN PARALELO
        const tournamentPromises = tournamentIds.map(id => get(ref(db, `tournaments/${id}`)));
        const teamPromises = teamIds.map(id => get(ref(db, `teams/${id}`)));

        const [tournamentSnapshots, teamSnapshots] = await Promise.all([
          Promise.all(tournamentPromises),
          Promise.all(teamPromises),
        ]);

        // Crear "mapas" para búsqueda rápida: ID -> Objeto
        const tournamentsMap: Record<string, Tournament> = {};
        tournamentSnapshots.forEach(snap => {
          if (snap.exists()) tournamentsMap[snap.key!] = { id: snap.key!, ...snap.val() };
        });

        const teamsMap: Record<string, Team> = {};
        teamSnapshots.forEach(snap => {
          if (snap.exists()) teamsMap[snap.key!] = { id: snap.key!, ...snap.val() };
        });

        // 4. ENRIQUECER LOS PARTIDOS
        const enriched = rawMatches
          .map((match): EnrichedMatch => ({
            ...match,
            tournamentName: tournamentsMap[match.tournamentId]?.name || 'Torneo Desconocido',
            homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
            homeTeamCrestUrl: teamsMap[match.homeTeamId]?.crestUrl,
            awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
            awayTeamCrestUrl: teamsMap[match.awayTeamId]?.crestUrl,
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
