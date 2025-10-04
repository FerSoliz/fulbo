
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shield, Users, X, Crown } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Team, UserProfile } from '@/lib/types';

interface MyTeamModalProps {
  teamId: string;
  onClose: () => void;
}

interface TeamMember extends UserProfile {
  id: string;
}

// Animación para el overlay
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Animación para el modal
const modalVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } },
  exit: { opacity: 0, y: 30 },
};

// Animación para la lista de jugadores
const listVariants = {
    visible: {
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export const MyTeamModal = ({ teamId, onClose }: MyTeamModalProps) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const fetchTeamData = async () => {
      setLoading(true);
      try {
        const teamRef = ref(db, `teams/${teamId}`);
        const teamSnapshot = await get(teamRef);

        if (!teamSnapshot.exists()) {
          console.error('Team not found');
          setLoading(false);
          return;
        }

        const teamData = { id: teamSnapshot.key, ...teamSnapshot.val() } as Team;
        setTeam(teamData);

        if (teamData.players && Array.isArray(teamData.players)) {
          const memberPromises = teamData.players.map(async (playerId) => {
            const userRef = ref(db, `users/${playerId}`);
            const userSnapshot = await get(userRef);
            return userSnapshot.exists() ? { id: userSnapshot.key, ...userSnapshot.val() } : null;
          });
          const memberResults = (await Promise.all(memberPromises)).filter(Boolean) as TeamMember[];
          setMembers(memberResults);
        }

      } catch (error) {
        console.error('Error fetching team data:', error);
      }
      setLoading(false);
    };

    fetchTeamData();
  }, [teamId]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
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
          ) : team ? (
            <Card className='border-0 bg-transparent'>
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal">
                    <X className="h-5 w-5" />
                </Button>

              <CardHeader className="pt-10 pb-4 text-center items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-accent/50" 
                    style={{ clipPath: 'ellipse(100% 55% at 48% 44%)' }}/>
                 <Avatar className='relative w-28 h-28 border-4 border-background shadow-md'>
                    {team.crestUrl ? 
                        <AvatarImage src={team.crestUrl} alt={`Escudo de ${team.name}`} className="object-cover" /> 
                        : <Shield className='w-12 h-12 text-muted-foreground' />}
                    <AvatarFallback className="text-3xl bg-muted">{team.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4 text-2xl font-bold">{team.name}</CardTitle>
              </CardHeader>

              <CardContent className="max-h-[50vh] overflow-y-auto px-2 py-0">
                <motion.div className="space-y-1 p-2" variants={listVariants}>
                    <h3 className='font-semibold flex items-center gap-2 text-muted-foreground px-2 pb-2'><Users className='w-5 h-5'/> Plantel</h3>
                     {members.map((member) => (
                        <motion.div key={member.id} variants={itemVariants}>
                             <Link href={`/profile/${member.id}`} passHref>
                                <div 
                                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/80 transition-colors cursor-pointer"
                                    onClick={onClose} // Cierra el modal actual al navegar
                                >
                                    <Avatar>
                                        <AvatarImage src={member.avatar} alt={member.name} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">@{member.username}</p>
                                    </div>
                                    {team?.captainId === member.id && 
                                        <div className='ml-auto flex items-center gap-1 text-xs font-bold text-amber-500'>
                                            <Crown className="w-4 h-4" />
                                            <span>CAPITÁN</span>
                                        </div>
                                    }
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
              </CardContent>
              
              <CardFooter className='pt-4'>
                <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
              </CardFooter>
            </Card>
          ) : (
             <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                <Shield className="w-16 h-16 mb-4"/>
                <h3 className="text-xl font-semibold">Equipo no encontrado</h3>
                <p className="text-sm">No pudimos encontrar los datos de este equipo.</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
