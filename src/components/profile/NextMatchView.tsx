'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnrichedMatch } from '@/hooks/use-upcoming-matches'; // Importamos el tipo
import { Loader2, X, CalendarX, Trophy, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// --- Interfaces y Tipos ---

interface NextMatchViewProps {
  onClose: () => void;
  upcomingMatches: EnrichedMatch[];
  loadingMatches: boolean;
}

// --- Componente de Tarjeta de Partido Individual ---

const UpcomingMatchCard = ({ match }: { match: EnrichedMatch }) => {
    const { time, month, day } = useMemo(() => {
        if (!match.details?.date) return { time: null, month: null, day: null };
        try {
            const matchDate = new Date(match.details.date);
            if (isNaN(matchDate.getTime())) return { time: null, month: null, day: null };

            return {
                time: matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
                month: matchDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.',''),
                day: matchDate.getDate().toString(),
            };
        } catch {
            return { time: null, month: null, day: null };
        }
    }, [match.details?.date]);

    return (
        <Card className="w-full bg-card/70 shadow-sm mb-3 last:mb-0 border-l-4 border-primary/70 rounded-lg overflow-hidden">
            <div className="flex items-stretch">
                {/* Bloque de Fecha */}
                <div className="flex flex-col items-center justify-center bg-primary/10 px-3.5 py-2 text-center text-primary">
                    <span className="text-xs font-semibold uppercase tracking-wider capitalize">{month || '-'}</span>
                    <span className="text-2xl font-bold leading-tight">{day || '-'}</span>
                    <span className="text-xs font-medium">{time ? `${time}hs` : ''}</span>
                </div>

                {/* Bloque de Información del Partido */}
                <div className="flex-1 p-3">
                    {/* Equipos */}
                    <div className="flex items-center gap-2">
                        <img src={match.homeTeamLogo || '/assets/images/default-team-logo.png'} alt={match.homeTeamName} className="h-5 w-5 rounded-full object-cover border border-border" />
                        <span className="text-sm font-semibold text-card-foreground truncate flex-1">{match.homeTeamName}</span>
                        <span className="text-xs font-bold text-muted-foreground/80 mx-1">vs</span>
                        <span className="text-sm font-semibold text-card-foreground truncate flex-1 text-right">{match.awayTeamName}</span>
                        <img src={match.awayTeamLogo || '/assets/images/default-team-logo.png'} alt={match.awayTeamName} className="h-5 w-5 rounded-full object-cover border border-border" />
                    </div>
                    
                    <Separator className="my-1.5 bg-border/40" />
                    
                    {/* Detalles */}
                    <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                            <Trophy className="h-3 w-3 shrink-0 opacity-80" />
                            <span className="truncate">{match.tournamentName}</span>
                        </div>
                        {match.details?.field && (
                            <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="h-3 w-3 shrink-0 opacity-80" />
                                <span className="truncate">{match.details.field}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

// --- Componente Principal del Modal ---

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 30, scale: 0.98 } };

export const NextMatchView = ({ onClose, upcomingMatches, loadingMatches }: NextMatchViewProps) => {

  const renderContent = () => {
    if (loadingMatches) {
      return (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (upcomingMatches.length === 0) {
      return (
        <div className="text-center h-96 flex flex-col justify-center items-center text-muted-foreground p-8">
          <CalendarX className="w-20 h-20 mb-4 text-primary" />
          <h3 className="text-2xl font-bold text-card-foreground">Sin Partidos Pendientes</h3>
          <p className="mt-2">Actualmente, no hay partidos programados para este equipo.</p>
        </div>
      );
    }

    return (
        <div className="p-1 sm:p-2">
            <h2 className="text-2xl font-bold text-center mb-4 text-card-foreground">Próximos Partidos</h2>
            {upcomingMatches.map(match => (
                <UpcomingMatchCard key={match.id} match={match} />
            ))}
        </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-md bg-card rounded-2xl border shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <AnimatePresence mode="wait">
            {renderContent()}
            </AnimatePresence>
        </div>

        <Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Cerrar modal">
          <X className="h-5 w-5" />
        </Button>

        <CardFooter className='bg-card/95 backdrop-blur-sm border-t mt-auto py-4 px-6'>
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </CardFooter>
      </motion.div>
    </motion.div>
  );
};
