'use client';

import { useState, useMemo, useEffect } from 'react';
import { Match, EnrichedMatch, Team } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MatchCard } from '@/components/match-card';

interface FixtureViewProps {
    matches?: Match[];
    teamsMap?: Record<string, Team>;
    tournamentName?: string;
    venue?: string;
}

// Estructura de una ronda para la UI
interface DisplayRound {
    title: string;
    matches: EnrichedMatch[];
}

export const FixtureView = ({ matches, teamsMap, tournamentName, venue }: FixtureViewProps) => {
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

    const allDisplayRounds = useMemo(() => {
        if (!matches || !teamsMap) return [];

        // Función para enriquecer los datos de un partido
        const enrichMatch = (match: Match): EnrichedMatch => ({
            ...match,
            tournamentName: tournamentName,
            venue: venue,
            homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
            homeTeamLogo: teamsMap[match.homeTeamId]?.logoUrl,
            awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
            awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl,
        });

        // 1. Agrupar partidos de liga por jornada
        const leagueRoundsMap = matches
            .filter(m => !m.stage)
            .reduce((acc, match) => {
                const round = match.round || 0;
                if (!acc[round]) acc[round] = [];
                acc[round].push(enrichMatch(match));
                return acc;
            }, {} as Record<number, EnrichedMatch[]>);

        const leagueDisplayRounds: DisplayRound[] = Object.keys(leagueRoundsMap)
            .map(Number)
            .sort((a, b) => a - b)
            .map(roundNum => ({
                title: `Jornada ${roundNum}`,
                matches: leagueRoundsMap[roundNum],
            }));

        // 2. Agrupar partidos de playoffs por su fase (stage)
        const playoffRoundsMap = matches
            .filter(m => !!m.stage)
            .reduce((acc, match) => {
                const stage = match.stage || 'Playoffs';
                if (!acc[stage]) acc[stage] = [];
                acc[stage].push(enrichMatch(match));
                return acc;
            }, {} as Record<string, EnrichedMatch[]>);

        // Ordenar las fases de playoffs en el orden correcto
        const stageOrder = ['16vos de Final', 'Octavos de Final', 'Cuartos de Final', 'Semifinales', 'Final'];
        const playoffDisplayRounds: DisplayRound[] = Object.keys(playoffRoundsMap)
            .sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b))
            .map(stageName => ({
                title: stageName,
                matches: playoffRoundsMap[stageName],
            }));

        // 3. Combinar rondas de liga y de playoffs en un solo array
        return [...leagueDisplayRounds, ...playoffDisplayRounds];

    }, [matches, teamsMap, tournamentName, venue]);

    // Ajustar el índice si cambia la cantidad de rondas para evitar errores
    useEffect(() => {
        if (currentRoundIndex >= allDisplayRounds.length) {
            setCurrentRoundIndex(Math.max(0, allDisplayRounds.length - 1));
        }
    }, [allDisplayRounds, currentRoundIndex]);

    const activeRound = allDisplayRounds[currentRoundIndex];
    const totalRounds = allDisplayRounds.length;

    if (!matches || matches.length === 0) {
        return <Card className="text-center text-muted-foreground py-6 px-4"><p>El fixture del torneo aún no está disponible.</p></Card>;
    }

    return (
        <div className="space-y-4">
            {totalRounds > 1 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setCurrentRoundIndex(i => i - 1)}
                        disabled={currentRoundIndex <= 0}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="text-center">
                        <h3 className="font-bold text-base">{activeRound?.title || 'Fixture'}</h3>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setCurrentRoundIndex(i => i + 1)}
                        disabled={currentRoundIndex >= totalRounds - 1}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}

            <div className="space-y-3">
                {activeRound?.matches && activeRound.matches.length > 0 ? (
                    activeRound.matches.map(match => (
                        <MatchCard key={match.id} match={match} useBottomAccent={true} />
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-4">No hay partidos para esta ronda.</p>
                )}
            </div>
        </div>
    );
};
