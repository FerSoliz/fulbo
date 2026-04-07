
'use client';

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { getUpcomingMatchesForTeam, getMultipleTeams, getMultipleTournaments } from '@/lib/firebase/db';
// MODIFICADO: Se importa el tipo centralizado
import { EnrichedMatch, Match } from '@/lib/types';

export type { EnrichedMatch } from '@/lib/types';

// ELIMINADO: La definición local de EnrichedMatch ya no es necesaria.

export const useUpcomingMatches = (teamId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<EnrichedMatch[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      setUpcomingMatches([]);
      return;
    }

    const fetchAndEnrichMatches = async () => {
      setLoading(true);
      try {
        const rawMatches = await getUpcomingMatchesForTeam(teamId);
        if (rawMatches.length === 0) {
          setUpcomingMatches([]);
          setLoading(false);
          return;
        }

        const tournamentIds = [...new Set(rawMatches.map(m => m.tournamentId).filter(Boolean))];
        const teamIds = [...new Set(rawMatches.flatMap(m => [m.homeTeamId, m.awayTeamId]).filter(Boolean))];

        const [tournamentsMap, teamsMap] = await Promise.all([
          getMultipleTournaments(tournamentIds),
          getMultipleTeams(teamIds),
        ]);

        const enriched = rawMatches.map((match): EnrichedMatch => {
            const tournament = tournamentsMap[match.tournamentId];
            return {
                ...match,
                details: match.details, // MODIFICADO: Se asegura que `details` se propague
                tournamentName: tournament?.name || 'Torneo Desconocido',
                venue: tournament?.venue,
                homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
                awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
                homeTeamLogo: teamsMap[match.homeTeamId]?.logoUrl || '', 
                awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl || '',
            };
        });

        setUpcomingMatches(enriched);

      } catch (error) {
        console.error("[useUpcomingMatches] Error fetching upcoming matches:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de los próximos partidos.",
          variant: "destructive",
        });
        setUpcomingMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndEnrichMatches();
  }, [teamId, toast]);

  return { upcomingMatches, loading };
};
