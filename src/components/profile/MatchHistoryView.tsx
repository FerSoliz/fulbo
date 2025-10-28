'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMatchHistory, EnrichedMatch } from '@/hooks/useMatchHistory';
import { UserProfile } from '@/lib/types';
import { Loader2, X, History, Trophy, UserX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchCard } from '@/components/match-card';

// --- PROPS ---
interface MatchHistoryViewProps {
  profileUser: UserProfile;
  onClose: () => void;
}

// --- ANIMACIONES ---
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 30, scale: 0.98 } };

// --- COMPONENTE ---
export const MatchHistoryView = ({ profileUser, onClose }: MatchHistoryViewProps) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { matches, tournaments, loading } = useMatchHistory(profileUser.team?.id);
  const teamId = profileUser.team?.id;

  const filteredMatches = activeTab === 'all'
    ? matches
    : matches.filter(match => match.tournamentId === activeTab);

  // --- RENDERIZADO DEL CONTENIDO INTERNO ---
  // Esta función ahora solo se preocupa por QUÉ mostrar, no CÓMO.
  const renderContent = () => {
    if (loading) {
      return (
        <div key="loader" className="h-96 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    if (!teamId) {
      return (
        <div key="no-team" className="text-center h-96 flex flex-col justify-center items-center text-muted-foreground p-8">
          <UserX className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-primary"/>
          <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Jugador Sin Equipo</h3>
          <p className="mt-2 text-sm sm:text-base">Este jugador no pertenece a un equipo y no tiene historial de partidos.</p>
        </div>
      );
    }
    if (matches.length === 0) {
      return (
        <div key="no-matches" className="text-center h-96 flex flex-col justify-center items-center text-muted-foreground p-8">
          <History className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-primary"/>
          <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Sin Partidos Jugados</h3>
          <p className="mt-2 text-sm sm:text-base">Este equipo aún no ha disputado ningún partido.</p>
        </div>
      );
    }

    // Contenido principal con la lista de partidos
    return (
      <div className="p-1 sm:p-2">
        <h2 className="text-xl sm:text-2xl font-bold text-center my-3 sm:my-4 text-card-foreground">Historial de Partidos</h2>
        
        <div className="px-1 sm:px-2 mb-3 sm:mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="Filtrar por torneo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los torneos</SelectItem>
              {tournaments.map(tournament => (
                <SelectItem key={tournament.id} value={tournament.id}>{tournament.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match: EnrichedMatch) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                highlightTeamId={teamId!} 
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center h-full">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3"/>
              <p className="text-sm sm:text-base">No hay partidos para este torneo.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDERIZADO DEL ESQUELETO DEL MODAL ---
  // Estructura idéntica a NextMatchView para consistencia.
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
        className="relative w-full max-w-lg bg-card rounded-none border shadow-xl flex flex-col max-h-[90vh]"
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

        <CardFooter className='bg-card/95 backdrop-blur-sm border-t mt-auto py-3 px-4 sm:py-4 sm:px-6'>
          <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
        </CardFooter>
      </motion.div>
    </motion.div>
  );
};
