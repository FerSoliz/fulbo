'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getUpcomingMatchesForTeam } from '@/lib/firebase/db';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile, Match } from '@/lib/types';
import { Loader2, X, CalendarClock, CalendarX, Trophy, Users, MapPin, ShieldQuestion } from 'lucide-react';
import AnimatedTeamLogo from '@/components/AnimatedTeamLogo';
import { Separator } from '@/components/ui/separator';

// --- Interfaces y Tipos ---

interface NextMatchViewProps {
  profileUser: UserProfile;
  onClose: () => void;
}

// El objeto de partido "enriquecido" que contendrá toda la información necesaria para renderizar
interface EnrichedMatch extends Match {
  tournamentName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
}

// --- Componente de Tarjeta de Partido Individual ---

const UpcomingMatchCard = ({ match }: { match: EnrichedMatch }) => {
    const formattedDateTime = useMemo(() => {
        if (!match.details?.date) return "Fecha a confirmar";
        try {
            const matchDate = new Date(match.details.date);
            if (isNaN(matchDate.getTime())) return "Fecha inválida";
            
            const date = matchDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
            const time = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            return `${date.charAt(0).toUpperCase() + date.slice(1)} - ${time} hs`;
        } catch {
            return "Fecha a confirmar";
        }
    }, [match.details?.date]);

    return (
        <Card className="w-full bg-card/50 shadow-md mb-6 last:mb-0">
            <CardHeader className="text-center pt-5 pb-3">
                <Trophy className="mx-auto h-6 w-6 text-amber-400 mb-1.5" />
                <CardTitle className="text-lg font-semibold tracking-tight truncate">{match.tournamentName}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5">
                <div className="flex items-center justify-around my-2">
                    <div className="flex flex-col items-center w-2/5 text-center">
                        <AnimatedTeamLogo logoUrl={match.homeTeamLogo} name={match.homeTeamName} />
                        <p className="mt-2 text-base font-bold truncate">{match.homeTeamName}</p>
                    </div>
                    <div className="text-3xl font-extrabold text-muted-foreground/40">VS</div>
                    <div className="flex flex-col items-center w-2/5 text-center">
                        <AnimatedTeamLogo logoUrl={match.awayTeamLogo} name={match.awayTeamName} />
                        <p className="mt-2 text-base font-bold truncate">{match.awayTeamName}</p>
                    </div>
                </div>
                <Separator className="my-4 bg-border/40" />
                <div className="space-y-3 text-muted-foreground text-sm">
                   <div className="flex items-start gap-3.5">
                        <CalendarClock className="h-5 w-5 mt-px text-primary/80 shrink-0" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-card-foreground/90">Fecha y Hora</span>
                            <span>{formattedDateTime}</span>
                        </div>
                    </div>
                    {match.details?.field && (
                        <div className="flex items-start gap-3.5">
                            <MapPin className="h-5 w-5 mt-px text-primary/80 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-semibold text-card-foreground/90">Lugar</span>
                                <span>{match.details.field}</span>
                            </div>
                        </div>
                    )}
                    {match.details?.round && (
                        <div className="flex items-start gap-3.5">
                            <Users className="h-5 w-5 mt-px text-primary/80 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-semibold text-card-foreground/90">Jornada</span>
                                <span>{match.details.round}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// --- Componente Principal del Modal ---

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 30, scale: 0.98 } };

export const NextMatchView = ({ profileUser, onClose }: NextMatchViewProps) => {
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<EnrichedMatch[]>([]);
  const { toast } = useToast();

  const teamId = profileUser.team?.id;

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchAndEnrichMatches = async () => {
      setLoading(true);
      try {
        // 1. Obtener todos los partidos pendientes
        const rawMatches = await getUpcomingMatchesForTeam(teamId);
        if (rawMatches.length === 0) {
          setUpcomingMatches([]);
          return; 
        }

        // 2. Recolectar IDs únicos para optimizar las consultas
        const tournamentIds = [...new Set(rawMatches.map(m => m.tournamentId).filter(Boolean))];
        const teamIds = [...new Set(rawMatches.flatMap(m => [m.homeTeamId, m.awayTeamId]).filter(Boolean))];

        // 3. Realizar consultas a la base de datos en paralelo
        const [tournamentsSnap, teamsSnap] = await Promise.all([
            Promise.all(tournamentIds.map(id => get(ref(db, `tournaments/${id}`)))),
            Promise.all(teamIds.map(id => get(ref(db, `teams/${id}`))))
        ]);

        // 4. Crear mapas de búsqueda para un acceso rápido y eficiente
        const tournamentsMap = new Map(tournamentsSnap.map(snap => [snap.key, snap.val()]));
        const teamsMap = new Map(teamsSnap.map(snap => [snap.key, snap.val()]));

        // 5. "Enriquecer" los datos de cada partido
        const enriched = rawMatches.map(match => {
            const tournament = tournamentsMap.get(match.tournamentId);
            const homeTeam = teamsMap.get(match.homeTeamId);
            const awayTeam = teamsMap.get(match.awayTeamId);
            return {
                ...match,
                tournamentName: tournament?.name || 'Torneo Desconocido',
                homeTeamName: homeTeam?.name || 'Equipo Local',
                awayTeamName: awayTeam?.name || 'Equipo Visitante',
                homeTeamLogo: homeTeam?.logoUrl || '', 
                awayTeamLogo: awayTeam?.logoUrl || '',
            };
        });

        setUpcomingMatches(enriched);

      } catch (error) {
        console.error("[NextMatchView] Error al buscar próximos partidos:", error);
        toast({ title: "Error", description: "No se pudo cargar la información de los próximos partidos.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchAndEnrichMatches();
  }, [teamId, toast]);

  const renderContent = () => {
    if (loading) {
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
        <div className="p-2 sm:p-4">
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
