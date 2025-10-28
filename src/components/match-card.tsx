'use client';

import { useState, useMemo } from 'react';
import type { EnrichedMatch } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

// --- FUNCIÓN AUXILIAR PARA VIDEO ---
const getEmbedUrl = (url: string | undefined): string => {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        // Maneja URLs cortas de YouTube (youtu.be/VIDEO_ID)
        if (urlObj.hostname === 'youtu.be') {
            return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
        }
        // Maneja URLs estándar de YouTube (youtube.com/watch?v=VIDEO_ID)
        if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            const videoId = urlObj.searchParams.get('v');
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }
    } catch (e) {
        console.error("URL de video inválida:", e);
        return ''; // Retorna string vacío si la URL es inválida
    }
    // Si no es una URL de YouTube conocida, no se puede incrustar
    return '';
};


// --- COMPONENTE PRINCIPAL (MOBILE-FIRST) ---
export const MatchCard = ({ match, highlightTeamId, useBottomAccent = false }: MatchCardProps) => {

    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const venue = match.venue || 'Sede a confirmar';
    const embedUrl = useMemo(() => getEmbedUrl(match.details?.videoUrl), [match.details?.videoUrl]);

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
                        {embedUrl ? (
                            <>
                                <button onClick={() => setIsModalOpen(true)} aria-label="Ver resumen del partido">
                                    <Youtube className="h-5 w-5 text-red-600 hover:scale-110 transition-transform cursor-pointer"/>
                                </button>
                                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                    <DialogContent className="max-w-4xl p-0 bg-black border-accent-red">
                                        <div className="aspect-video">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={embedUrl}
                                                title="Reproductor de video de YouTube"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </>
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
