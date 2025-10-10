'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMatchHistory, EnrichedMatch } from '@/hooks/useMatchHistory';
import { UserProfile } from '@/lib/types';
import { Loader2, X, History, Trophy, UserX, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// --- PROPS ---
interface MatchHistoryViewProps {
  profileUser: UserProfile;
  onClose: () => void;
}

// --- ANIMACIONES ---
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }, exit: { opacity: 0, y: 30 } };


// --- Componente de Tarjeta de Historial (Clon del diseño de Próximos Partidos) ---
const HistoryMatchCard = ({ match, currentUserTeamId }: { match: EnrichedMatch, currentUserTeamId: string }) => {
    const { resultColor, resultText } = useMemo(() => {
        if (match.status !== 'finished' || !match.result || typeof match.result.home !== 'number' || typeof match.result.away !== 'number') {
            return { resultColor: 'border-gray-400/60', resultText: '-' };
        }

        const homeScore = match.result.home;
        const awayScore = match.result.away;
        const isHome = match.homeTeamId === currentUserTeamId;

        let color = 'border-yellow-500/60'; // Empate por defecto
        if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
            color = 'border-green-500/60'; // Victoria
        } else if ((isHome && homeScore < awayScore) || (!isHome && awayScore < homeScore)) {
            color = 'border-red-500/60'; // Derrota
        }

        return {
            resultColor: color,
            resultText: `${homeScore} - ${awayScore}`
        };
    }, [match, currentUserTeamId]);

    const { month, day } = useMemo(() => {
        if (!match.details?.date) return { month: null, day: null };
        try {
            const matchDate = new Date(match.details.date);
            if (isNaN(matchDate.getTime())) return { month: null, day: null };
            return {
                month: matchDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.',''),
                day: matchDate.getDate().toString(),
            };
        } catch { return { month: null, day: null }; }
    }, [match.details?.date]);

    return (
        <Card className={`w-full bg-card/70 shadow-sm mb-3 last:mb-0 border-l-4 ${resultColor} rounded-lg overflow-hidden`}>
            <div className="flex items-stretch">
                {/* Bloque de Fecha y Resultado */}
                <div className="flex flex-col items-center justify-center bg-primary/10 px-3 py-2 text-center text-primary">
                    <span className="text-xs font-semibold uppercase tracking-wider capitalize">{month || '-'}</span>
                    <span className="text-2xl font-bold leading-tight">{day || '-'}</span>
                    <span className="text-sm font-bold bg-card/80 text-card-foreground rounded-full px-2 py-0.5 -mb-1 mt-1">{resultText}</span>
                </div>

                {/* Bloque de Información del Partido (Idéntico a NextMatchView) */}
                <div className="flex-1 p-3">
                    <div className="flex items-center gap-2">
                        <img src={match.homeTeamLogo || '/assets/images/default-team-logo.png'} alt={match.homeTeamName} className="h-5 w-5 rounded-full object-cover border border-border" />
                        <span className="text-sm font-semibold text-card-foreground truncate flex-1">{match.homeTeamName}</span>
                        <span className="text-xs font-bold text-muted-foreground/80 mx-1">vs</span>
                        <span className="text-sm font-semibold text-card-foreground truncate flex-1 text-right">{match.awayTeamName}</span>
                        <img src={match.awayTeamLogo || '/assets/images/default-team-logo.png'} alt={match.awayTeamName} className="h-5 w-5 rounded-full object-cover border border-border" />
                    </div>
                    
                    <Separator className="my-1.5 bg-border/40" />
                    
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

/**
 * Vista que muestra el historial de partidos con un diseño unificado y consistente.
 */
export const MatchHistoryView = ({ profileUser, onClose }: MatchHistoryViewProps) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { matches, tournaments, loading } = useMatchHistory(profileUser.team?.id);
  const teamId = profileUser.team?.id;

  const filteredMatches = activeTab === 'all'
    ? matches
    : matches.filter(match => match.tournamentId === activeTab);

  const renderContent = () => {
    if (loading) {
      return <div className="h-96 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    if (!teamId) {
      return (
        <div className="text-center h-full flex flex-col justify-center items-center text-muted-foreground p-8">
          <UserX className="w-16 h-16 mb-4"/>
          <h3 className="text-xl font-bold text-card-foreground">Jugador Libre</h3>
          <p>Este jugador no pertenece a un equipo y no tiene historial.</p>
        </div>
      );
    }
    if (matches.length === 0) {
      return (
        <div className="text-center h-full flex flex-col justify-center items-center text-muted-foreground p-8">
          <History className="w-20 h-20 mb-4 text-primary"/>
          <h3 className="text-2xl font-bold text-card-foreground">Sin Partidos Jugados</h3>
          <p className="mt-2">Este equipo aún no ha disputado ningún partido.</p>
        </div>
      );
    }

    return (
      <>
        <CardHeader className="text-center pt-6 pb-4">
            <h2 className="text-2xl font-bold text-card-foreground">Historial de Partidos</h2>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col p-2 sm:p-4 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow min-h-0">
            <TabsList className="grid w-full grid-cols-[auto_1fr] md:inline-flex mb-4 overflow-x-auto justify-start">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {tournaments.map(tournament => (<TabsTrigger key={tournament.id} value={tournament.id}>{tournament.name}</TabsTrigger>))}
            </TabsList>
            <div className="flex-grow overflow-y-auto px-1 sm:px-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
              <TabsContent value={activeTab} asChild>
                <div>
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match: EnrichedMatch) => (
                      <HistoryMatchCard key={match.id} match={match} currentUserTeamId={teamId!} />
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Trophy className="w-10 h-10 mx-auto mb-3"/><p>No hay partidos registrados en este torneo.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-md bg-card rounded-2xl border shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal"><X className="h-5 w-5" /></Button>
        <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
        </div>
        <CardFooter className='bg-card/95 backdrop-blur-sm border-t mt-auto py-4 px-6'>
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </CardFooter>
      </motion.div>
    </motion.div>
  );
};
