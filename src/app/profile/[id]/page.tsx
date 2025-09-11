
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { DivisionBadge } from '@/components/division-badge';
import { User, users as initialUsers, PlayerDetails, sudpointConfig, leagues } from '@/lib/data';
import { CheckCircle, Medal, Shield, Swords, ShieldAlert, BarChart, Calendar, Trophy, Zap, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-accent" />
            <span className="font-medium">{label}</span>
        </div>
        <span className="font-bold text-lg">{value}</span>
    </div>
);

export default function ProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const { toast } = useToast();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [uniqueCodeInput, setUniqueCodeInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial data from localStorage
    useEffect(() => {
        const storedUsersJSON = localStorage.getItem('users') || '[]';
        const storedUsers = JSON.parse(storedUsersJSON);
        const combinedUsers = [...initialUsers, ...storedUsers];
        const uniqueUsers = Array.from(new Map(combinedUsers.map(u => [u.id, u])).values());
        setAllUsers(uniqueUsers);

        const targetUser = uniqueUsers.find(u => u.id === userId);
        setUser(targetUser || null);

        const currentUserJSON = localStorage.getItem('currentUser');
        if (currentUserJSON) {
            setCurrentUser(JSON.parse(currentUserJSON));
        }
        
        setLoading(false);
    }, [userId]);


    // Recalculate stats and sudpoints when user profile is loaded and linked
     useEffect(() => {
        if (user && user.uniqueCode) {
            recalculateStatsAndProgression();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.uniqueCode]);

    const recalculateStatsAndProgression = () => {
        if (!user || !user.uniqueCode) return;

        // This is a placeholder for the real logic. 
        // In a real app, you would fetch all match data.
        const allPlayerStats = JSON.parse(localStorage.getItem("allPlayerMatchStats") || "{}"); // e.g. { "match_1_player_SUD-XYZ": { goals: 2, yellow: 1 } }
        const allMatchResults = JSON.parse(localStorage.getItem("allMatchResults") || "{}"); // e.g. { "match_1": { teamA: 'Team X', teamB: 'Team Y', scoreA: 3, scoreB: 1, winner: 'teamA' } }
        
        const playerDetails = JSON.parse(localStorage.getItem("playerDetails") || "{}");
        const linkedPlayer: PlayerDetails = playerDetails[user.uniqueCode];
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

        let totalSudpoints = (user.baseSudpoints || 0) + newSudpoints;
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
            ...user,
            stats: calculatedStats,
            sudpoints: Math.floor(totalSudpoints),
            league: leagues[currentLeagueIndex].name,
            division: currentDivision,
        };

        setUser(updatedUser);
        updateUserInStorage(updatedUser);
    }

    const updateUserInStorage = (updatedUser: User) => {
         const newAllUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
         setAllUsers(newAllUsers);

         // Persist only non-initial users
         const usersToStore = newAllUsers.filter(u => !initialUsers.some(iu => iu.id === u.id));
         localStorage.setItem('users', JSON.stringify(usersToStore));
         
         // Update current user if it's the one being changed
         if(currentUser?.id === updatedUser.id) {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
         }
    }

    const handleLinkAccount = () => {
        if (!user) return;
        const playerDetailsJSON = localStorage.getItem("playerDetails");
        const playerDetails = playerDetailsJSON ? JSON.parse(playerDetailsJSON) : {};
        const player: PlayerDetails = playerDetails[uniqueCodeInput.toUpperCase()];

        if (player) {
            const updatedUser: User = {
                ...user,
                name: `${player.name} ${player.lastName}`,
                email: player.email,
                uniqueCode: player.uniqueCode,
                baseSudpoints: user.sudpoints, // Save current points as base
            };
            setUser(updatedUser);
            updateUserInStorage(updatedUser);
            toast({ title: "¡Cuenta Vinculada!", description: "Tu perfil ahora está conectado a tus estadísticas de jugador." });
        } else {
            toast({ title: "Error", description: "El código de jugador no es válido.", variant: "destructive" });
        }
    };

    const handleAvatarClick = () => {
        if (currentUser?.id === user?.id) {
            fileInputRef.current?.click();
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const updatedUser = { ...user, avatar: event.target?.result as string };
                setUser(updatedUser);
                updateUserInStorage(updatedUser);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };


    if (loading) return <div className="p-8 text-center">Cargando perfil...</div>;
    if (!user) return <div className="p-8 text-center">Usuario no encontrado.</div>;
    
    const isOwnProfile = currentUser?.id === user.id;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna Izquierda */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <div className={cn("cursor-pointer", isOwnProfile && "hover:opacity-80 transition-opacity")} onClick={handleAvatarClick}>
                               <AnimatedAvatar>
                                    <Avatar className="w-32 h-32 text-4xl">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </AnimatedAvatar>
                            </div>
                             <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*"/>
                            
                            <CardTitle className="flex items-center gap-2 text-3xl">
                                {user.name}
                                {user.isVerified && <CheckCircle className="w-6 h-6 text-primary" />}
                            </CardTitle>
                            <CardDescription className="capitalize">
                                {user.role === 'admin' || user.role === 'editor' ? 'Administrador' : 'Jugador'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <DivisionBadge league={user.league} division={user.division} />
                             <div className="mt-4">
                                <Label className="text-xs text-muted-foreground">Progreso en la división</Label>
                                <Progress value={user.sudpoints} className="h-2 mt-1" />
                                <p className="text-sm font-bold mt-1">{user.sudpoints} / 100 SP</p>
                            </div>
                        </CardContent>
                    </Card>

                    {isOwnProfile && !user.uniqueCode && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-accent"/>Vincular Cuenta</CardTitle>
                                <CardDescription>
                                    Ingresa tu Código Único de Jugador para sincronizar tus estadísticas. Este código te lo proporciona el administrador de tu equipo.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center gap-2">
                               <Input 
                                    placeholder="SUD-XXXXXX" 
                                    value={uniqueCodeInput}
                                    onChange={(e) => setUniqueCodeInput(e.target.value)}
                               />
                               <Button onClick={handleLinkAccount}>Vincular</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Columna Derecha */}
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Estadísticas del Jugador</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {user.uniqueCode ? (
                                <>
                                    <StatItem icon={Calendar} label="Partidos Jugados" value={user.stats.partidosJugados} />
                                    <StatItem icon={Trophy} label="Victorias" value={user.stats.victorias} />
                                    <StatItem icon={Shield} label="Empates" value={user.stats.empates} />
                                    <StatItem icon={ShieldAlert} label="Derrotas" value={user.stats.derrotas} />
                                    <StatItem icon={Swords} label="Goles" value={user.stats.goles} />
                                    <StatItem icon={Zap} label="Asistencias" value={user.stats.asistencias} />
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-yellow-400/20 text-yellow-400 rounded-lg flex items-center justify-center gap-2">
                                            <div className="w-4 h-6 bg-yellow-400"/>
                                            <span className="font-bold">{user.stats.amarillas}</span>
                                        </div>
                                         <div className="flex-1 p-3 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center gap-2">
                                            <div className="w-4 h-6 bg-red-500"/>
                                            <span className="font-bold">{user.stats.rojas}</span>
                                        </div>
                                    </div>
                                    <StatItem icon={Medal} label="MVPs" value={user.stats.mvps} />
                                </>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">
                                        Vincula tu cuenta para ver tus estadísticas de juego.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

