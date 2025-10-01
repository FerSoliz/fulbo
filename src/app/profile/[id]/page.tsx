
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'; // Importamos Link para la navegación
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Progress } from '@/components/ui/progress'; // Ya no usaremos este
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { DivisionBadge } from '@/components/ui/division-badge';
import { UserProfile } from '@/lib/types';
import {
  Loader2, MessageSquare, Lock, CheckCircle2, Crown, Handshake, Pencil, Image as ImageIcon, ShieldCheck, Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
}
from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, update, onValue, off, query, orderByChild, limitToLast, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- TIPOS LOCALES ---
type View = 'buttons' | 'history' | 'stats' | 'next_match' | 'sudone_pass' | 'ranking_preview' | 'favorite_tournaments' | 'my_team';
type RankingPlayer = { rank: number; name: string; sudpoints: number };

// --- DIÁLOGOS ---
const EditProfileDialog = ({ user, onSave, children }: { user: UserProfile; onSave: (updatedUser: Partial<UserProfile>) => void; children: React.ReactNode; }) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [dni, setDni] = useState(user.dni || '');

  useEffect(() => {
    setName(user.name);
    setUsername(user.username);
    setDni(user.dni || '');
  }, [user]);

  const handleSave = () => onSave({ name, username, dni });

  return (
    <Dialog><DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="name">Nombre y Apellido</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="username">Nombre de Usuario</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="dni">DNI</Label><Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email (no editable)</Label><Input id="email" value={user.email || ''} disabled /></div>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
            <DialogClose asChild><Button type="button" onClick={handleSave}>Guardar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const backgrounds = ['https://i.postimg.cc/1RfWNTCC/lusail.png', 'https://i.postimg.cc/BnnbJSjY/ELMONUMENTALRIVERPLATE2.png', 'https://i.postimg.cc/fL20hVKv/LABOMBONERABOCAJUNIORS.jpg'];
const crestMap: { [key: string]: string } = { 'https://i.postimg.cc/1RfWNTCC/lusail.png': 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png', 'https://i.postimg.cc/BnnbJSjY/ELMONUMENTALRIVERPLATE2.png': 'https://i.postimg.cc/3wts3GNd/escudito-river.png', 'https://i.postimg.cc/fL20hVKv/LABOMBONERABOCAJUNIORS.jpg': 'https://i.postimg.cc/50jZytQp/escudito-de-boca.png' };

const BackgroundChangerDialog = ({ user, onSave, children }: { user: UserProfile; onSave: (updatedData: Partial<UserProfile>) => void; children: React.ReactNode; }) => {
  const handleSelect = (url: string) => onSave({ profileBackground: url });
  return (
    <Dialog><DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cambiar Fondo de Perfil</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {backgrounds.map((bg) => (
            <div key={bg} className="relative aspect-video cursor-pointer group rounded-lg overflow-hidden" onClick={() => handleSelect(bg)}>
              <Image src={bg} alt="Fondo" layout='fill' objectFit='cover' />
              {user.profileBackground === bg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-white" /></div>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- DATOS MOCK (PARA OTRAS VISTAS) ---
const mockTournamentStats = { positions: [{ rank: 1, team: 'SUDONE FC', played: 4, won: 3, drawn: 1, lost: 0, points: 10 }], scorers: [{ rank: 1, player: 'L. Mingrone', team: 'SUDONE FC', goals: 6 }], sanctions: [{ player: 'F. González', team: 'SUDONE FC', yellow: 2, red: 0 }] };

// --- COMPONENTES AUXILIARES ---
const TransferStatusBadge = ({ user, onTransferClick }: { user: UserProfile; onTransferClick: () => void; }) => {
    const { transferStatus } = user;
    if (!transferStatus) return null;
    const statusConfig = { libre: { text: "LIBRE", color: "bg-green-500" }, traspaso: { text: "TRASPASO", color: "bg-yellow-500" }, blindado: { text: "BLINDADO", color: "bg-red-600" } };
    const config = statusConfig[transferStatus];
    const isClickable = transferStatus !== 'blindado';
    return (
        <TooltipProvider><Tooltip><TooltipTrigger asChild>
            <button onClick={isClickable ? onTransferClick : undefined} className={cn("flex items-center gap-2 text-white font-bold text-xs px-3 py-1 rounded-full", config.color, isClickable && "cursor-pointer")}>
                {isClickable ? <Handshake className="w-4 h-4" /> : <Lock className="w-4 h-4" />}<span>{config.text}</span>
            </button>
        </TooltipTrigger><TooltipContent><p>{isClickable ? `Contactar` : `No acepta ofertas`}</p></TooltipContent></Tooltip></TooltipProvider>
    );
};

// NUEVO COMPONENTE PARA MOSTRAR EL EQUIPO
const TeamDisplay = ({ team }: { team: UserProfile['team'] }) => {
  if (!team || !team.id) return null;

  return (
    <Link href={`/admin/teams/${team.id}`} passHref>
      <div className="mt-4 p-3 bg-secondary/50 rounded-lg flex items-center gap-4 transition-colors hover:bg-secondary cursor-pointer">
        <Avatar className="w-12 h-12 border-2 border-muted">
          {team.crestUrl ? (
            <AvatarImage src={team.crestUrl} alt={`Escudo de ${team.name}`} />
          ) : (
            <ShieldCheck className="w-6 h-6 text-muted-foreground" />
          )}
          <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs text-muted-foreground font-semibold">EQUIPO ACTUAL</p>
          <p className="font-bold text-lg text-foreground">{team.name}</p>
        </div>
      </div>
    </Link>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const { uploadFile, isUploading } = useUpload();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('buttons');

  // Estado para el ranking
  const [rankingData, setRankingData] = useState<RankingPlayer[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Efecto para cargar el perfil del usuario
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const userRef = ref(db, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        // Importante: Firebase devuelve el objeto, pero el ID está en la key.
        setProfileUser({ id: snapshot.key, ...snapshot.val() } as UserProfile);
      } else {
        setProfileUser(null);
        toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error en Realtime Database:", error);
      toast({ title: "Error de Red", variant: "destructive" });
      setLoading(false);
    });
    return () => off(userRef, 'value', unsubscribe);
  }, [userId, toast]);

  // Efecto para cargar el ranking solo cuando se necesita
  useEffect(() => {
    const fetchRanking = async () => {
      setRankingLoading(true);
      try {
        const usersRef = ref(db, 'users');
        // Pedimos los 10 usuarios con más 'sudpoints'
        const rankingQuery = query(usersRef, orderByChild('sudpoints'), limitToLast(10));
        const snapshot = await get(rankingQuery);

        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const usersList: UserProfile[] = Object.values(usersData);
          
          // Ordenamos de mayor a menor y mapeamos al formato necesario
          const sortedUsers = usersList
            .sort((a, b) => (b.sudpoints || 0) - (a.sudpoints || 0))
            .map((user, index) => ({
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
      setRankingLoading(false);
    };

    if (view === 'ranking_preview') {
      fetchRanking();
    }
  }, [view, toast]);

  // --- MANEJADORES DE EVENTOS ---
  const handleSaveProfile = async (updatedData: Partial<UserProfile>) => {
    if (!profileUser) return;
    const userRef = ref(db, `users/${profileUser.id}`);
    try {
      await update(userRef, updatedData);
      toast({ title: '¡Perfil Actualizado!' });
    } catch (error) {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  const handleClaimReward = (level: number) => {
    if (!profileUser || !profileUser.claimedPassRewards) return;
    const currentClaims = profileUser.claimedPassRewards || [];
    const newClaims = [...currentClaims, level];
    handleSaveProfile({ claimedPassRewards: newClaims });
    toast({ title: `¡Nivel ${level} Reclamado!` });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profileUser) {
      const file = e.target.files[0];
      const uploadedUrl = await uploadFile(file, `avatars/${profileUser.id}`);
      if (uploadedUrl) await handleSaveProfile({ avatar: uploadedUrl });
    }
  };
  
  const handleChangeTransferStatus = (status: 'libre' | 'traspaso' | 'blindado') => handleSaveProfile({ transferStatus: status });
  const handleAvatarClick = () => { if (currentUser?.id === profileUser?.id && !isUploading) fileInputRef.current?.click(); };
  const handleSendMessage = () => router.push(`/messages?recipient=${profileUser?.id}`);
  const handleTransferClick = () => router.push(`/messages?recipient=${profileUser?.id}`);


  // --- RENDERIZADO ---
  if (loading) return <div className="p-8 text-center" role="status" aria-live="polite"><Loader2 className="mx-auto h-8 w-8 animate-spin" /><span className="sr-only">Cargando perfil...</span></div>;
  if (!profileUser) return <div className="p-8 text-center" aria-live="polite">Usuario no encontrado.</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;
  const { name, username, role, league, division, isVerified, avatar, profileBackground, sudpoints = 0, team, claimedPassRewards = [], transferStatus = undefined } = profileUser;
  
  const expToNextLevel = 100; // Puntos necesarios para cada nivel
  const currentSudpoints = sudpoints; // Usamos los sudpoints del usuario
  const currentLevel = Math.floor(currentSudpoints / expToNextLevel) + 1; // Nivel actual
  const progressInCurrentLevel = currentSudpoints % expToNextLevel; // Progreso dentro del nivel actual
  const passProgress = (progressInCurrentLevel / expToNextLevel) * 100; // Para la barra de progreso
  const pointsToNextLevel = expToNextLevel - progressInCurrentLevel; // Puntos que faltan

  const currentCrest = profileBackground ? crestMap[profileBackground] : null;

  const OverlayView = ({ children }: { children: React.ReactNode }) => (
      <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setView('buttons')} aria-modal="true" role="dialog">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <Card className="max-h-[80vh]">{children}</Card>
        </motion.div>
      </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {view === 'buttons' && (
          <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
            <motion.div initial={false} animate={{ y: 0 }} exit={{ y: '-100%', opacity: 0 }}>
              <Card>
                <div className="relative w-full aspect-[4/1]">
                  {profileBackground && <Image src={profileBackground} alt="Fondo de perfil" layout='fill' className="object-cover rounded-t-lg" priority />}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute top-2 right-2 z-10 flex gap-2 items-center">
                    {currentCrest && <div className="w-10 h-10"><Image src={currentCrest} alt="Escudo del equipo" width={40} height={40} /></div>}
                    {isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><button className="w-10 h-10" aria-label="Opciones de perfil"><Image src="https://i.postimg.cc/QMwW1G7J/witget-tuerquita.png" alt="Opciones" width={40} height={40} /></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <BackgroundChangerDialog user={profileUser} onSave={handleSaveProfile}><DropdownMenuItem onSelect={(e) => e.preventDefault()}><ImageIcon className="mr-2 h-4 w-4" />Cambiar Fondo</DropdownMenuItem></BackgroundChangerDialog>
                          <EditProfileDialog user={profileUser} onSave={handleSaveProfile}><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Pencil className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem></EditProfileDialog>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger><Handshake className="mr-2 h-4 w-4" /><span>Estado de Fichaje</span></DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleChangeTransferStatus('libre')}>Libre</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeTransferStatus('traspaso')}>Traspaso</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeTransferStatus('blindado')}>Blindado</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-6 translate-y-1/2">
                    <div className={cn('relative group', isOwnProfile && 'cursor-pointer')} onClick={handleAvatarClick} role="button" aria-label={isOwnProfile ? "Cambiar avatar" : "Avatar del usuario"}>
                      <AnimatedAvatar><Avatar className="w-24 h-24 text-4xl border-4 border-background"><AvatarImage src={avatar} alt={name} /><AvatarFallback>{name.charAt(0)}</AvatarFallback></Avatar></AnimatedAvatar>
                      {isUploading && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center" aria-live="polite" aria-label="Subiendo avatar"><Loader2 className="w-8 h-8 animate-spin"/></div>}
                    </div>
                  </div>
                </div>
                <CardHeader className="pt-16 pb-4 px-6">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{name}</CardTitle>
                    {isVerified && <TooltipProvider><Tooltip><TooltipTrigger asChild><span aria-label="Usuario verificado"><Image src="https://i.postimg.cc/8cm263zS/verificado.png" alt="Verificado" width={24} height={24} /></span></TooltipTrigger><TooltipContent><p>Verificado</p></TooltipContent></Tooltip></TooltipProvider>}
                  </div>
                  <CardDescription>@{username} · {role}</CardDescription>
                  {/* AQUÍ INTEGRAMOS EL NUEVO COMPONENTE */}
                  <TeamDisplay team={team} />
                </CardHeader>
                <CardContent className="px-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <DivisionBadge league={league} division={division} />
                        {transferStatus && <TransferStatusBadge user={profileUser} onTransferClick={handleTransferClick} />}
                    </div>
                    {/* INICIO DE LA BARRA DE PROGRESO PERSONALIZADA */}
                    <div className="flex items-center gap-4"> {/* Nuevo contenedor flex para barra y trofeo */}
                        <div className="relative flex-grow h-2 bg-muted rounded-full" role="progressbar" aria-valuenow={passProgress} aria-valuemin={0} aria-valuemax={100}>
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-primary rounded-full flex items-center justify-center"
                                initial={{ width: '0%' }}
                                animate={{ width: `${passProgress}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            >
                                {/* Porcentaje en el centro, solo visible si hay suficiente espacio */}
                                {passProgress > 15 && ( // Ajusta este valor si necesitas más o menos espacio
                                    <span className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary-foreground select-none" aria-hidden="true">
                                        {Math.round(passProgress)}%
                                    </span>
                                )}
                                {/* Punto en la punta de la barra cargada */}
                                {passProgress > 0 && (
                                    <div className="absolute right-0 h-3 w-3 -translate-y-1/2 translate-x-1/2 top-1/2 bg-primary rounded-full shadow-sm border border-background" aria-hidden="true" />
                                )}
                            </motion.div>
                        </div>
                        {/* Icono de trofeo al final de la barra, ahora fuera del div con overflow-hidden */}
                        <Trophy className="h-5 w-5 text-amber-500 -ml-2" aria-label="Meta de Sudpoints" />
                    </div>
                    <div className="flex justify-between mt-1">
                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground">Siguiente nivel</p>
                        </TooltipTrigger><TooltipContent><p>{pointsToNextLevel} Sudpoints para el siguiente nivel</p></TooltipContent></Tooltip></TooltipProvider>
                        <p className="text-sm font-semibold flex items-center gap-1">
                            {currentSudpoints} / {expToNextLevel} Sudpoints
                        </p>
                    </div>
                    {/* FIN DE LA BARRA DE PROGRESO PERSONALIZADA */}
                    {/* INPUT DE TIPO FILE MOVIDO AQUÍ DENTRO DE LA CARD PRINCIPAL */}
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={isUploading} aria-label="Subir nueva imagen de perfil"/>

                    {!isOwnProfile && <Button onClick={handleSendMessage} className="w-full"><MessageSquare className="mr-2 h-4 w-4" />Enviar Mensaje</Button>}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={false} animate={{ y: 0 }} exit={{ y: '-100%', opacity: 0 }}>
              <Card>
                <CardContent className="p-4 grid grid-cols-4 gap-4">
                    <button className="transition-transform hover:scale-105" onClick={() => setView('history')} aria-label="Ver historial de partidos"><Image src="https://i.postimg.cc/kMNbHH8f/boton-1.png" alt="Historial" width={150} height={50} /></button>
                    <button className="transition-transform hover:scale-105" onClick={() => setView('next_match')} aria-label="Ver próximo partido"><Image src="https://i.postimg.cc/VsBcb9QJ/proximo-partido.png" alt="Próximo Partido" width={150} height={50} /></button>
                    <button className="transition-transform hover:scale-105" onClick={() => setView('stats')} aria-label="Ver estadísticas"><Image src="https://i.postimg.cc/hjWHXv28/boton-estadisticas.png" alt="Estadísticas" width={150} height={50} /></button>
                    <button className="transition-transform hover:scale-105" onClick={() => setView('my_team')} aria-label="Ver mi equipo"><Image src="https://i.postimg.cc/cLsMSW3v/boton-mi-equipo.png" alt="Mi Equipo" width={150} height={50} /></button>
                    <button className="transition-transform hover:scale-105" onClick={() => setView('sudone_pass')} aria-label="Ver SUDONE PASS"><Image src="https://i.postimg.cc/zfJh8FrT/boton-rojo-pase.png" alt="SUDONE PASS" width={150} height={50} /></button>
                    <button className="transition-transform hover:scale-105" onClick={() => setView('ranking_preview')} aria-label="Ver ranking de jugadores"><Image src="https://i.postimg.cc/VLhYjjGw/BOTON-RANKING.png" alt="Ranking" width={150} height={50} /></button>
                    <button className="transition-transform hover:scale-105" onClick={() => setView('favorite_tournaments')} aria-label="Ver torneos favoritos"><Image src="https://i.postimg.cc/yYnD2Q1z/boton-favorito-torneo.png" alt="Torneos Favoritos" width={150} height={50} /></button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'history' && <OverlayView><CardHeader><CardTitle>Historial</CardTitle></CardHeader><CardContent><p>Próximamente...</p></CardContent></OverlayView>}
        {view === 'stats' && <OverlayView><CardHeader><CardTitle>Estadísticas</CardTitle></CardHeader><CardContent><p>Próximamente...</p></CardContent></OverlayView>}
        {view === 'next_match' && <OverlayView><CardHeader><CardTitle>Próximo Partido</CardTitle></CardHeader><CardContent><p>Próximamente...</p></CardContent></OverlayView>}
        {view === 'my_team' && <OverlayView><CardHeader><CardTitle>Mi Equipo</CardTitle></CardHeader><CardContent><p>Próximamente...</p></CardContent></OverlayView>}

        {view === 'sudone_pass' && (
            <OverlayView>
                <CardHeader>
                    <CardTitle className="text-center text-2xl">SUDONE PASS</CardTitle>
                    <div className="pt-4">
                        <div className="flex justify-between items-end mb-1"><span className="font-bold text-lg">NIVEL {currentLevel}</span><span className="text-sm text-muted-foreground"><Trophy className="inline-block h-4 w-4 text-amber-500 mr-1" />{currentSudpoints} Sudpoints</span></div>
                        <Progress value={passProgress} />
                    </div>
                </CardHeader>
                 <ScrollArea className="h-[50vh] pr-4">
                    <CardContent className="space-y-2">
                        {Array.from({ length: 10 }).map((_, index) => {
                            const level = index + 1;
                            const isUnlocked = level <= currentLevel; // Usamos currentLevel
                            const isClaimed = claimedPassRewards.includes(level);
                            return (
                                <div key={level} className={cn("flex items-center justify-between p-3 rounded-lg", isUnlocked ? "bg-accent/20 border-l-4 border-accent" : "bg-muted/50")}>
                                    <div className="flex flex-col items-center justify-center w-12"><span className="text-xs text-muted-foreground">NIVEL</span><span className="text-xl font-bold">{level}</span></div>
                                    <div className="relative"><Image src="https://i.postimg.cc/qM6GyVNg/sobre-base-campeones-de-qatar.png" alt="Recompensa" width={80} height={100} className={cn(!isUnlocked && "opacity-30")} />{!isUnlocked && <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6" aria-label="Bloqueado"/>}</div>
                                    <div className="font-semibold">SOBRE</div>
                                </div>
                            )
                        })}
                    </CardContent>
                </ScrollArea>
                <CardFooter><Button size="sm" disabled={!isUnlocked || isClaimed} variant={isClaimed ? "outline" : "default"} onClick={() => handleClaimReward(level)}>{isClaimed ? <><CheckCircle2 className="mr-2 h-4 w-4" />Reclamado</> : isUnlocked ? "Reclamar" : "Bloqueado"}</Button></CardFooter>
                <CardFooter><Button variant="ghost" onClick={() => setView('buttons')} className="w-full">Volver</Button></CardFooter>
            </OverlayView>
        )}

        {view === 'ranking_preview' && (
             <OverlayView>
                <CardHeader><CardTitle className="text-center">Ranking de Jugadores</CardTitle></CardHeader>
                <ScrollArea className="h-[60vh]">
                  <CardContent className="space-y-2">
                      {rankingLoading ? (
                          <div className="flex justify-center items-center h-40" role="status" aria-live="polite"><Loader2 className="h-8 w-8 animate-spin" /><span className="sr-only">Cargando ranking...</span></div>
                      ) : rankingData.length > 0 ? (
                          rankingData.map((player) => (
                              <div key={player.rank} className={cn("flex items-center justify-between p-3 rounded-lg", player.name === name ? "bg-accent/20 border-l-4 border-accent" : "bg-muted/50")}>
                                  <div className="flex items-center gap-4">
                                      <span className="font-bold text-lg w-6 text-center">{player.rank === 1 ? <Crown className="w-5 h-5 text-amber-400" aria-label="Primer puesto" /> : player.rank}</span>
                                      <p className={cn(player.name === name && "text-accent-foreground font-semibold")}>{player.name}</p>
                                  </div>
                                  <p className="font-bold">{player.sudpoints} SP</p>
                              </div>
                          ))
                      ) : (
                          <p className="text-center text-muted-foreground pt-10" aria-live="polite">No hay datos de ranking disponibles.</p>
                      )}
                  </CardContent>
                </ScrollArea>
                 <CardFooter><Button variant="ghost" onClick={() => setView('buttons')} className="w-full">Volver</Button></CardFooter>
            </OverlayView>
        )}

        {view === 'favorite_tournaments' && (
            <OverlayView>
                <CardHeader><CardTitle className="text-center">Torneos Favoritos</CardTitle></CardHeader>
                 <ScrollArea className="h-[60vh]">
                    <CardContent>
                        <Tabs defaultValue="positions" className="w-full">
                            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="positions">Posiciones</TabsTrigger><TabsTrigger value="scorers">Goleadores</TabsTrigger><TabsTrigger value="sanctions">Sanciones</TabsTrigger></TabsList>
                            <TabsContent value="positions" className="mt-4"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Equipo</TableHead><TableHead>PJ</TableHead><TableHead>Ptos</TableHead></TableRow></TableHeader><TableBody>{mockTournamentStats.positions.map((pos) => (<TableRow key={pos.team}><TableCell>{pos.rank}</TableCell><TableCell>{pos.team}</TableCell><TableCell>{pos.played}</TableCell><TableCell>{pos.points}</TableCell></TableRow>))}</TableBody></Table></TabsContent>
                            <TabsContent value="scorers" className="mt-4"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Jugador</TableHead><TableHead>Goles</TableHead></TableRow></TableHeader><TableBody>{mockTournamentStats.scorers.map((s) => (<TableRow key={s.player}><TableCell>{s.rank}</TableCell><TableCell>{s.player}</TableCell><TableCell>{s.goals}</TableCell></TableRow>))}</TableBody></Table></TabsContent>
                            <TabsContent value="sanctions" className="mt-4"><Table><TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Amarillas</TableHead><TableHead>Rojas</TableHead></TableRow></TableHeader><TableBody>{mockTournamentStats.sanctions.map((s, i) => (<TableRow key={i}><TableCell>{s.player}</TableCell><TableCell>{s.yellow}</TableCell><TableCell>{s.red}</TableCell></TableRow>))}</TableBody></Table></TabsContent>
                        </Tabs>
                    </CardContent>
                </ScrollArea>
                <CardFooter><Button variant="ghost" onClick={() => setView('buttons')} className="w-full">Volver</Button></CardFooter>
            </OverlayView>
        )}
      </AnimatePresence>
    </>
  );
}
