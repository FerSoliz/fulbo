'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getNextMatchForTeam } from '@/lib/firebase/db';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile, Match, Tournament, Team } from '@/lib/types';
import { Loader2, X, CalendarClock, CalendarX, Trophy, Users, MapPin } from 'lucide-react';

interface NextMatchViewProps {
  profileUser: UserProfile;
  onClose: () => void;
}

interface ExtraMatchData {
  tournamentName: string;
  homeTeamName: string;
  awayTeamName: string;
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
          // Enriquecer los datos del partido con nombres
          const [tournamentSnap, homeTeamSnap, awayTeamSnap] = await Promise.all([
            get(ref(db, `tournaments/${match.tournamentId}`)),
            get(ref(db, `teams/${match.homeTeamId}`)),
            get(ref(db, `teams/${match.awayTeamId}`)),
          ]);

          setExtraData({
            tournamentName: tournamentSnap.exists() ? tournamentSnap.val().name : 'Torneo Desconocido',
            homeTeamName: homeTeamSnap.exists() ? homeTeamSnap.val().name : 'Equipo Local',
            awayTeamName: awayTeamSnap.exists() ? awayTeamSnap.val().name : 'Equipo Visitante',
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
        <div className="h-80 flex items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!nextMatch) {
      return (
        <div className="text-center h-full flex flex-col justify-center items-center text-muted-foreground p-8">
          <CalendarX className="w-20 h-20 mb-4 text-primary" />
          <h3 className="text-2xl font-bold text-card-foreground">Sin Partidos Pendientes</h3>
          <p className="mt-2">Este equipo no tiene próximos partidos programados.</p>
        </div>
      );
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Comprobación de la existencia de la fecha del partido.
    const hasDate = nextMatch.details?.date;
    let formattedDateTime = "Fecha a confirmar";

    if (hasDate) {
      const matchDate = new Date(nextMatch.details!.date);
      // Comprobar si la fecha es válida antes de formatear
      if (!isNaN(matchDate.getTime())) {
        const formattedDate = matchDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
        formattedDateTime = `${formattedDate} - ${formattedTime} hs`;
      }
    }
    // --- FIN DE LA CORRECCIÓN ---

    return (
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <CalendarClock className="w-16 h-16 mx-auto text-primary mb-3" />
          <h2 className="text-3xl font-bold">Próximo Partido</h2>
        </div>

        <div className="bg-accent/50 p-6 rounded-xl shadow-inner space-y-5">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{extraData?.homeTeamName || '...'} vs {extraData?.awayTeamName || '...'}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
              <Trophy className="w-4 h-4" /> 
              <span className="font-semibold">{extraData?.tournamentName || 'Cargando torneo...'}</span>
            </div>
          </div>
          
          <div className="space-y-3 text-center sm:text-left">
            <p className="flex items-center justify-center sm:justify-start gap-3">
              <CalendarClock className="w-5 h-5 text-primary" />
              <span className="capitalize font-medium">{formattedDateTime}</span>
            </p>
            {nextMatch.details?.field && (
               <p className="flex items-center justify-center sm:justify-start gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">Cancha: {nextMatch.details.field}</span>
              </p>
            )}
            {nextMatch.details?.round && (
               <p className="flex items-center justify-center sm:justify-start gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Jornada {nextMatch.details.round}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-lg bg-card rounded-2xl border shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
         <Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full" onClick={onClose} aria-label="Cerrar modal">
          <X className="h-5 w-5" />
        </Button>
        <CardFooter className='bg-card pt-4'>
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </CardFooter>
      </motion.div>
    </motion.div>
  );
};
