
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { Loader2, Crown, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type RankingPlayer = { id: string; rank: number; name: string; sudpoints: number };

interface RankingPreviewProps {
  profileUserId: string; // ID del usuario que está viendo el perfil
  onClose: () => void;
}

// Animaciones (reutilizadas para consistencia)
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } },
  exit: { opacity: 0, y: 30 },
};
const listVariants = { visible: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export const RankingPreview = ({ profileUserId, onClose }: RankingPreviewProps) => {
  const [rankingData, setRankingData] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const usersRef = ref(db, 'users');
        const rankingQuery = query(usersRef, orderByChild('sudpoints'), limitToLast(25)); // Top 25
        const snapshot = await get(rankingQuery);

        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const usersList = Object.entries(usersData).map(([id, data]) => ({ id, ...(data as Omit<UserProfile, 'id'>) }));
          
          const sortedUsers = usersList
            .sort((a, b) => (b.sudpoints || 0) - (a.sudpoints || 0))
            .map((user, index) => ({
              id: user.id,
              rank: index + 1,
              name: user.name,
              sudpoints: user.sudpoints || 0,
            }));
          setRankingData(sortedUsers);
        } else {
          setRankingData([]);
        }
      } catch (error) {
        console.error("Error al obtener el ranking:", error);
        toast({ title: "Error al cargar el ranking", variant: "destructive" });
      }
      setLoading(false);
    };

    fetchRanking();
  }, [toast]);

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
         <AnimatePresence>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
                         <motion.div className="space-y-1 p-2" variants={listVariants}>
                            {rankingData.map((player) => (
                                <motion.div key={player.id} variants={itemVariants}>
                                    <Link href={`/profile/${player.id}`} passHref>
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
                                            <p className={cn("font-semibold truncate", player.id === profileUserId && "text-primary")}>{player.name}</p>
                                            <p className="ml-auto font-bold text-lg whitespace-nowrap">{player.sudpoints} SP</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center h-40 flex flex-col justify-center items-center text-muted-foreground">
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
