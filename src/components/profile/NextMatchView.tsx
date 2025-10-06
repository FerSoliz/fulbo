'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getNextMatchForTeam } from '@/lib/firebase/db';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile, Match } from '@/lib/types';
import { Loader2, X, CalendarClock, CalendarX, Trophy, Users, MapPin } from 'lucide-react';
import AnimatedTeamLogo from '@/components/AnimatedTeamLogo';
import { Separator } from '@/components/ui/separator';

interface NextMatchViewProps {
  profileUser: UserProfile;
  onClose: () => void;
}

interface ExtraMatchData {
  tournamentName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };

export const NextMatchView = ({ profileUser, onClose }: NextMatchViewProps) => {
  const [loading, setLoading] = useState(true);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [extraData, setExtraData] = useState<ExtraMatchData | null>(null);
  const { toast } = useToast();

  const teamId = profileUser.team?.id;

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const fetchNextMatch = async () => {
      setLoading(true);
      try {
        const match = await getNextMatchForTeam(teamId);
        setNextMatch(match);

        if (match) {
          const [tournamentSnap, homeTeamSnap, awayTeamSnap] = await Promise.all([
            get(ref(db, `tournaments/${match.tournamentId}`)),
            get(ref(db, `teams/${match.homeTeamId}`)),
            get(ref(db, `teams/${match.awayTeamId}`)),
          ]);
          
          const homeTeamData = homeTeamSnap.exists() ? homeTeamSnap.val() : {};
          const awayTeamData = awayTeamSnap.exists() ? awayTeamSnap.val() : {};

          setExtraData({
            tournamentName: tournamentSnap.exists() ? tournamentSnap.val().name : 'Torneo Desconocido',
            homeTeamName: homeTeamData.name || 'Equipo Local',
            awayTeamName: awayTeamData.name || 'Equipo Visitante',
            homeTeamLogo: homeTeamData.logoUrl || '/assets/images/default-team-logo.png', 
            awayTeamLogo: awayTeamData.logoUrl || '/assets/images/default-team-logo.png', 
          });
        }
      } catch (error) {
        console.error("[NextMatchView] Error al buscar el próximo partido:", error);
        toast({ title: "Error", description: "No se pudo cargar la información del próximo partido.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchNextMatch();
  }, [teamId, toast]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-96 flex items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!nextMatch) {
      return (
        <div className="text-center h-full flex flex-col justify-center items-center text-muted-foreground p-8">
          <CalendarX className="w-20 h-20 mb-4 text-primary" />
          <h3 className="text-2xl font-bold text-card-foreground">Sin Partidos Pendientes</h3>
          <p className="mt-2">Actualmente, no hay partidos programados para este equipo.</p>
        </div>
      );
    }

    const hasDate = nextMatch.details?.date;
    let formattedDateTime = "Fecha a confirmar";
    if (hasDate) {
      const matchDate = new Date(nextMatch.details!.date);
      if (!isNaN(matchDate.getTime())) {
        const formattedDate = matchDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
        const formattedTime = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
        formattedDateTime = `${formattedDate} - ${formattedTime} hs`;
      }
    }

    return (
        <>
            <CardHeader className="text-center pt-6 pb-4">
                <Trophy className="mx-auto h-7 w-7 text-amber-400 mb-2" />
                <CardTitle className="text-xl font-semibold tracking-tight">{extraData?.tournamentName || '...'}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
                <div className="flex items-center justify-around my-4">
                    <div className="flex flex-col items-center w-2/5 text-center">
                        <AnimatedTeamLogo logoUrl={extraData?.homeTeamLogo || ''} name={extraData?.homeTeamName || ''} />
                        <p className="mt-3 text-lg font-bold truncate">{extraData?.homeTeamName || '...'}</p>
                    </div>
                    <div className="text-4xl font-extrabold text-muted-foreground/50">VS</div>
                    <div className="flex flex-col items-center w-2/5 text-center">
                        <AnimatedTeamLogo logoUrl={extraData?.awayTeamLogo || ''} name={extraData?.awayTeamName || ''} />
                        <p className="mt-3 text-lg font-bold truncate">{extraData?.awayTeamName || '...'}</p>
                    </div>
                </div>
                <Separator className="my-6 bg-border/50" />
                <div className="space-y-4 text-muted-foreground">
                   <div className="flex items-start gap-4">
                        <CalendarClock className="h-5 w-5 mt-0.5 text-primary" />
                        <div className="flex flex-col">
                            <span className="font-bold text-card-foreground">Fecha y Hora</span>
                            <span className="capitalize">{formattedDateTime}</span>
                        </div>
                    </div>
                    {nextMatch.details?.field && (
                        <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                            <div className="flex flex-col">
                                <span className="font-bold text-card-foreground">Lugar</span>
                                <span>{nextMatch.details.field}</span>
                            </div>
                        </div>
                    )}
                    {nextMatch.details?.round && (
                        <div className="flex items-start gap-4">
                            <Users className="h-5 w-5 mt-0.5 text-primary" />
                            <div className="flex flex-col">
                                <span className="font-bold text-card-foreground">Jornada</span>
                                <span>{nextMatch.details.round}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </>
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
        className="relative w-full max-w-md bg-card rounded-2xl border shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
        <Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Cerrar modal">
          <X className="h-5 w-5" />
        </Button>
        <CardFooter className='bg-card pt-4 pb-6 px-6'>
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </CardFooter>
      </motion.div>
    </motion.div>
  );
};
