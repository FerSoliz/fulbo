'use client';

import { useState, useEffect, useMemo } from 'react';
import { EnrichedMatch, Match } from '@/lib/types';
import { getMultipleTeams } from '@/lib/firebase/db';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { MatchCard } from '@/components/match-card'; // Importa la nueva tarjeta centralizada

// --- Componente Principal de la Vista del Fixture ---
export const FixtureView = ({ matches }: { matches?: Match[] }) => {
    const [enrichedMatches, setEnrichedMatches] = useState<EnrichedMatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!matches || matches.length === 0) {
            setIsLoading(false);
            return;
        }

        const enrichData = async () => {
            setIsLoading(true);
            try {
                const allTeamIds = [...new Set(matches.flatMap(m => [m.homeTeamId, m.awayTeamId]))];
                const teamsMap = await getMultipleTeams(allTeamIds);

                const enriched = matches.map((match): EnrichedMatch => ({
                    ...match,
                    tournamentName: '', // No es necesario en este contexto
                    homeTeamName: teamsMap[match.homeTeamId]?.name || 'Equipo Local',
                    homeTeamLogo: teamsMap[match.homeTeamId]?.logoUrl,
                    awayTeamName: teamsMap[match.awayTeamId]?.name || 'Equipo Visitante',
                    awayTeamLogo: teamsMap[match.awayTeamId]?.logoUrl,
                }));

                setEnrichedMatches(enriched);
            } catch (error) {
                console.error("[FixtureView] Error enriqueciendo partidos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        enrichData();
    }, [matches]);

    const groupedMatches = useMemo(() => {
        if (enrichedMatches.length === 0) return {};
        return enrichedMatches.reduce((acc, match) => {
            const matchDate = match.details?.date || 'Sin Fecha';
            if (!acc[matchDate]) {
                acc[matchDate] = [];
            }
            acc[matchDate].push(match);
            return acc;
        }, {} as Record<string, EnrichedMatch[]>);
    }, [enrichedMatches]);

    if (isLoading) {
        return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!matches || matches.length === 0) {
        return <Card className="text-center text-muted-foreground py-6 px-4"><p>El fixture del torneo aún no está disponible.</p></Card>;
    }

    const sortedDates = Object.keys(groupedMatches).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return (
        <div className="space-y-6">
            {sortedDates.map((date, index) => (
                <div key={date}>
                    <div className="flex items-center gap-3 mb-3">
                         <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider whitespace-nowrap">
                             {date === 'Sin Fecha' ? 'A Confirmar' : `Jornada ${index + 1}`}
                         </h3>
                         <Separator className="flex-grow" />
                    </div>
                    <div className="space-y-3">
                        {groupedMatches[date].map(match => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
