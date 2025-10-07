'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMatchHistory, EnrichedMatch } from '@/hooks/useMatchHistory'; // ¡Importamos nuestro hook experto!
import { UserProfile } from '@/lib/types';
import { Loader2, X, History, Trophy, UserX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- PROPS ---
interface MatchHistoryViewProps {
  profileUser: UserProfile;
  onClose: () => void;
}

// --- ANIMACIONES ---
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }, exit: { opacity: 0, y: 30 } };

/**
 * Vista que muestra el historial de partidos de un equipo. 
 * Este componente es ahora puramente "presentacional".
 * Toda la lógica de obtención y enriquecimiento de datos está abstraída en el hook `useMatchHistory`.
 */
export const MatchHistoryView = ({ profileUser, onClose }: MatchHistoryViewProps) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  // --- LÓGICA DE DATOS ABSTRAÍDA ---
  // Una sola línea reemplaza todo el useEffect, los estados y la lógica de enriquecimiento.
  const { matches, tournaments, loading } = useMatchHistory(profileUser.team?.id);

  const teamId = profileUser.team?.id;

  // La lógica de filtrado ahora opera sobre los datos limpios del hook.
  const filteredMatches = activeTab === 'all'
    ? matches
    : matches.filter(match => match.tournamentId === activeTab);

  // --- VISTAS CONDICIONALES ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-96 flex items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!teamId) {
       return (
        <div className="text-center h-full flex flex-col justify-center items-center text-muted-foreground p-8">
          <UserX className="w-16 h-16 mb-4"/>
          <h3 className="text-xl font-bold text-card-foreground">Jugador Libre</h3>
          <p>Este jugador no pertenece a un equipo y no tiene un historial de partidos.</p>
        </div>
      );
    }

    if (matches.length === 0) {
        return (
        <div className="text-center h-full flex flex-col justify-center items-center text-muted-foreground">
          <History className="w-12 h-12 mb-4"/>
          <p className="font-semibold text-lg">Sin Partidos</p>
          <p>Este equipo aún no ha disputado ningún partido.</p>
        </div>
      );
    }

    // --- RENDERIZADO PRINCIPAL ---
    // La lógica de la UI permanece, pero ahora es mucho más limpia.
    return (
      <Card className='border-0 bg-transparent flex flex-col h-full'>
        <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal">
          <X className="h-5 w-5" />
        </Button>

        <CardHeader className="text-center items-center pt-10">
          <History className="w-12 h-12 text-primary" />
          <CardTitle className="mt-2 text-2xl font-bold">Historial de Partidos</CardTitle>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col p-4 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
            <TabsList className="grid w-full grid-cols-[auto_1fr] md:inline-flex mb-4 overflow-x-auto justify-start">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {tournaments.map(tournament => (
                <TabsTrigger key={tournament.id} value={tournament.id}>{tournament.name}</TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-grow overflow-y-auto pr-2">
              <TabsContent value={activeTab} asChild>
                <div className="space-y-3">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match: EnrichedMatch) => (
                      <div key={match.id} className="bg-accent p-3 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                          {/* RENDERIZADO SIMPLIFICADO: Ya no necesitamos buscar en maps. */}
                          <p className="font-semibold text-lg">{match.homeTeamName} vs {match.awayTeamName}</p>
                          <p className="text-sm text-muted-foreground">{match.tournamentName} - {match.details?.date ? new Date(match.details.date).toLocaleDateString() : 'Fecha no disponible'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">{match.result?.home ?? '-'} - {match.result?.away ?? '-'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-10 h-10 mx-auto mb-3"/>
                      <p>No hay partidos registrados en este torneo.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className='pt-4'>
          <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
        </CardFooter>
      </Card>
    );
  }

  // La estructura del modal se mantiene igual.
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-2xl bg-card rounded-xl border shadow-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
