'use client';

import { memo } from 'react'; // <-- PASO 1: Importar memo
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shield, Users, X, Crown, Search, PlusCircle, UserX } from 'lucide-react';
import { useTeamDetails, TeamMember } from '@/hooks/useTeamDetails';

// --- PASO 2: Las props ahora son más simples y específicas ---
interface MyTeamModalProps {
  teamId: string | null | undefined;
  onClose: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2, ease: 'easeIn' } },
};

const listVariants = { 
  visible: { transition: { staggerChildren: 0.05 } } 
};
const itemVariants = { 
  hidden: { opacity: 0, y: 10 }, 
  visible: { opacity: 1, y: 0 } 
};

// --- PASO 3: Se envuelve el componente en memo ---
export const MyTeamModal = memo(({ teamId, onClose }: MyTeamModalProps) => {
  const { teamDetails, members, loading } = useTeamDetails(teamId);
  const hasTeam = !!teamId;

  const FreeAgentView = () => (
    <>
      <CardHeader className="text-center items-center pt-10 pb-6">
          <Avatar className='w-28 h-28 border-4 border-background shadow-md bg-secondary'><UserX className='w-16 h-16 text-muted-foreground' /></Avatar>
          <CardTitle className="mt-4 text-2xl font-bold">¡Eres Jugador Libre!</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">Aún no perteneces a ningún equipo.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6">
        <Button size="lg" asChild className="w-full bg-primary hover:bg-primary/90">
            <Link href="/tournaments"><Search className="mr-2 h-5 w-5" />Buscar Torneos y Equipos</Link>
        </Button>
        <Button size="lg" variant="secondary" asChild className="w-full">
            <Link href="/manage-team/create"><PlusCircle className="mr-2 h-5 w-5" />Crear tu Propio Equipo</Link>
        </Button>
      </CardContent>
      <CardFooter className='pt-6'>
          <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
      </CardFooter>
    </>
  );

  const TeamView = () => (
    <>
      <CardHeader className="pt-10 pb-4 text-center items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-accent-blue/40" style={{ clipPath: 'ellipse(100% 55% at 48% 44%)' }}/>
        <Avatar className='relative w-28 h-28 border-4 border-background shadow-md'>
            <AvatarImage src={teamDetails?.crestUrl} alt={`Escudo de ${teamDetails?.name}`} className="object-cover" />
            <AvatarFallback className="text-3xl bg-secondary"><Shield className='w-12 h-12 text-muted-foreground'/></AvatarFallback>
        </Avatar>
        <CardTitle className="mt-4 text-2xl font-bold">{teamDetails?.name}</CardTitle>
      </CardHeader>

      <CardContent className="max-h-[60vh] min-h-[300px] overflow-y-auto px-2 py-0">
        {(loading && members.length === 0) ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div 
            className="space-y-1 p-2"
            variants={listVariants} 
            initial="hidden" 
            animate="visible"
          >
              <h3 className='font-semibold flex items-center gap-2 text-muted-foreground px-2 pb-2'><Users className='w-5 h-5'/> Plantel</h3>
              {members.map((member: TeamMember) => (
                  <motion.div key={member.id} variants={itemVariants}>
                      <Link href={`/profile/${member.id}`} onClick={onClose} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                          <Avatar>
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{member.name}</p>
                              <p className="text-xs text-muted-foreground">@{member.username}</p>
                          </div>
                          {teamDetails?.captainId === member.id && (
                              <div className='ml-auto flex items-center gap-1 text-xs font-bold text-amber-400'>
                                  <Crown className="w-4 h-4" /><span>CAPITÁN</span>
                              </div>
                          )}
                      </Link>
                  </motion.div>
              ))}
          </motion.div>
        )}
      </CardContent>
    </>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-lg bg-secondary/50 backdrop-blur-lg border border-white/10 shadow-2xl rounded-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <Card className='border-0 bg-transparent'>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={onClose} aria-label="Cerrar modal"><X className="h-5 w-5" /></Button>
          {hasTeam ? <TeamView /> : <FreeAgentView />}
        </Card>
      </motion.div>
    </motion.div>
  );
});

// Asignar un nombre para facilitar el debugging
MyTeamModal.displayName = 'MyTeamModal';
