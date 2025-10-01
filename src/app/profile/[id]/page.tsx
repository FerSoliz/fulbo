
'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { Progress } from '@/components/ui/progress';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { DivisionBadge } from '@/components/ui/division-badge';
import { UserProfile } from '@/lib/types'; 
import {
    Medal, Shield, Swords, ShieldAlert, Calendar, Trophy, Link2, Star, Loader2, MessageSquare, Clock, UserCircle, Foot, Goal, MoreVertical, Pencil, Image as ImageIcon, Gift, Lock, CheckCircle2, ArrowLeft, MapPin, Crown, Flag, Handshake, UserPlus, Check, Search, MessageCircle as MessageCircleIcon, Users2, XCircle, MinusCircle, DoorClosed, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
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
  DropdownMenuSeparator,
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
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

// --- IMPORTACIONES DE REALTIME DATABASE ---
// Usamos 'onValue' para la escucha en tiempo real
import { ref, update, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const EditProfileDialog = ({ user, onSave, children }: { user: UserProfile; onSave: (updatedUser: Partial<UserProfile>) => void; children: React.ReactNode; }) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [dni, setDni] = useState(user.dni || '');

  useEffect(() => {
    setName(user.name);
    setUsername(user.username);
    setDni(user.dni || '');
  }, [user]);

  const handleSave = () => {
    onSave({ name, username, dni });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
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
  const handleSelect = (url: string) => {
    onSave({ profileBackground: url });
  };
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cambiar Fondo de Perfil</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {backgrounds.map((bg) => (
            <div key={bg} className="relative aspect-video cursor-pointer group rounded-lg overflow-hidden" onClick={() => handleSelect(bg)}>
              <Image src={bg} alt="Fondo" layout="fill" className="object-cover" />
              {user.profileBackground === bg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-white" /></div>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const mockMatchHistory = [{ id: 1, myTeam: "SUDONE FC", opponent: "Los Rivales", myScore: 3, opponentScore: 1, tournament: "Liga Anual", date: "24/05" }];
const mockNextMatch = { myTeam: "PUERTO F.C.", opponent: "Los Eltons", time: "21:00 hs", date: "Sábado 8 de Junio", referee: "Facundo Tello", instance: "Fecha 6 - Liga de los Sábados", location: "Complejo Parque Norte" };
const mockTeamRoster: { name: string, id: string }[] = [{ name: "Lucio Mingrone", id: "admin-user" }];
const mockRanking = [{ rank: 1, name: 'Faustino', sudpoints: 1250 }, { rank: 4, name: 'Lucio Mingrone', sudpoints: 980 }];
const mockTournamentStats = { positions: [{ rank: 1, team: 'SUDONE FC', played: 4, won: 3, drawn: 1, lost: 0, points: 10 }], scorers: [{ rank: 1, player: 'L. Mingrone', team: 'SUDONE FC', goals: 6 }], sanctions: [{ player: 'F. González', team: 'SUDONE FC', yellow: 2, red: 0 }] };

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

type View = 'buttons' | 'history' | 'stats' | 'next_match' | 'sudone_pass' | 'ranking_preview' | 'favorite_tournaments' | 'my_team';
type AttendanceStatus = 'confirmed' | 'denied' | 'pending';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();
  const { user: currentUser, setUser: setCurrentUser, loading: userLoading, allUsers, setAllUsers } = useUser();
  const { uploadFile, isUploading, progress } = useUpload();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('buttons');
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [attendance, setAttendance] = useState<{[key: string]: AttendanceStatus}>({});

  // --- EFECTO REFACTORIZADO CON ONVALUE PARA TIEMPO REAL ---
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    // 1. Creamos una referencia al nodo del usuario. Esto no cambia.
    const userRef = ref(db, `users/${userId}`);

    // 2. Usamos onValue para escuchar cambios en tiempo real.
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        // 3. Cuando los datos cambian, actualizamos el estado.
        const userData = snapshot.val() as UserProfile;
        setProfileUser(userData);

        // Esto puede seguir siendo local o migrarse a DB después
        const savedClaims = localStorage.getItem(`claimedRewards_${userData.id}`);
        if (savedClaims) setClaimedRewards(JSON.parse(savedClaims));

      } else {
        setProfileUser(null);
        toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error con la escucha de Realtime Database:", error);
      toast({ title: "Error de Red", description: "No se pudo conectar con la base de datos.", variant: "destructive" });
      setLoading(false);
    });

    // 4. ¡MUY IMPORTANTE! Función de limpieza.
    // Cuando el componente se desmonta (el usuario navega a otra página),
    // dejamos de escuchar para liberar recursos.
    return () => {
      off(userRef, 'value', unsubscribe);
    };

  }, [userId, toast]);

  const handleSaveProfile = async (updatedData: Partial<UserProfile>) => {
    if (!profileUser) return;
    const userRef = ref(db, `users/${profileUser.id}`);
    try {
      // Ya no necesitamos la actualización optimista aquí,
      // porque onValue se encargará de actualizar la UI cuando Firebase confirme el cambio.
      await update(userRef, updatedData);
      toast({ title: '¡Perfil Actualizado!', description: 'Tus cambios han sido guardados.' });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el perfil.', variant: 'destructive' });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profileUser) {
      const file = e.target.files[0];
      try {
        const uploadedUrl = await uploadFile(file, `avatars/${profileUser.id}`);
        await handleSaveProfile({ avatar: uploadedUrl });
      } catch (error) { /* El hook de upload ya muestra el error */ }
    }
  };
  
  // El resto de los handlers no cambian
  const handleChangeTransferStatus = (status: 'libre' | 'traspaso' | 'blindado') => handleSaveProfile({ transferStatus: status });
  const handleAvatarClick = () => { if (currentUser?.id === profileUser?.id && !isUploading) fileInputRef.current?.click(); };
  const handleSendMessage = () => router.push(`/messages?recipient=${profileUser?.id}`);
  const handleTransferClick = () => router.push(`/messages?recipient=${profileUser?.id}`);
  const handleAddFriend = () => toast({ title: 'Solicitud Enviada', description: `Se ha enviado una solicitud de amistad.` });

  if (loading || userLoading) return <div className="p-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;
  if (!profileUser) return <div className="p-8 text-center">Usuario no encontrado.</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;
  const { stats, name, username, role, league, division, sudpoints = 0, isVerified, avatar, profileBackground, sudonepassLevel = 1, sudonepassExp = 0, transferStatus, team } = profileUser;
  const finalStats = stats || { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 };
  const winrate = finalStats.partidosJugados > 0 ? Math.round((finalStats.victorias / finalStats.partidosJugados) * 100) : 0;
  const currentCrest = profileBackground ? crestMap[profileBackground] : null;

  return (
    <>
      <AnimatePresence>
        {view === 'buttons' && (
          <div className="max-w-4xl mx-auto space-y-6 p-4">
            <motion.div initial={false} animate={{ y: 0 }} exit={{ y: '-100%', opacity: 0 }}>
              <Card>
                <div className="relative w-full aspect-[4/1]">
                  {profileBackground && <Image src={profileBackground} alt="Fondo" layout="fill" className="object-cover rounded-t-lg" priority />}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute top-2 right-2 z-10 flex gap-2 items-center">
                    {currentCrest && <div className="w-10 h-10"><Image src={currentCrest} alt="Escudo" width={40} height={40} /></div>}
                    {isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><button className="w-10 h-10"><Image src="https://i.postimg.cc/QMwW1G7J/witget-tuerquita.png" alt="Opciones" width={40} height={40} /></button></DropdownMenuTrigger>
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
                    <div className={cn('relative group', isOwnProfile && 'cursor-pointer')} onClick={handleAvatarClick}>
                      <AnimatedAvatar>
                        <Avatar className="w-24 h-24 text-4xl border-4 border-background"><AvatarImage src={avatar} alt={name} /><AvatarFallback>{name.charAt(0)}</AvatarFallback></Avatar>
                      </AnimatedAvatar>
                      {isUploading && <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /><p className="text-white text-xs mt-2">{Math.round(progress)}%</p></div>}
                    </div>
                  </div>
                </div>
                <CardHeader className="pt-16 pb-4 px-6">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{name}</CardTitle>
                    {isVerified && <TooltipProvider><Tooltip><TooltipTrigger><Image src="https://i.postimg.cc/8cm263zS/verificado.png" alt="Verificado" width={24} height={24} /></TooltipTrigger><TooltipContent><p>Usuario Verificado</p></TooltipContent></Tooltip></TooltipProvider>}
                  </div>
                  <CardDescription>@{username} · {role}</CardDescription>
                </CardHeader>
                <CardContent className="px-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <DivisionBadge league={league} division={division} />
                    {transferStatus && <TransferStatusBadge user={profileUser} onTransferClick={handleTransferClick} />}
                  </div>
                  <div className="w-full">
                    <Progress value={(sudpoints / 1000) * 100} className="h-2" />
                    <div className="flex justify-between"><p className="text-xs text-muted-foreground mt-1">Siguiente división</p><p className="text-sm font-semibold">{sudpoints} / 1000 SP</p></div>
                  </div>
                  {!isOwnProfile && <Button onClick={handleSendMessage} className="w-full"><MessageSquare className="mr-2 h-4 w-4" />Enviar Mensaje</Button>}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={false} animate={{ y: 0 }} exit={{ y: '100%', opacity: 0 }}>
              <Card>
                <CardContent className="p-4 grid grid-cols-4 gap-4">
                  <button onClick={() => setView('history')}><Image src="https://i.postimg.cc/kMNbHH8f/boton-1.png" alt="Historial" width={150} height={50} /></button>
                  <button onClick={() => setView('next_match')}><Image src="https://i.postimg.cc/VsBcb9QJ/proximo-partido.png" alt="Próximo Partido" width={150} height={50} /></button>
                  <button onClick={() => setView('stats')}><Image src="https://i.postimg.cc/hjWHXv28/boton-estadisticas.png" alt="Estadísticas" width={150} height={50} /></button>
                  <button onClick={() => setView('my_team')}><Image src="https://i.postimg.cc/cLsMSW3v/boton-mi-equipo.png" alt="Mi Equipo" width={150} height={50} /></button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={isUploading}/>
      <AnimatePresence>
        {/* Vistas modales... */}
      </AnimatePresence>
    </>
  );
}
