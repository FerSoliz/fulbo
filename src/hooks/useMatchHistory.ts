'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMatchHistoryForTeam, getMultipleTeams, getMultipleTournaments } from '@/lib/firebase/db';
import { Match, Tournament, Team, EnrichedMatch } from '@/lib/types';

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
        const rawMatchesObject = await getMatchHistoryForTeam(teamId);
        const rawMatchesArray = Object.values(rawMatchesObject);

        if (rawMatchesArray.length === 0) {
          setMatches([]);
          setTournaments([]);
          setLoading(false);
          return;
        }

        const finishedMatches = rawMatchesArray.filter(match => match.status === 'finished');

        if (finishedMatches.length === 0) {
            setMatches([]);
            // Aún queremos mostrar los torneos en el filtro aunque no haya partidos terminados
            const tournamentIds = [...new Set(rawMatchesArray.map(m => m.tournamentId))];
            const tournamentsMap = await getMultipleTournaments(tournamentIds);
            setTournaments(Object.values(tournamentsMap));
            setLoading(false);
            return;
        }

        const tournamentIds = [...new Set(finishedMatches.map(m => m.tournamentId))];
        
        const allTeamIds = finishedMatches.reduce((ids, match) => {
          ids.push(match.homeTeamId, match.awayTeamId);
          return ids;
        }, [] as string[]);
        const teamIds = [...new Set(allTeamIds)];

        const [tournamentsMap, teamsMap] = await Promise.all([
          getMultipleTournaments(tournamentIds),
          getMultipleTeams(teamIds),
        ]);

        const enriched = finishedMatches
          .map((match): EnrichedMatch => ({
            ...match,
            tournamentName: tournamentsMap[match.tournamentId]?.name || 'Torneo Desconocido',
            homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
            homeTeamLogo: teamsMap[match.homeTeamId]?.logoUrl,
            awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
            awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl,
          }))
          .sort((a, b) => {
            // Asumimos que date y details.time existen para partidos finalizados
            const dateTimeA = new Date(`${a.details?.date}T${a.details?.time || '00:00'}`).getTime();
            const dateTimeB = new Date(`${b.details?.date}T${b.details?.time || '00:00'}`).getTime();
            return dateTimeB - dateTimeA;
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
