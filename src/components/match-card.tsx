'use client';

import { useMemo } from 'react';
import type { EnrichedMatch } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Youtube } from 'lucide-react';
import Link from 'next/link';

// --- PROPS ---
interface MatchCardProps {
  match: EnrichedMatch;
  highlightTeamId?: string; // Opcional: resalta el resultado para este equipo.
}

// --- COMPONENTE DEPRECADO (COMPATIBILIDAD) ---
/**
 * @deprecated Usar MatchCard en su lugar.
 */
export const TournamentMatchCard = ({ match }: { match: EnrichedMatch }) => <MatchCard match={match} />;

// --- COMPONENTE PRINCIPAL (MOBILE-FIRST) ---
export const MatchCard = ({ match, highlightTeamId }: MatchCardProps) => {

    // --- MEMOS PARA DATOS CALCULADOS ---
    const { shortDate, time } = useMemo(() => {
        const dateStr = match.details?.date;
        if (!dateStr) return { shortDate: null, time: null };
        try {
            const [year, monthNum, dayNum] = dateStr.split('-').map(Number);
            const safeDate = new Date(Date.UTC(year, monthNum - 1, dayNum));
            return {
                shortDate: safeDate.toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }).replace('.', ''),
                time: match.details?.time ? `${match.details.time} hs` : '-'
            };
        } catch {
            return { shortDate: 'Fecha inválida', time: '-' };
        }
    }, [match.details]);

    const { isFinished, resultColor } = useMemo(() => {
        const finished = match.status === 'finished' && match.result && typeof match.result.home === 'number' && typeof match.result.away === 'number';
        let color = 'border-transparent';
        if (finished && highlightTeamId) {
            const { home, away } = match.result!;
            const isHome = match.homeTeamId === highlightTeamId;
            if ((isHome && home > away) || (!isHome && away > home)) color = 'border-green-500/70'; // Victoria
            else if ((isHome && home < away) || (!isHome && away < home)) color = 'border-red-500/70'; // Derrota
            else color = 'border-yellow-500/70'; // Empate
        }
        return { isFinished: finished, resultColor: color };
    }, [match, highlightTeamId]);

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <Card className={`w-full bg-secondary shadow-md overflow-hidden border-l-4 ${resultColor} hover:border-accent-blue transition-colors duration-200 rounded-none`}>
            <div className="flex justify-between p-2 sm:p-3 min-h-[75px]">
                
                {/* Bloque 1: Fecha y Hora */}
                <div className="flex flex-col justify-end text-left w-[22%] sm:w-[15%]">
                    <span className="text-accent-red font-bold uppercase text-[8px] sm:text-[10px] tracking-wider">{shortDate || 'A Confirmar'}</span>
                    <span className="text-white font-bold text-xs sm:text-sm">{time}</span>
                </div>

                {/* Bloque 2: Enfrentamiento (auto-centrado) */}
                <div className="flex-1 flex items-center justify-center px-1 w-[56%] sm:w-[70%]">
                    {/* Equipo Local */}
                    <div className="flex items-center gap-2 justify-end flex-1 truncate">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">{match.homeTeamName}</span>
                        <img src={match.homeTeamLogo || '/escudito-river.png'} alt={match.homeTeamName} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover border border-border" />
                    </div>

                    {/* Marcador o VS */}
                    <div className="mx-2 text-center">
                        {isFinished ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg sm:text-2xl font-black text-white">{match.result?.home}</span>
                                <span className="text-sm sm:text-lg font-bold text-muted-foreground">-</span>
                                <span className="text-lg sm:text-2xl font-black text-white">{match.result?.away}</span>
                            </div>
                        ) : (
                            <span className="text-base sm:text-xl font-extrabold text-muted-foreground/80">VS</span>
                        )}
                    </div>

                    {/* Equipo Visitante */}
                    <div className="flex items-center gap-2 justify-start flex-1 truncate">
                        <img src={match.awayTeamLogo || '/escudito-de-boca.png'} alt={match.awayTeamName} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover border border-border" />
                        <span className="text-xs sm:text-sm font-bold text-white truncate">{match.awayTeamName}</span>
                    </div>
                </div>

                {/* Bloque 3: Torneo y Media */}
                <div className="flex flex-col justify-end items-end text-right w-[22%] sm:w-[15%] gap-0.5">
                    {match.details?.youtube_url ? (
                         <Link href={match.details.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="Ver resumen en YouTube">
                            <Youtube className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 hover:scale-110 transition-transform"/>
                         </Link>
                    ) : (
                        <Youtube className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/30"/> // Ícono desactivado
                    )}
                    {match.tournamentName && (
                        <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold uppercase truncate px-1">{match.tournamentName}</span>
                    )}
                </div>

            </div>
        </Card>
    );
};
