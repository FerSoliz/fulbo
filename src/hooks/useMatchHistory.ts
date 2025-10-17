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
        const rawMatches = await getMatchHistoryForTeam(teamId);
        if (rawMatches.length === 0) {
          setMatches([]);
          setTournaments([]);
          setLoading(false);
          return;
        }

        const tournamentIds = [...new Set(rawMatches.map(m => m.tournamentId))];
        const teamIds = [...new Set(rawMatches.flatMap(m => [m.homeTeamId, m.awayTeamId]))];

        const [tournamentsMap, teamsMap] = await Promise.all([
          getMultipleTournaments(tournamentIds),
          getMultipleTeams(teamIds),
        ]);

        const enriched = rawMatches
          .map((match): EnrichedMatch => ({
            ...match,
            tournamentName: tournamentsMap[match.tournamentId]?.name || 'Torneo Desconocido',
            homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
            homeTeamLogo: teamsMap[match.homeTeamId]?.logoUrl,
            awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
            awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl,
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
