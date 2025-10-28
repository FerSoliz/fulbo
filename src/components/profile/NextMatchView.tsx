'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnrichedMatch } from '@/hooks/use-upcoming-matches';
import { Loader2, X, CalendarX } from 'lucide-react';
import { MatchCard } from '@/components/match-card'; // Importa la tarjeta centralizada

// --- Interfaces y Tipos ---

interface NextMatchViewProps {
  onClose: () => void;
  upcomingMatches: EnrichedMatch[];
  loadingMatches: boolean;
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
          <CalendarX className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-primary" />
          <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Sin Partidos Pendientes</h3>
          <p className="mt-2 text-sm sm:text-base">Actualmente, no hay partidos programados para este equipo.</p>
        </div>
      );
    }

    return (
        <div className="p-1 sm:p-2">
            <h2 className="text-xl sm:text-2xl font-bold text-center my-3 sm:my-4 text-card-foreground">Próximos Partidos</h2>
            <div className="space-y-2 sm:space-y-3">
              {upcomingMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
              ))}
            </div>
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
