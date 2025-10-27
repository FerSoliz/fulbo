'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMatchHistoryForTeam, getMultipleTeams, getMultipleTournaments } from '@/lib/firebase/db';
import { Match, Tournament, Team } from '@/lib/types';

export interface EnrichedMatch extends Match {
  tournamentName: string;
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamName: string;
  awayTeamLogo?: string;
}

interface UseMatchHistoryReturn {
  matches: EnrichedMatch[];
  tournaments: Tournament[];
  loading: boolean;
  error: Error | null;
}

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
        // 1. Obtener los partidos crudos como un objeto
        const rawMatchesObject = await getMatchHistoryForTeam(teamId);
        const rawMatchesArray = Object.values(rawMatchesObject);

        if (rawMatchesArray.length === 0) {
          setMatches([]);
          setTournaments([]);
          setLoading(false);
          return;
        }

        // 2. Extraer IDs únicos para torneos y equipos
        const tournamentIds = [...new Set(rawMatchesArray.map(m => m.tournamentId))];
        
        // Reemplazo de .flatMap por .reduce para mayor compatibilidad
        const allTeamIds = rawMatchesArray.reduce((ids, match) => {
          ids.push(match.homeTeamId, match.awayTeamId);
          return ids;
        }, [] as string[]);
        const teamIds = [...new Set(allTeamIds)];

        // 3. Obtener los datos de enriquecimiento en paralelo
        const [tournamentsMap, teamsMap] = await Promise.all([
          getMultipleTournaments(tournamentIds),
          getMultipleTeams(teamIds),
        ]);

        // 4. Enriquecer los datos y ordenarlos
        const enriched = rawMatchesArray
          .map((match): EnrichedMatch => ({
            ...match,
            tournamentName: tournamentsMap[match.tournamentId]?.name || 'Torneo Desconocido',
            homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
            homeTeamLogo: teamsMap[match.hometeamId]?.logoUrl,
            awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
            awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl,
          }))
          // Ordenar por fecha, del más nuevo al más antiguo
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

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
