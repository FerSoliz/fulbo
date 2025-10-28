'use client';

import { useState, useMemo } from 'react';
// MODIFICADO: Se importa el tipo centralizado EnrichedMatch
import { Match, EnrichedMatch, Team } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MatchCard } from '@/components/match-card';

// ELIMINADO: La interfaz local ya no es necesaria.

// --- Propiedades del Componente ---
interface FixtureViewProps {
    matches?: Match[];
    teamsMap?: Record<string, Team>;
    tournamentName?: string;
    venue?: string;
}

// --- Componente Principal de la Vista del Fixture ---
export const FixtureView = ({ matches, teamsMap, tournamentName, venue }: FixtureViewProps) => {
    const [currentRound, setCurrentRound] = useState(1);

    const { rounds, totalRounds } = useMemo(() => {
        if (!matches || !teamsMap) return { rounds: {}, totalRounds: 0 };

        // MODIFICADO: El acumulador ahora usa el tipo EnrichedMatch importado.
        const groupedByRound = matches.reduce((acc, match) => {
            const round = match.round || 0;
            if (!acc[round]) {
                acc[round] = [];
            }
            // Se crea un objeto que cumple con la interfaz EnrichedMatch
            acc[round].push({
                ...match,
                tournamentName: tournamentName,
                venue: venue,
                homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
                homeTeamLogo: teamsMap[match.homeTeamId]?.logoUrl,
                awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
                awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl,
                details: match.details, 
            });
            return acc;
        }, {} as Record<number, EnrichedMatch[]>);
        
        const roundKeys = Object.keys(groupedByRound).map(Number).sort((a,b) => a - b);
        const totalRounds = roundKeys.length;

        // Lógica para ajustar la ronda actual si no hay partidos cargados para ella
        if (totalRounds > 0 && !groupedByRound[currentRound]) {
            const firstAvailableRound = roundKeys.find(r => groupedByRound[r]?.length > 0);
            setCurrentRound(firstAvailableRound || roundKeys[0] || 1);
        }

        return { rounds: groupedByRound, totalRounds: totalRounds };
    }, [matches, teamsMap, tournamentName, venue, currentRound]);

    const matchesForCurrentRound = rounds[currentRound] || [];

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
                        onClick={() => setCurrentRound(r => r - 1)}
                        disabled={currentRound <= 1}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="text-center">
                        <h3 className="font-bold text-base">Jornada {currentRound}</h3>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setCurrentRound(r => r + 1)}
                        disabled={currentRound >= totalRounds}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}

            <div className="space-y-3">
                {matchesForCurrentRound.length > 0 ? (
                    matchesForCurrentRound.map(match => (
                        // MODIFICADO: Se ha eliminado el `as any`. ¡Código limpio y seguro!
                        <MatchCard key={match.id} match={match} useBottomAccent={true} />
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-4">No hay partidos para esta jornada.</p>
                )}
            </div>
        </div>
    );
};
