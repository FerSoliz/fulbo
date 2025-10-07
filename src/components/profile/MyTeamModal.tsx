'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shield, Users, X, Crown, Search, PlusCircle, UserX } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { useTeamDetails, TeamMember } from '@/hooks/useTeamDetails';

// --- PROPS ---
interface MyTeamModalProps {
  profileUser: UserProfile;
  onClose: () => void;
}

// --- ANIMACIONES (REFINADAS PARA SUAVIDAD) ---

// Variante para el fondo (backdrop). Animación de tipo `tween` para un fade suave.
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

// Variante para el contenedor del modal. 
// Usamos `tween` con una curva `cubic-bezier` para un efecto de "florecimiento" suave y profesional.
const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4, // Duración controlada para que no sea brusco
      ease: [0.4, 0, 0.2, 1], // Curva de aceleración suave
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: {
      duration: 0.2, // Salida un poco más rápida
      ease: 'easeIn',
    },
  },
};

const listVariants = { visible: { transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };


export const MyTeamModal = ({ profileUser, onClose }: MyTeamModalProps) => {
  const { teamDetails, members, loading } = useTeamDetails(profileUser.team?.id);
  const hasTeam = !!profileUser.team;

  const FreeAgentView = () => (
    <>
      <CardHeader className="text-center items-center pt-10 pb-6"><Avatar className='w-28 h-28 border-4 border-background shadow-md bg-muted'><UserX className='w-16 h-16 text-muted-foreground' /></Avatar><CardTitle className="mt-4 text-2xl font-bold">¡Eres Jugador Libre!</CardTitle><p className="text-muted-foreground mt-2">Aún no perteneces a ningún equipo.</p></CardHeader>
      <CardContent className="flex flex-col gap-4 px-6"><Button size="lg" asChild><Link href="/leagues/search-teams"><Search className="mr-2 h-5 w-5" /> Buscar un equipo</Link></Button><Button size="lg" variant="secondary" asChild><Link href="/manage-team/create"><PlusCircle className="mr-2 h-5 w-5" /> Crear tu propio equipo</Link></Button></CardContent>
      <CardFooter className='pt-6'><Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button></CardFooter>
    </>
  );

  const TeamView = () => (
    <>
      <CardHeader className="pt-10 pb-4 text-center items-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-24 bg-accent/50" style={{ clipPath: 'ellipse(100% 55% at 48% 44%)' }}/><Avatar className='relative w-28 h-28 border-4 border-background shadow-md'><AvatarImage src={teamDetails?.crestUrl} alt={`Escudo de ${teamDetails?.name}`} className="object-cover" /><AvatarFallback className="text-3xl bg-muted"><Shield className='w-12 h-12 text-muted-foreground'/></AvatarFallback></Avatar><CardTitle className="mt-4 text-2xl font-bold">{teamDetails?.name}</CardTitle></CardHeader>
      <CardContent className="max-h-[50vh] overflow-y-auto px-2 py-0">
        {loading ? (
          <div className="h-40 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <motion.div className="space-y-1 p-2" variants={listVariants} initial="hidden" animate="visible">
              <h3 className='font-semibold flex items-center gap-2 text-muted-foreground px-2 pb-2'><Users className='w-5 h-5'/> Plantel</h3>
              {members.map((member: TeamMember) => (
                  <motion.div key={member.id} variants={itemVariants}>
                      <Link href={`/profile/${member.id}`} passHref>
                          <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/80 transition-colors cursor-pointer" onClick={onClose}>
                              <Avatar><AvatarImage src={member.avatar} alt={member.name} /><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                              <div><p className="font-semibold">{member.name}</p><p className="text-xs text-muted-foreground">@{member.username}</p></div>
                              {teamDetails?.captainId === member.id && <div className='ml-auto flex items-center gap-1 text-xs font-bold text-amber-500'><Crown className="w-4 h-4" /><span>CAPITÁN</span></div>}
                          </div>
                      </Link>
                  </motion.div>
              ))}
          </motion.div>
        )}
      </CardContent>
      <CardFooter className='pt-4'><Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button></CardFooter>
    </>
  );

  return (
    // El `AnimatePresence` en `ProfilePage` controla la aparición/desaparición de este componente.
    // Este `motion.div` raíz actúa como el backdrop.
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Este `motion.div` es el contenedor del modal, que se anima en sincronía. */}
      <motion.div
        className="relative w-full max-w-lg bg-card rounded-xl border shadow-lg"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants} // Usando las nuevas variantes REFINADAS
      >
        <Card className='border-0 bg-transparent'>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal"><X className="h-5 w-5" /></Button>
          {hasTeam ? <TeamView /> : <FreeAgentView />}
        </Card>
      </motion.div>
    </motion.div>
  );
};
