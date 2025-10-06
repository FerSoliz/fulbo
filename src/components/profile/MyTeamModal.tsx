
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shield, Users, X, Crown, Search, PlusCircle, UserX } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';

// 1. ACTUALIZAMOS LAS PROPS: Ahora recibimos el perfil completo del usuario.
interface MyTeamModalProps {
  profileUser: UserProfile;
  onClose: () => void;
}

interface TeamMember extends UserProfile {
  id: string;
}

// Animaciones (sin cambios)
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }, exit: { opacity: 0, y: 30 } };
const listVariants = { visible: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export const MyTeamModal = ({ profileUser, onClose }: MyTeamModalProps) => {
  // 2. OBTENEMOS EL EQUIPO DEL PERFIL: Extraemos 'team' para usarlo más adelante.
  const team = profileUser.team;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // El useEffect solo se ejecutará si el usuario tiene un equipo.
    if (!team || !team.id) {
      setLoading(false);
      return;
    }

    const fetchTeamDetails = async () => {
      setLoading(true);
      try {
        const teamRef = ref(db, `teams/${team.id}`);
        const teamSnapshot = await get(teamRef);

        if (!teamSnapshot.exists()) {
          console.error('Team full data not found');
          setLoading(false);
          return;
        }

        const fullTeamData = teamSnapshot.val();
        setCaptainId(fullTeamData.captainId || null);

        if (fullTeamData.players && Array.isArray(fullTeamData.players)) {
          const memberPromises = fullTeamData.players.map(async (playerId: string) => {
            const userRef = ref(db, `users/${playerId}`);
            const userSnapshot = await get(userRef);
            return userSnapshot.exists() ? { id: userSnapshot.key, ...userSnapshot.val() } : null;
          });
          const memberResults = (await Promise.all(memberPromises)).filter(Boolean) as TeamMember[];
          setMembers(memberResults);
        }

      } catch (error) {
        console.error('Error fetching team details:', error);
      }
      setLoading(false);
    };

    fetchTeamDetails();
  }, [team]); // Ahora depende de 'team' en lugar de 'team.id'

  // 3. VISTA PARA JUGADOR LIBRE (SIN EQUIPO)
  const FreeAgentView = () => (
    <motion.div variants={modalVariants}>
      <CardHeader className="text-center items-center pt-10 pb-6">
        <Avatar className='w-28 h-28 border-4 border-background shadow-md bg-muted'>
          <UserX className='w-16 h-16 text-muted-foreground' />
        </Avatar>
        <CardTitle className="mt-4 text-2xl font-bold">¡Eres Jugador Libre!</CardTitle>
        <p className="text-muted-foreground mt-2">Aún no perteneces a ningún equipo.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6">
        <Button size="lg" asChild>
          <Link href="/leagues/search-teams"> {/* O la ruta correcta para buscar equipos */}
            <Search className="mr-2 h-5 w-5" /> Buscar un equipo para unirte
          </Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/manage-team/create"> {/* O la ruta correcta para crear un equipo */}
            <PlusCircle className="mr-2 h-5 w-5" /> Crear tu propio equipo
          </Link>
        </Button>
      </CardContent>
      <CardFooter className='pt-6'>
        <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
      </CardFooter>
    </motion.div>
  );

  // 4. VISTA PARA JUGADOR CON EQUIPO (LA LÓGICA ANTERIOR)
  const TeamView = () => (
    <motion.div variants={modalVariants}>
        <CardHeader className="pt-10 pb-4 text-center items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-accent/50" style={{ clipPath: 'ellipse(100% 55% at 48% 44%)' }}/>
          <Avatar className='relative w-28 h-28 border-4 border-background shadow-md'>
              <AvatarImage src={team?.crestUrl} alt={`Escudo de ${team?.name}`} className="object-cover" /> 
              <AvatarFallback className="text-3xl bg-muted"><Shield className='w-12 h-12 text-muted-foreground'/></AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 text-2xl font-bold">{team?.name}</CardTitle>
        </CardHeader>

        <CardContent className="max-h-[50vh] overflow-y-auto px-2 py-0">
          <AnimatePresence>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <motion.div className="space-y-1 p-2" variants={listVariants} initial="hidden" animate="visible">
                  <h3 className='font-semibold flex items-center gap-2 text-muted-foreground px-2 pb-2'><Users className='w-5 h-5'/> Plantel</h3>
                  {members.map((member) => (
                      <motion.div key={member.id} variants={itemVariants}>
                          <Link href={`/profile/${member.id}`} passHref>
                              <div 
                                  className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/80 transition-colors cursor-pointer"
                                  onClick={onClose}
                              >
                                  <Avatar>
                                      <AvatarImage src={member.avatar} alt={member.name} />
                                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="font-semibold">{member.name}</p>
                                      <p className="text-xs text-muted-foreground">@{member.username}</p>
                                  </div>
                                  {captainId === member.id && 
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
            )}
          </AnimatePresence>
        </CardContent>
        
        <CardFooter className='pt-4'>
          <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
        </CardFooter>
    </motion.div>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
    >
      <motion.div
        className="relative w-full max-w-lg bg-card rounded-xl border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className='border-0 bg-transparent'>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal">
              <X className="h-5 w-5" />
          </Button>
          
          {/* 5. RENDERIZADO CONDICIONAL: Aquí decidimos qué vista mostrar. */}
          <AnimatePresence mode="wait">
            {team ? <TeamView /> : <FreeAgentView />}
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  );
};
