
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Trophy, Lock, CheckCircle2, X } from 'lucide-react';

interface SudonePassViewProps {
  currentLevel: number;
  currentSudpoints: number;
  passProgress: number;
  claimedPassRewards: number[];
  handleClaimReward: (level: number) => void;
  onClose: () => void;
}

// Animaciones consistentes
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } },
  exit: { opacity: 0, y: 30 },
};
const listVariants = { visible: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export const SudonePassView = ({ currentLevel, currentSudpoints, passProgress, claimedPassRewards, handleClaimReward, onClose }: SudonePassViewProps) => {
  
  const isUnlocked = (level: number) => level <= currentLevel;
  // --- INICIO DE LA CORRECCIÓN ---
  // Se añade una guarda para asegurar que claimedPassRewards es un array.
  // Si es undefined, se trata como un array vacío [].
  const isClaimed = (level: number) => (claimedPassRewards || []).includes(level);
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-2xl bg-card rounded-xl border shadow-lg"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <Card className='border-0 bg-transparent'>
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal">
                <X className="h-5 w-5" />
            </Button>

            <CardHeader className="pt-10 pb-6">
                <div className="text-center">
                    <Image src="https://i.postimg.cc/zfJh8FrT/boton-rojo-pase.png" alt="SUDONE PASS" width={200} height={60} className="mx-auto"/>
                </div>
                <div className="pt-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-xl">NIVEL {currentLevel}</span>
                        <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                            <Trophy className="inline-block h-4 w-4 text-amber-500" />
                            {currentSudpoints} Sudpoints
                        </span>
                    </div>
                    <Progress value={passProgress} aria-label={`Progreso al siguiente nivel: ${passProgress}%`} />
                </div>
            </CardHeader>

            <ScrollArea className="h-[50vh] px-2">
                <CardContent className="py-0">
                    <motion.div className="space-y-2" variants={listVariants}>
                        {Array.from({ length: 10 }).map((_, index) => {
                            const level = index + 1;
                            const unlocked = isUnlocked(level);
                            const claimed = isClaimed(level);
                            return (
                                <motion.div 
                                    key={level} 
                                    variants={itemVariants}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                                        claimed ? "bg-muted/30 border-transparent"
                                        : unlocked ? "bg-accent/50 border-accent/80"
                                        : "bg-muted/50 border-dashed"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-md font-bold", unlocked ? "bg-accent text-accent-foreground" : "bg-muted-foreground/20")}>
                                            <span className="text-xs">NIVEL</span>
                                            <span className="text-xl">{level}</span>
                                        </div>
                                        <div className="relative">
                                            <Image src="https://i.postimg.cc/qM6GyVNg/sobre-base-campeones-de-qatar.png" alt="Recompensa de sobre" width={80} height={100} 
                                                className={cn(!unlocked && "opacity-40 grayscale")}
                                            />
                                            {!unlocked && <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white/80" aria-label="Bloqueado" />}
                                        </div>
                                        <p className={cn("font-semibold text-lg", !unlocked && "text-muted-foreground")}>Sobre de Cromos</p>
                                    </div>
                                    
                                    <Button size="sm" disabled={!unlocked || claimed} variant={claimed ? "ghost" : "default"} onClick={() => handleClaimReward(level)} className="w-32">
                                        {claimed ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Reclamado</> : unlocked ? "Reclamar" : <><Lock className="mr-2 h-4 w-4" />Bloqueado</>}
                                    </Button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </CardContent>
            </ScrollArea>

            <CardFooter className='pt-4'>
                <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
            </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
};
