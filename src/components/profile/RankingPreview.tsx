'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRankingPreview, RankingPlayer } from '@/hooks/useRankingPreview'; // ¡Importamos nuestro hook experto!
import { Loader2, Crown, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- PROPS ---
interface RankingPreviewProps {
  profileUserId: string; 
  onClose: () => void;
}

// --- ANIMACIONES (reutilizadas para consistencia) ---
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } },
  exit: { opacity: 0, y: 30 },
};
const listVariants = { visible: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

/**
 * Vista que muestra un modal con el ranking de jugadores (Top 25 + usuario actual).
 * Este componente es ahora puramente "presentacional".
 * Toda la lógica de obtención y procesamiento del ranking está abstraída en el hook `useRankingPreview`.
 */
export const RankingPreview = ({ profileUserId, onClose }: RankingPreviewProps) => {
  // --- LÓGICA DE DATOS ABSTRAÍDA ---
  // Una sola línea reemplaza todo el useEffect, los estados y la lógica de ranking.
  const { rankingData, loading } = useRankingPreview(profileUserId);

  return (
      <motion.div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
        variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
      >
          <motion.div
            className="relative w-full max-w-lg bg-card rounded-xl border shadow-lg"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
          >
             <AnimatePresence mode="wait">
              {loading ? (
                <div className="h-96 flex items-center justify-center" role="status" aria-live="polite">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <span className="sr-only">Cargando ranking...</span>
                </div>
              ) : (
                <Card className='border-0 bg-transparent'>
                  <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal">
                      <X className="h-5 w-5" />
                  </Button>

                  <CardHeader className="text-center items-center pt-10">
                      <Trophy className="w-12 h-12 text-amber-400" />
                      <CardTitle className="mt-2 text-2xl font-bold">Ranking de Jugadores</CardTitle>
                  </CardHeader>

                  <CardContent className="max-h-[60vh] overflow-y-auto px-2 py-0">
                      {rankingData.length > 0 ? (
                           <motion.div className="space-y-1 p-2" variants={listVariants} initial="hidden" animate="visible">
                              {rankingData.map((player: RankingPlayer) => (
                                  <motion.div key={player.id} variants={itemVariants}>
                                      <Link href={`/profile/${player.id}`}>
                                          {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                                          }
                                          <div 
                                              className={cn(
                                                  "flex items-center gap-4 p-2.5 rounded-lg hover:bg-accent/80 transition-colors cursor-pointer",
                                                  player.id === profileUserId && "bg-accent/70 border-l-4 border-primary"
                                              )}
                                              onClick={onClose}
                                          >
                                              <div className="font-bold text-lg w-8 text-center flex-shrink-0">
                                                  {player.rank === 1 ? <Crown className="w-6 h-6 text-amber-400 mx-auto" /> : player.rank}
                                              </div>
                                              <p className="font-semibold truncate">{player.name}</p>
                                              <p className="ml-auto font-bold text-lg whitespace-nowrap">{player.sudpoints} SP</p>
                                          </div>
                                      </Link>
                                  </motion.div>
                              ))}
                          </motion.div>
                      ) : (
                          <div className="text-center h-40 flex flex-col justify-center items-center text-muted-foreground" aria-live="polite">
                              <Trophy className="w-12 h-12 mb-4"/>
                              <p>Aún no hay datos en el ranking.</p>
                          </div>
                      )}
                  </CardContent>
                  <CardFooter className='pt-4'>
                      <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
                  </CardFooter>
                </Card>
              )}
            </AnimatePresence>
          </motion.div>
      </motion.div>
  );
};
