'use client';

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { getUpcomingMatchesForTeam } from '@/lib/firebase/db';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match } from '@/lib/types';

// Interfaz para el partido "enriquecido" que devolverá el hook
export interface EnrichedMatch extends Match {
  tournamentName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
}

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

        const [tournamentsSnap, teamsSnap] = await Promise.all([
            Promise.all(tournamentIds.map(id => get(ref(db, `tournaments/${id}`)))),
            Promise.all(teamIds.map(id => get(ref(db, `teams/${id}`))))
        ]);

        const tournamentsMap = new Map(tournamentsSnap.map(snap => [snap.key, snap.val()]));
        const teamsMap = new Map(teamsSnap.map(snap => [snap.key, snap.val()]));

        const enriched = rawMatches.map(match => {
            const tournament = tournamentsMap.get(match.tournamentId);
            const homeTeam = teamsMap.get(match.homeTeamId);
            const awayTeam = teamsMap.get(match.awayTeamId);
            return {
                ...match,
                tournamentName: tournament?.name || 'Torneo Desconocido',
                homeTeamName: homeTeam?.name || 'Equipo Local',
                awayTeamName: awayTeam?.name || 'Equipo Visitante',
                homeTeamLogo: homeTeam?.logoUrl || '', 
                awayTeamLogo: awayTeam?.logoUrl || '',
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
