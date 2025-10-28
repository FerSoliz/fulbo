'use client';

import { useMemo } from 'react';
import type { EnrichedMatch } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Youtube, MapPin } from 'lucide-react';
import Link from 'next/link';

// --- PROPS ---
interface MatchCardProps {
  match: EnrichedMatch;
  highlightTeamId?: string;
  useBottomAccent?: boolean;
}

// --- COMPONENTE DEPRECADO (COMPATIBILIDAD) ---
/**
 * @deprecated Usar MatchCard en su lugar.
 */
export const TournamentMatchCard = ({ match }: { match: EnrichedMatch }) => <MatchCard match={match} />;


// --- COMPONENTE PRINCIPAL (MOBILE-FIRST) ---
export const MatchCard = ({ match, highlightTeamId, useBottomAccent = false }: MatchCardProps) => {

    // --- MEMOS PARA DATOS CALCULADOS ---
    const { shortDate, time } = useMemo(() => {
        const dateStr = match.details?.date;
        if (!dateStr) return { shortDate: 'A Confirmar', time: null };
        try {
            const [year, monthNum, dayNum] = dateStr.split('-').map(Number);
            const safeDate = new Date(Date.UTC(year, monthNum - 1, dayNum));
            return {
                shortDate: safeDate.toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }).replace('.', ''),
                time: match.details?.time ? `${match.details.time} hs` : null
            };
        } catch {
            return { shortDate: 'Fecha inválida', time: null };
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

    // ¡CORRECCIÓN! Leemos la sede desde la raíz del objeto enriquecido.
    const venue = match.venue || 'Sede a confirmar';

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <Card className={`w-full bg-secondary shadow-lg overflow-hidden border-l-4 ${resultColor} ${useBottomAccent ? 'border-b border-b-accent-red' : ''} transition-colors duration-300 rounded-none`}>
            <div className="flex flex-col p-3 gap-2">

                {/* --- 1. Fila de Metadatos --- */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold uppercase">
                    {match.tournamentId && match.tournamentName ? (
                        <Link href={`/tournament/${match.tournamentId}`} className="hover:text-accent-blue transition-colors truncate pr-2">
                            {match.tournamentName}
                        </Link>
                    ) : (
                        <span className="truncate pr-2">{match.tournamentName || 'Partido Amistoso'}</span>
                    )}

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-accent-red" />
                            <span>{venue}</span>
                        </div>
                        {match.details?.youtube_url ? (
                            <Link href={match.details.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="Ver resumen en YouTube">
                                <Youtube className="h-5 w-5 text-red-600 hover:scale-110 transition-transform"/>
                            </Link>
                        ) : (
                            <Youtube className="h-5 w-5 text-muted-foreground/30" />
                        )}
                    </div>
                </div>

                <Separator className="bg-border-soft" />

                {/* --- 2. Fila de Enfrentamiento --- */}
                <div className="flex items-center justify-between gap-3 min-h-[50px]">
                    {/* Equipo Local */}
                    <div className="flex items-center gap-2 justify-end flex-1 truncate">
                        <span className="text-sm sm:text-base font-bold text-white text-right truncate">{match.homeTeamName}</span>
                        <img src={match.homeTeamLogo || '/escudito-river.png'} alt={match.homeTeamName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-border-soft" />
                    </div>

                    {/* Marcador o Info de Horario */}
                    <div className="text-center">
                        {isFinished ? (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl sm:text-3xl font-black text-white">{match.result?.home}</span>
                                    <span className="text-lg font-bold text-muted-foreground">-</span>
                                    <span className="text-2xl sm:text-3xl font-black text-white">{match.result?.away}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                    {shortDate} {time ? `- ${time}` : ''}
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-accent-red font-bold uppercase text-xs tracking-wider">{shortDate}</span>
                                <span className="text-white font-bold text-sm sm:text-base">{time || 'A conf.'}</span>
                            </div>
                        )}
                    </div>

                    {/* Equipo Visitante */}
                    <div className="flex items-center gap-2 justify-start flex-1 truncate">
                        <img src={match.awayTeamLogo || '/escudito-de-boca.png'} alt={match.awayTeamName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-border-soft" />
                        <span className="text-sm sm:text-base font-bold text-white text-left truncate">{match.awayTeamName}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
