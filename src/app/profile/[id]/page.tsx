
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { DivisionBadge } from '@/components/division-badge';
import { User, initialUsers, PlayerDetails, sudpointConfig, leagues } from '@/lib/data';
import { Medal, Shield, Swords, ShieldAlert, Calendar, Trophy, Link2, Star, Loader2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';


const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex flex-col items-center gap-1 text-center">
        <Icon className="w-8 h-8 text-accent" />
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="font-semibold text-lg">{value}</p>
    </div>
);


export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const { toast } = useToast();
    const { user: currentUser, setUser: setCurrentUser, loading: userLoading } = useUser();
    const { uploadFile, isUploading, progress } = useUpload();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uniqueCodeInput, setUniqueCodeInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial data from localStorage
    useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const combinedUsers = [...initialUsers, ...storedUsers];
        const uniqueUsers = Array.from(new Map(combinedUsers.map(u => [u.id, u])).values());
        setAllUsers(uniqueUsers);

        const targetUser = uniqueUsers.find((u:User) => u.id === userId);
        setProfileUser(targetUser || null);
        
        setLoading(false);
    }, [userId]);


    // Recalculate stats and sudpoints when user profile is loaded and linked
     useEffect(() => {
        if (profileUser && profileUser.uniqueCode) {
            recalculateStatsAndProgression();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileUser?.id, profileUser?.uniqueCode]);

    const recalculateStatsAndProgression = () => {
        if (!profileUser || !profileUser.uniqueCode) return;

        // This is a placeholder for the real logic. 
        // In a real app, you would fetch all match data.
        const allPlayerStats = JSON.parse(localStorage.getItem("allPlayerMatchStats") || "{}"); // e.g. { "match_1_player_SUD-XYZ": { goals: 2, yellow: 1 } }
        const allMatchResults = JSON.parse(localStorage.getItem("allMatchResults") || "{}"); // e.g. { "match_1": { teamA: 'Team X', teamB: 'Team Y', scoreA: 3, scoreB: 1, winner: 'teamA' } }
        
        const playerDetails = JSON.parse(localStorage.getItem("playerDetails") || "{}");
        const linkedPlayer: PlayerDetails = playerDetails[profileUser.uniqueCode];
        if(!linkedPlayer) return;

        let calculatedStats = {
            partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0,
            amarillas: 0, rojas: 0, mvps: 0
        };
        let newSudpoints = 0;

        // In a real app, you would iterate over `allMatchResults` and `allPlayerStats`
        // For this demo, we'll simulate some stats
        calculatedStats = {
            partidosJugados: 25, victorias: 15, empates: 5, derrotas: 5, goles: 12, asistencias: 8,
            amarillas: 3, rojas: 1, mvps: 4
        };
        
        newSudpoints += calculatedStats.victorias * sudpointConfig.win;
        newSudpoints += calculatedStats.derrotas * sudpointConfig.loss;
        newSudpoints += calculatedStats.empates * sudpointConfig.draw;
        newSudpoints += calculatedStats.goles * sudpointConfig.goal;
        newSudpoints += calculatedStats.amarillas * sudpointConfig.yellowCard;
        newSudpoints += calculatedStats.rojas * sudpointConfig.redCard;
        newSudpoints += calculatedStats.mvps * sudpointConfig.mvp;

        let totalSudpoints = (profileUser.baseSudpoints || 0) + newSudpoints;
        let currentLeagueIndex = leagues.findIndex(l => l.name === "Bronce");
        let currentDivision = 4;

        while(totalSudpoints >= 100) {
            totalSudpoints -= 100;
            currentDivision--;
            if(currentDivision < 1) {
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
    }

    const updateUserInStorage = (updatedUser: User) => {
         const newAllUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
         setAllUsers(newAllUsers);

         localStorage.setItem('users', JSON.stringify(newAllUsers));
         
         if(currentUser?.id === updatedUser.id) {
            setCurrentUser(updatedUser);
         }
    }

    const handleLinkAccount = () => {
        if (!profileUser) return;
        const playerDetailsJSON = localStorage.getItem("playerDetails");
        const playerDetails = playerDetailsJSON ? JSON.parse(playerDetailsJSON) : {};
        const player: PlayerDetails = playerDetails[uniqueCodeInput.toUpperCase()];

        if (player) {
            const updatedUser: User = {
                ...profileUser,
                name: `${player.name} ${player.lastName}`,
                email: player.email,
                uniqueCode: player.uniqueCode,
                baseSudpoints: profileUser.sudpoints, // Save current points as base
            };
            setProfileUser(updatedUser);
            updateUserInStorage(updatedUser);
            toast({ title: "¡Cuenta Vinculada!", description: "Tu perfil ahora está conectado a tus estadísticas de jugador." });
        } else {
            toast({ title: "Error", description: "El código de jugador no es válido.", variant: "destructive" });
        }
    };

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
                    description: "Tu nueva foto de perfil ha sido guardada."
                });
            } catch (error) {
                // The useUpload hook already shows a toast on error
            }
        }
    };

    const handleSendMessage = () => {
        if (!profileUser) return;
        router.push(`/messages?recipient=${profileUser.id}`);
    }


    if (loading || userLoading) return <div className="p-8 text-center">Cargando perfil...</div>;
    if (!profileUser) return <div className="p-8 text-center">Usuario no encontrado.</div>;
    
    const isOwnProfile = currentUser?.id === profileUser.id;
    const { stats, name, role, league, division, sudpoints, uniqueCode, isVerified, avatar } = profileUser;

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
                                        <Star className={cn("w-5 h-5 text-muted-foreground", isFavorite && "fill-accent text-accent")} />
                                    </Button>
                               )}
                           </div>
                            <div className={cn("relative cursor-pointer group", isOwnProfile && "hover:opacity-80 transition-opacity")} onClick={handleAvatarClick}>
                               <AnimatedAvatar>
                                    <Avatar className="w-32 h-32 text-4xl">
                                        <AvatarImage src={avatar} alt={name} />
                                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </AnimatedAvatar>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-white"/>
                                        <p className="text-white text-xs mt-2">{Math.round(progress)}%</p>
                                    </div>
                                )}
                            </div>
                             <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={isUploading}/>
                            
                             <div className="flex items-center gap-2 pt-4">
                                <CardTitle className="text-2xl">{name}</CardTitle>
                                {isVerified && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Image src="https://i.postimg.cc/8cm263zS/verificado.png" alt="Verificado" width={24} height={24} />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Usuario Verificado</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                             </div>
                            <CardDescription className="capitalize text-sm">
                                {role === 'admin' || role === 'editor' ? 'Administrador' : 'Jugador'}
                            </CardDescription>
                            <div className="flex items-center gap-4 pt-2">
                                <DivisionBadge league={league} division={division} />
                            </div>
                        </CardHeader>
                        <CardContent>
                           {currentUser && !isOwnProfile && currentUser.name !== 'VISITANTE' && (
                               <Button className="w-full" onClick={handleSendMessage}>
                                   <MessageSquare className="mr-2 h-4 w-4" />
                                   Enviar Mensaje
                               </Button>
                           )}
                            {isOwnProfile && (
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Progreso en la división</Label>
                                    <Progress value={sudpoints} className="h-2 my-1" />
                                    <div className="flex justify-between">
                                        <p className="text-xs text-muted-foreground mt-1">Siguiente división en 100 SP</p>
                                        <p className="text-sm font-semibold">{sudpoints} / 100 SP</p>
                                    </div>
                                </div>
                            )}
                             {isOwnProfile && !uniqueCode && (
                                <>
                                <Separator className="my-4" />
                                <div className="space-y-2">
                                    <Label htmlFor="uniqueCodeInput" className="text-sm">Vincular Cuenta de Jugador</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="uniqueCodeInput"
                                            placeholder="SUD-XXXXXX" 
                                            value={uniqueCodeInput}
                                            onChange={(e) => setUniqueCodeInput(e.target.value)}
                                        />
                                        <Button onClick={handleLinkAccount}>
                                            <Link2 className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Ingresa el código único para sincronizar tus estadísticas.
                                    </p>
                                </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha */}
                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-4xl font-bold uppercase tracking-wider text-center">Estadisticas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {uniqueCode ? (
                                <div className="space-y-6">
                                    <StatItem icon={Calendar} label="Partidos Jugados" value={stats.partidosJugados} />
                                    <Separator/>
                                    <div className="grid grid-cols-3 gap-4">
                                       <StatItem icon={Trophy} label="Victorias" value={stats.victorias} />
                                       <StatItem icon={Shield} label="Empates" value={stats.empates} />
                                       <StatItem icon={ShieldAlert} label="Derrotas" value={stats.derrotas} />
                                    </div>
                                    <Separator/>
                                    <div className="grid grid-cols-2 gap-4">
                                        <StatItem icon={Swords} label="Goles" value={stats.goles} />
                                        <StatItem icon={Medal} label="MVPs" value={stats.mvps} />
                                    </div>
                                    <Separator/>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col items-center gap-2 p-3 bg-yellow-400/10 text-yellow-400 rounded-lg">
                                            <div className="w-4 h-6 bg-yellow-400 rounded-sm"/>
                                            <span className="text-xs">Amarillas</span>
                                            <span className="font-bold text-2xl">{stats.amarillas}</span>
                                        </div>
                                         <div className="flex flex-col items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg">
                                            <div className="w-4 h-6 bg-red-500 rounded-sm"/>
                                             <span className="text-xs">Rojas</span>
                                            <span className="font-bold text-2xl">{stats.rojas}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">
                                        No hay estadísticas disponibles. Este jugador necesita vincular su código para sincronizar sus datos de juego.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                           <p className="text-xs text-muted-foreground text-center w-full">Las estadísticas se actualizan automáticamente al visitar el perfil.</p>
                        </CardFooter>
                    </Card>
                </div>

            </div>
        </div>
    );
}

    