'use client';

import { useState, useEffect, useMemo } from 'react';
import { EnrichedMatch, Match } from '@/lib/types';
import { getMultipleTeams } from '@/lib/firebase/db';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// --- Componente de la Tarjeta de Partido (Estilo Unificado) ---
const TournamentMatchCard = ({ match }: { match: EnrichedMatch }) => {

    const { month, day, time } = useMemo(() => {
        const dateStr = match.details?.date;
        const timeStr = match.details?.time;
        if (!dateStr) return { month: null, day: null, time: null };
        try {
            const [year, monthNum, dayNum] = dateStr.split('-').map(Number);
            const safeDate = new Date(Date.UTC(year, monthNum - 1, dayNum));
            return {
                month: safeDate.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', ''),
                day: safeDate.getUTCDate().toString(),
                time: timeStr || null
            };
        } catch { return { month: null, day: null, time: null }; }
    }, [match.details]);

    const resultText = useMemo(() => {
        if (match.status !== 'finished' || !match.result) return time ? `${time} hs` : 'A confirmar';
        return `${match.result.home} - ${match.result.away}`;
    }, [match.status, match.result, time]);

    return (
        <Card className="w-full bg-card/70 shadow-sm rounded-lg overflow-hidden border-l-4 border-transparent">
            <div className="flex items-stretch">
                {/* Bloque de Fecha y Hora/Resultado */}
                <div className="flex flex-col items-center justify-center bg-primary/10 px-3.5 py-2 text-center text-primary w-[75px] flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wider capitalize">{month || '-'}</span>
                    <span className="text-2xl font-bold leading-tight">{day || '-'}</span>
                    <span className="text-sm font-semibold text-white/90 mt-0.5 whitespace-nowrap">{resultText}</span>
                </div>
                
                {/* Bloque de Información del Partido */}
                <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-center gap-2">
                        <img src={match.homeTeamLogo || '/assets/images/default-team-logo.png'} alt={match.homeTeamName} className="h-5 w-5 rounded-full object-cover border border-border" />
                        <span className="text-sm font-semibold text-card-foreground truncate flex-1">{match.homeTeamName}</span>
                        <span className="text-xs font-bold text-muted-foreground/80 mx-1">vs</span>
                        <span className="text-sm font-semibold text-card-foreground truncate flex-1 text-right">{match.awayTeamName}</span>
                        <img src={match.awayTeamLogo || '/assets/images/default-team-logo.png'} alt={match.awayTeamName} className="h-5 w-5 rounded-full object-cover border border-border" />
                    </div>
                </div>
            </div>
        </Card>
    );
}

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
                            <TournamentMatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
