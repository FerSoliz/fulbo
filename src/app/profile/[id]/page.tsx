

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AnimatedAvatar } from "@/components/ui/animated-avatar";
import { DivisionBadge } from "@/components/division-badge";
import {
  User,
  initialUsers,
  PlayerDetails,
  sudpointConfig,
  leagues,
} from "@/lib/data";
import {
  Medal,
  Shield,
  Swords,
  ShieldAlert,
  Calendar,
  Trophy,
  Link2,
  Star,
  Loader2,
  MessageSquare,
  Clock,
  UserCircle,
  Foot,
  Goal,
  MoreVertical,
  Pencil,
  Image as ImageIcon,
  Gift,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
    DialogDescription
} from '@/components/ui/dialog';
import { useUser } from "@/context/user-context";
import { useUpload } from "@/hooks/use-upload";
import { motion, AnimatePresence } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


const MatchHistory = () => {
    const puertoFcHistory = [
        { id: 1, teamA: 'PUERTO F.C.', teamB: 'La Naranja Mecánica', scoreA: 3, scoreB: 1, date: '20/05' },
        { id: 2, teamA: 'Deportivo Vencer', teamB: 'PUERTO F.C.', scoreA: 2, scoreB: 2, date: '13/05' },
        { id: 3, teamA: 'PUERTO F.C.', teamB: 'Tiki Taka', scoreA: 4, scoreB: 0, date: '06/05' },
        { id: 4, teamA: 'Real Sudone', teamB: 'PUERTO F.C.', scoreA: 1, scoreB: 2, date: '29/04' },
    ];
    return (
        <div className="relative w-full h-auto">
            <Image
                src="https://i.postimg.cc/VvZVqWqt/contenedor-historial.png"
                alt="Contenedor de historial de partidos"
                width={800}
                height={600}
                className="w-full h-auto"
                quality={100}
            />
            <div className="absolute inset-0 py-5 px-12 flex flex-col text-white">
                <h2 className="text-xl font-bold uppercase text-center mb-2">Historial de Partidos</h2>
                <div className="flex-1 flex flex-col justify-around py-2">
                    {puertoFcHistory.slice(0, 4).map((match) => (
                        <div key={match.id} className="w-full border-b border-white/20 pb-1 last:border-b-0">
                             <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center text-center text-sm gap-4">
                                <span className="text-right truncate font-semibold">{match.teamA}</span>
                                <span className="font-bold text-lg">{match.scoreA} - {match.scoreB}</span>
                                <span className="text-left truncate font-semibold">{match.teamB}</span>
                                <span className="text-right text-xs opacity-80">{match.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const NextMatch = () => {
    const nextMatchData = {
        team: 'PUERTO F.C.',
        rival: 'Los Magos',
        date: '30/05/2024',
        time: '21:00 hs',
        tournament: 'Liga Anual 2024',
        instance: 'Fecha 11',
        referee: 'Javier Castrilli'
    };

    return (
        <div className="relative w-full h-auto">
            <Image
                src="https://i.postimg.cc/VvZVqWqt/contenedor-historial.png"
                alt="Contenedor de próximo partido"
                width={800}
                height={600}
                className="w-full h-auto"
                quality={100}
            />
            <div className="absolute inset-0 py-5 px-12 flex flex-col text-white justify-center">
                 <h2 className="text-xl font-bold uppercase text-center mb-4">Próximo Partido</h2>
                 <div className="text-center mb-4">
                     <p className="text-2xl font-bold">{nextMatchData.team.toUpperCase()} vs {nextMatchData.rival.toUpperCase()}</p>
                     <p className="text-amber-400">{nextMatchData.tournament} - {nextMatchData.instance}</p>
                 </div>
                 <div className="space-y-2 text-sm">
                     <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2"><Calendar className="w-5 h-5"/> <span>{nextMatchData.date}</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-5 h-5"/> <span>{nextMatchData.time}</span></div>
                     </div>
                     <div className="flex items-center gap-2 justify-center pt-2"><UserCircle className="w-5 h-5"/> Árbitro: <span>{nextMatchData.referee}</span></div>
                 </div>
            </div>
        </div>
    );
};

const GamePass = () => {
    const currentLevel = 15; // Example current level
    const totalLevels = 40;
    const progressPercentage = (currentLevel / totalLevels) * 100;

    return (
        <div className="relative w-full h-[250px]">
            <Image
                src="https://i.postimg.cc/VvZVqWqt/contenedor-historial.png"
                alt="Contenedor de Pase de Juego"
                fill
                className="object-cover"
                quality={100}
            />
            <div className="absolute inset-0 py-5 px-8 flex flex-col text-white">
                <h2 className="text-xl font-bold uppercase text-center mb-4">SUDONEPASS</h2>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-2 pb-4">
                        {Array.from({ length: totalLevels }).map((_, index) => {
                            const level = index + 1;
                            const isClaimed = level < currentLevel;
                            const isCurrent = level === currentLevel;
                            const isLocked = level > currentLevel;
                            return (
                                <div key={level} className={cn("relative flex flex-col items-center justify-between w-20 h-28 rounded-lg p-1 border-2 transition-all",
                                    isClaimed && "border-green-500 bg-green-500/20",
                                    isCurrent && "border-amber-400 bg-amber-400/30 ring-2 ring-amber-400",
                                    isLocked && "border-gray-600 bg-black/30"
                                )}>
                                    <Image src={isClaimed ? "https://i.postimg.cc/vm4JHBVh/reclamado.png" : "https://i.postimg.cc/P5yX8PNk/giftcard.png"} alt={`Recompensa nivel ${level}`} width={80} height={112} className="absolute inset-0 w-full h-full object-cover rounded-md" />
                                    <div className="relative z-10 w-full h-full flex flex-col justify-between items-center">
                                      {!isClaimed && <p className="font-bold text-base text-shadow-lg [text-shadow:_1px_1px_2px_rgb(0_0_0_/_80%)]">{level}</p>}
                                      
                                       {isLocked && <Lock className="w-5 h-5 text-gray-400 [filter:drop-shadow(0_0_2px_#000)]" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <div className="mt-auto px-4">
                    <Progress value={progressPercentage} className="h-3 bg-white/20 [&>div]:bg-white" />
                    <p className="text-center text-xs mt-1">Nivel {currentLevel} / {totalLevels}</p>
                </div>
            </div>
        </div>
    )
}

const EditProfileDialog = ({ user, onSave, children }: { user: User, onSave: (updatedUser: User) => void, children: React.ReactNode }) => {
    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [dni, setDni] = useState(user.dni || '');

    useEffect(() => {
        setName(user.name);
        setUsername(user.username);
        setDni(user.dni || '');
    }, [user]);

    const handleSave = () => {
        const updatedUser = {
            ...user,
            name,
            username,
            dni,
        };
        onSave(updatedUser);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Perfil y Vinculación</DialogTitle>
                    <DialogDescription>
                        Actualiza tu información personal. Tu DNI se usará para vincular tus estadísticas de jugador.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre y Apellido</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="username">Nombre de Usuario</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="dni">DNI (para vincular estadísticas)</Label>
                        <Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email (no editable)</Label>
                        <Input id="email" value={user.email || ''} disabled />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                     <DialogClose asChild>
                        <Button type="button" onClick={handleSave}>Guardar Cambios</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const backgroundOptions = [
    { name: 'La Bombonera', url: 'https://i.postimg.cc/76dmQW2x/interfaz-menu-png-1.png', crestUrl: 'https://i.postimg.cc/50jZytQp/escudito-de-boca.png' },
    { name: 'Lusail', url: 'https://i.postimg.cc/1RfWNTCC/lusail.png', crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png' },
    { name: 'El Monumental', url: 'https://i.postimg.cc/L4wxkTGH/monumental.png', crestUrl: 'https://i.postimg.cc/3wts3GNd/escudito-river.png' },
]

const CustomizeBackgroundDialog = ({ user, onSave, children }: { user: User, onSave: (updatedUser: User) => void, children: React.ReactNode }) => {
    const [selectedBackground, setSelectedBackground] = useState(user.profileBackground || backgroundOptions[0].url);

    const handleSave = () => {
        onSave({ ...user, profileBackground: selectedBackground });
    }

    return (
         <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Personalizar Fondo de Perfil</DialogTitle>
                    <DialogDescription>
                        Elige tu estadio favorito para el fondo de tu perfil.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Carousel setApi={(api) => {
                        api?.on("select", () => {
                            setSelectedBackground(backgroundOptions[api.selectedScrollSnap()].url);
                        });
                    }}>
                        <CarouselContent>
                            {backgroundOptions.map((bg, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-1">
                                        <Card>
                                            <CardContent className="flex aspect-video items-center justify-center p-6 relative">
                                                <Image src={bg.url} alt={bg.name} fill className="object-cover rounded-lg"/>
                                                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">{bg.name}</span>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
                <DialogFooter>
                     <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                     <DialogClose asChild>
                        <Button type="button" onClick={handleSave}>Guardar Fondo</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();
  const {
    user: currentUser,
    setUser: setCurrentUser,
    loading: userLoading,
  } = useUser();
  const { uploadFile, isUploading, progress } = useUpload();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNextMatch, setShowNextMatch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGamePass, setShowGamePass] = useState(false);

  // Load initial data from localStorage
  useEffect(() => {
    const storedUsersJSON = localStorage.getItem("users") || "[]";
    const storedUsers = JSON.parse(storedUsersJSON);
    const combinedUsers = [...initialUsers, ...storedUsers];
    const uniqueUsers = Array.from(
      new Map(combinedUsers.map((u) => [u.id, u])).values()
    );
    setAllUsers(uniqueUsers);

    const targetUser = uniqueUsers.find((u) => u.id === userId);
    setProfileUser(targetUser || null);

    setLoading(false);
  }, [userId]);

  // Recalculate stats and sudpoints when user profile is loaded and linked
  useEffect(() => {
    if (profileUser && profileUser.dni) {
      recalculateStatsAndProgression();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUser?.id, profileUser?.dni]);

  const recalculateStatsAndProgression = () => {
    if (!profileUser || !profileUser.dni) return;

    // This is a placeholder for the real logic.
    // In a real app, you would fetch all match data.
    const allPlayerStats = JSON.parse(
      localStorage.getItem("allPlayerMatchStats") || "{}"
    ); 
    const allMatchResults = JSON.parse(
      localStorage.getItem("allMatchResults") || "{}"
    ); 
    
    // Find player by DNI across all rosters in all tournaments
    // This is a simplified simulation
    const allTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    let foundPlayerInRoster = false;
    for (const tournament of allTournaments) {
        const teams = JSON.parse(localStorage.getItem(`teams_${tournament.id}`) || '[]');
        for (const team of teams) {
            const roster = JSON.parse(localStorage.getItem(`roster_${tournament.id}_${team.id}`) || '[]');
            const playerInRoster = roster.find((p: any) => p.dni === profileUser.dni);
            if (playerInRoster) {
                foundPlayerInRoster = true;
                break;
            }
        }
        if (foundPlayerInRoster) break;
    }

    if (!foundPlayerInRoster) return;


    let calculatedStats = {
      partidosJugados: 0,
      victorias: 0,
      empates: 0,
      derrotas: 0,
      goles: 0,
      asistencias: 0,
      amarillas: 0,
      rojas: 0,
      mvps: 0,
    };
    let newSudpoints = 0;

    // For this demo, we'll simulate some stats if player is found
    calculatedStats = {
      partidosJugados: 25,
      victorias: 15,
      empates: 5,
      derrotas: 5,
      goles: 12,
      asistencias: 8,
      amarillas: 3,
      rojas: 1,
      mvps: 4,
    };

    newSudpoints += calculatedStats.victorias * sudpointConfig.win;
    newSudpoints += calculatedStats.derrotas * sudpointConfig.loss;
    newSudpoints += calculatedStats.empates * sudpointConfig.draw;
    newSudpoints += calculatedStats.goles * sudpointConfig.goal;
    newSudpoints += calculatedStats.amarillas * sudpointConfig.yellowCard;
    newSudpoints += calculatedStats.rojas * sudpointConfig.redCard;
    newSudpoints += calculatedStats.mvps * sudpointConfig.mvp;

    let totalSudpoints = (profileUser.baseSudpoints || 0) + newSudpoints;
    let currentLeagueIndex = leagues.findIndex((l) => l.name === "Bronce");
    let currentDivision = 4;

    while (totalSudpoints >= 100) {
      totalSudpoints -= 100;
      currentDivision--;
      if (currentDivision < 1) {
        currentLeagueIndex++;
        if (currentLeagueIndex >= leagues.length) {
          currentLeagueIndex = leagues.length - 1;
          currentDivision = 1;
          totalSudpoints = 100; // Max out
          break;
        }
        currentDivision = leagues[currentLeagueIndex].divisions;
      }
    }

    const updatedUser = {
      ...profileUser,
      stats: calculatedStats,
      sudpoints: Math.floor(totalSudpoints),
      league: leagues[currentLeagueIndex].name,
      division: currentDivision,
    };

    setProfileUser(updatedUser);
    updateUserInStorage(updatedUser);
  };

  const updateUserInStorage = (updatedUser: User) => {
    const newAllUsers = allUsers.map((u) =>
      u.id === updatedUser.id ? updatedUser : u
    );
    setAllUsers(newAllUsers);

    // Persist only non-initial users
    const usersToStore = newAllUsers.filter(
      (u) => !initialUsers.some((iu) => iu.id === u.id)
    );
    localStorage.setItem("users", JSON.stringify(usersToStore));

    // Update current user if it's the one being changed
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleSaveProfile = (updatedUser: User) => {
      setProfileUser(updatedUser);
      updateUserInStorage(updatedUser);
      toast({
          title: "¡Perfil Actualizado!",
          description: "Tu información ha sido guardada correctamente."
      })
  }

  const handleSaveBackground = (updatedUser: User) => {
    setProfileUser(updatedUser);
    updateUserInStorage(updatedUser);
    toast({
        title: "¡Fondo Actualizado!",
        description: "Tu nuevo fondo de perfil ha sido guardado."
    })
  }

  const handleAvatarClick = () => {
    if (currentUser?.id === profileUser?.id && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profileUser) {
      const file = e.target.files[0];
      try {
        const uploadedUrl = await uploadFile(file, `avatars/${profileUser.id}`);
        const updatedUser = { ...profileUser, avatar: uploadedUrl };
        setProfileUser(updatedUser);
        updateUserInStorage(updatedUser);
        toast({
          title: "¡Avatar Actualizado!",
          description: "Tu nueva foto de perfil ha sido guardada.",
        });
      } catch (error) {
        // The useUpload hook already shows a toast on error
      }
    }
  };

  const handleSendMessage = () => {
    if (!profileUser) return;
    router.push(`/messages?recipient=${profileUser.id}`);
  };

  if (loading || userLoading)
    return <div className="p-8 text-center">Cargando perfil...</div>;
  if (!profileUser)
    return <div className="p-8 text-center">Usuario no encontrado.</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;
  const {
    stats,
    name,
    role,
    league,
    division,
    sudpoints,
    isVerified,
    avatar,
    dni,
    profileBackground,
  } = profileUser;
  
  const exampleStats = {
      partidosJugados: 25,
      victorias: 15,
      empates: 5,
      derrotas: 5,
      goles: 12,
      asistencias: 8,
      amarillas: 3,
      rojas: 1,
      mvps: 4,
  };
  const finalStats = (dni && stats) ? stats : exampleStats;
  const winrate = finalStats.partidosJugados > 0 ? Math.round((finalStats.victorias / finalStats.partidosJugados) * 100) : 0;
  const goalAverage = finalStats.partidosJugados > 0 ? (finalStats.goles / finalStats.partidosJugados).toFixed(2) : '0.00';
  
  const currentBackgroundData = backgroundOptions.find(bg => bg.url === profileBackground);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda */}
        <div className="md:col-span-1 space-y-6">
          <Card className="relative">
            <CardHeader className="items-center text-center">
              <div className="absolute top-4 right-4">
                {currentUser && !isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 text-muted-foreground",
                        isFavorite && "fill-accent text-accent"
                      )}
                    />
                  </Button>
                )}
              </div>
              <div
                className={cn(
                  "relative cursor-pointer group",
                  isOwnProfile && "hover:opacity-80 transition-opacity"
                )}
                onClick={handleAvatarClick}
              >
                <AnimatedAvatar>
                  <Avatar className="w-32 h-32 text-4xl">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </AnimatedAvatar>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <p className="text-white text-xs mt-2">
                      {Math.round(progress)}%
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
                accept="image/*"
                disabled={isUploading}
              />

              <div className="flex items-center gap-2 pt-4">
                <CardTitle className="text-2xl">{name}</CardTitle>
                {isVerified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src="https://i.postimg.cc/8cm263zS/verificado.png"
                          alt="Verificado"
                          width={24}
                          height={24}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Usuario Verificado</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <CardDescription className="capitalize text-sm">
                {role === "admin" || role === "editor"
                  ? "Administrador"
                  : "Jugador"}
              </CardDescription>
              <div className="flex items-center gap-4 pt-2">
                <DivisionBadge league={league} division={division} />
              </div>
            </CardHeader>
            <CardContent>
              {currentUser &&
                !isOwnProfile &&
                currentUser.name !== "VISITANTE" && (
                  <Button className="w-full" onClick={handleSendMessage}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Enviar Mensaje
                  </Button>
                )}
              {isOwnProfile && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">
                    Progreso en la división
                  </Label>
                  <Progress value={sudpoints} className="h-2 my-1" />
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground mt-1">
                      Siguiente división en 100 SP
                    </p>
                    <p className="text-sm font-semibold">
                      {sudpoints} / 100 SP
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha */}
        <div className="md:col-span-2 space-y-2">
          <Card>
            <CardContent className="p-0 relative">
              <div className="absolute left-2 top-2 z-10 flex flex-col gap-2">
                <Image
                  src="https://i.postimg.cc/VsBcb9QJ/proximo-partido.png"
                  alt="Proximo Partido"
                  width={82}
                  height={103}
                  onClick={() => {setShowNextMatch(!showNextMatch); setShowHistory(false); setShowStats(false); setShowGamePass(false);}}
                  className="cursor-pointer hover:scale-105 transition-transform"
                />
                <div className="flex flex-row gap-2">
                  <Image
                    src="https://i.postimg.cc/kMNbHH8f/boton-1.png"
                    alt="Historial"
                    width={82}
                    height={103}
                    onClick={() => {setShowHistory(!showHistory); setShowNextMatch(false); setShowStats(false); setShowGamePass(false);}}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  />
                   <Image
                    src="https://i.postimg.cc/hjWHXv28/boton-estadisticas.png"
                    alt="Estadisticas"
                    width={82}
                    height={103}
                    onClick={() => {setShowStats(!showStats); setShowHistory(false); setShowNextMatch(false); setShowGamePass(false);}}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  />
                </div>
              </div>
              <div className="absolute right-0 top-0 z-10 flex items-start gap-0">
                 {currentBackgroundData && (
                    <Image
                        src={currentBackgroundData.crestUrl}
                        alt={`${currentBackgroundData.name} crest`}
                        width={41}
                        height={51}
                        className="opacity-80"
                    />
                 )}
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Image
                            src="https://i.postimg.cc/QMwW1G7J/witget-tuerquita.png"
                            alt="Configuracion"
                            width={41}
                            height={51}
                            className="cursor-pointer hover:scale-105 transition-transform"
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {isOwnProfile ? (
                            <>
                                <EditProfileDialog user={profileUser} onSave={handleSaveProfile}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar Perfil y Vinculación
                                    </DropdownMenuItem>
                                </EditProfileDialog>
                                <CustomizeBackgroundDialog user={profileUser} onSave={handleSaveBackground}>
                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Personalizar Fondo
                                    </DropdownMenuItem>
                                </CustomizeBackgroundDialog>
                            </>
                        ) : (
                             <DropdownMenuItem>No hay acciones</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>
              <div className="absolute right-2 bottom-2 z-10">
                <Image
                  src="https://i.postimg.cc/zfJh8FrT/boton-rojo-pase.png"
                  alt="Pase de Batalla"
                  width={82}
                  height={103}
                  onClick={() => {setShowGamePass(!showGamePass); setShowStats(false); setShowHistory(false); setShowNextMatch(false);}}
                  className="cursor-pointer hover:scale-105 transition-transform"
                />
              </div>
              <Image
                src={profileBackground || 'https://i.postimg.cc/76dmQW2x/interfaz-menu-png-1.png'}
                alt="Interfaz de menú de perfil"
                width={800}
                height={200}
                quality={100}
                className="w-full h-auto object-cover rounded-lg"
              />
            </CardContent>
          </Card>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MatchHistory />
              </motion.div>
            )}
             {showNextMatch && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <NextMatch />
              </motion.div>
            )}
             {showStats && (
                  <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                  >
                      <div className="relative w-full h-auto">
                          <Image
                              src="https://i.postimg.cc/VvZVqWqt/contenedor-historial.png"
                              alt="Contenedor de estadisticas"
                              width={800}
                              height={600}
                              className="w-full h-auto"
                              quality={100}
                          />
                          <div className="absolute inset-0 py-5 px-4 flex flex-col text-white">
                               <div className="flex justify-center items-center mb-2">
                                <h2 className="text-xl font-bold uppercase text-center">Estadisticas</h2>
                               </div>
                               <div className="w-full h-px bg-white/20 mb-4"></div>
                               {dni ? (
                                <div className="flex flex-1 items-center">
                                  <div className="flex-1 text-center">
                                      <h3 className="text-xs font-bold uppercase text-gray-400">Winrate</h3>
                                      <p className="text-5xl font-bold">{winrate}<span className="text-2xl">%</span></p>
                                      <p className="text-xs text-gray-400">Promedio de Victoria</p>
                                  </div>
                                  
                                  <div className="h-full w-px bg-white/20 mx-2"></div>

                                  <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1">
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">Jugados</p>
                                          <p className="text-xl font-bold">{finalStats.partidosJugados}</p>
                                      </div>
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">Ganados</p>
                                          <p className="text-xl font-bold text-green-400">{finalStats.victorias}</p>
                                      </div>
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">Empatados</p>
                                          <p className="text-xl font-bold text-yellow-400">{finalStats.empates}</p>
                                      </div>
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">Perdidos</p>
                                          <p className="text-xl font-bold text-red-500">{finalStats.derrotas}</p>
                                      </div>
                                  </div>

                                  <div className="h-full w-px bg-white/20 mx-2"></div>
                                  
                                  <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1">
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">Goles</p>
                                          <p className="text-xl font-bold">{finalStats.goles}</p>
                                      </div>
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">MVP</p>
                                          <p className="text-xl font-bold">{finalStats.mvps}</p>
                                      </div>
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">Amarillas</p>
                                          <p className="text-xl font-bold text-yellow-400">{finalStats.amarillas}</p>
                                      </div>
                                      <div className="bg-black/20 p-1 rounded-md text-center">
                                          <p className="text-[10px] uppercase text-gray-400">Rojas</p>
                                          <p className="text-xl font-bold text-red-500">{finalStats.rojas}</p>
                                      </div>
                                  </div>
                                  <div className="h-full w-px bg-white/20 mx-2"></div>

                                  <div className="flex-1 text-center">
                                      <h3 className="text-xs font-bold uppercase text-gray-400">Prom. de Gol</h3>
                                      <p className="text-5xl font-bold">{goalAverage}</p>
                                      <p className="text-xs text-gray-400">Goles por Partido</p>
                                  </div>
                                </div>
                               ) : (
                                 <div className="flex-1 flex items-center justify-center">
                                    <p className="text-center text-muted-foreground p-4">Vincula tu DNI para ver tus estadísticas de jugador.</p>
                                 </div>
                               )}
                          </div>
                      </div>
                  </motion.div>
              )}
               {showGamePass && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <GamePass />
                </motion.div>
              )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

    