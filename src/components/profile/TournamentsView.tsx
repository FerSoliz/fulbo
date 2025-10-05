
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { FullTournament } from '@/lib/tournaments-data';
import { UserProfile } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy, X, Info } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }, exit: { opacity: 0, y: 30 } };

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-48">
        <Info className="w-10 h-10 mb-4" />
        <p>{message}</p>
    </div>
);

// --- SUB-COMPONENTE PARA DETALLES DE TORNEO (SIN CAMBIOS) ---
const TournamentDetails = ({ tournamentId }: { tournamentId: string | null }) => {
    const [tournamentData, setTournamentData] = useState<FullTournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tournamentId) {
            setLoading(false);
            setTournamentData(null);
            return;
        }

        const fetchTournamentData = async () => {
            setLoading(true);
            setError(null);
            try {
                const tournamentRef = ref(db, `tournaments/${tournamentId}`);
                const snapshot = await get(tournamentRef);
                if (snapshot.exists()) {
                    setTournamentData({ id: snapshot.key, ...snapshot.val() } as FullTournament);
                } else {
                    setError('No se encontraron datos para este torneo.');
                }
            } catch (err) {
                console.error("Error fetching tournament data:", err);
                setError('Ocurrió un error al cargar los datos.');
            }
            setLoading(false);
        };

        fetchTournamentData();
    }, [tournamentId]);

    if (loading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error) return <EmptyState message={error} />;
    if (!tournamentData) return <EmptyState message="Selecciona un torneo para ver sus detalles." />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <CardDescription className="text-center mb-4">{tournamentData.name}</CardDescription>
            <Tabs defaultValue="positions" className="w-full p-1">
                <TabsList className="grid w-full grid-cols-3 bg-muted/80">
                    <TabsTrigger value="positions">Posiciones</TabsTrigger>
                    <TabsTrigger value="scorers">Goleadores</TabsTrigger>
                    <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
                </TabsList>
                <TabsContent value="positions" className="mt-4">
                    {tournamentData.standings?.length > 0 ? (
                        <Table><TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">PJ</TableHead><TableHead className="text-center">Ptos</TableHead></TableRow></TableHeader><TableBody>{tournamentData.standings.map((pos) => (<TableRow key={pos.team}><TableCell className="font-bold">{pos.rank}</TableCell><TableCell className='flex items-center gap-2'><Avatar className='w-6 h-6'><AvatarImage src={pos.crestUrl} /><AvatarFallback>{pos.team.charAt(0)}</AvatarFallback></Avatar>{pos.team}</TableCell><TableCell className="text-center">{pos.played}</TableCell><TableCell className="text-center font-semibold">{pos.points}</TableCell></TableRow>))}</TableBody></Table>
                    ) : <EmptyState message="La tabla de posiciones aún no está disponible." />}
                </TabsContent>
                 <TabsContent value="scorers" className="mt-4">
                    {tournamentData.scorers?.length > 0 ? (
                        <Table><TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-right">Goles</TableHead></TableRow></TableHeader><TableBody>{tournamentData.scorers.map((s) => (<TableRow key={s.player}><TableCell className="font-bold">{s.rank}</TableCell><TableCell>{s.player}</TableCell><TableCell>{s.team}</TableCell><TableCell className="text-right font-semibold">{s.goals}</TableCell></TableRow>))}</TableBody></Table>
                    ) : <EmptyState message="La tabla de goleadores aún no está disponible." />}
                </TabsContent>
                <TabsContent value="sanctions" className="mt-4">
                    {tournamentData.sanctions?.length > 0 ? (
                        <Table><TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">Amarillas</TableHead><TableHead className="text-center">Rojas</TableHead></TableRow></TableHeader><TableBody>{tournamentData.sanctions.map((s, i) => (<TableRow key={i}><TableCell>{s.player}</TableCell><TableCell>{s.team}</TableCell><TableCell className="text-center font-semibold text-yellow-500">{s.yellow}</TableCell><TableCell className="text-center font-semibold text-red-500">{s.red}</TableCell></TableRow>))}</TableBody></Table>
                    ) : <EmptyState message="No hay sanciones registradas en este torneo." />}
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};


// --- COMPONENTE PRINCIPAL ---
interface TournamentsViewProps {
    profileUser: UserProfile;
    onClose: () => void;
}

export const TournamentsView = ({ profileUser, onClose }: TournamentsViewProps) => {
    const { favoriteTournaments, team } = profileUser;
    const [playingInTournaments, setPlayingInTournaments] = useState<FullTournament[]>([]);
    const [loadingPlaying, setLoadingPlaying] = useState(true);
    const [selectedPlayingId, setSelectedPlayingId] = useState<string | null>(null);

    // REFACTOR: Lógica actualizada para soportar múltiples torneos.
    useEffect(() => {
        const fetchPlayingInTournaments = async () => {
            setLoadingPlaying(true);
            if (!team?.id) {
                setPlayingInTournaments([]);
                setLoadingPlaying(false);
                return;
            }

            try {
                // 1. Obtener la lista de IDs de torneos desde el nodo del equipo.
                const teamTournamentsRef = ref(db, `teams/${team.id}/tournaments`);
                const teamSnapshot = await get(teamTournamentsRef);

                if (teamSnapshot.exists()) {
                    const tournamentIds = Object.keys(teamSnapshot.val()); // -> ["tourney_a", "tourney_b"]

                    // 2. Obtener los detalles de cada torneo en paralelo.
                    const tournamentPromises = tournamentIds.map(tournamentId => {
                        const tournamentRef = ref(db, `tournaments/${tournamentId}`);
                        return get(tournamentRef);
                    });

                    const tournamentSnapshots = await Promise.all(tournamentPromises);

                    const tournaments = tournamentSnapshots
                        .filter(snapshot => snapshot.exists())
                        .map(snapshot => ({ id: snapshot.key, ...snapshot.val() } as FullTournament));
                    
                    setPlayingInTournaments(tournaments);

                    // 3. Pre-seleccionar el primer torneo de la lista.
                    if (tournaments.length > 0) {
                        setSelectedPlayingId(tournaments[0].id);
                    }
                } else {
                    setPlayingInTournaments([]); // El equipo no está en ningún torneo.
                }
            } catch (error) {
                console.error("Error fetching playing-in tournaments:", error);
                setPlayingInTournaments([]);
            } finally {
                setLoadingPlaying(false);
            }
        };

        fetchPlayingInTournaments();
    }, [team?.id]); // La dependencia sigue siendo la misma.

    const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(favoriteTournaments?.[0] || null);

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
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal"><X className="h-5 w-5" /></Button>
                    <CardHeader className="text-center items-center pt-10">
                        <Trophy className="w-12 h-12 text-primary" />
                        <CardTitle className="mt-2 text-2xl font-bold">Mis Torneos</CardTitle>
                    </CardHeader>

                    <CardContent className="max-h-[70vh] min-h-[400px] overflow-y-auto px-2 py-0">
                        <Tabs defaultValue="playing" className="w-full p-2">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="playing">En Juego</TabsTrigger>
                                <TabsTrigger value="favorites">Favoritos</TabsTrigger>
                            </TabsList>

                            <TabsContent value="playing" className="mt-4">
                                {loadingPlaying ? <div className="flex justify-center pt-8"><Loader2 className="w-8 h-8 animate-spin" /></div> : 
                                 playingInTournaments.length === 0 ? <EmptyState message="No estás participando en ningún torneo actualmente." /> : (
                                    <>
                                        <Select onValueChange={setSelectedPlayingId} value={selectedPlayingId || ''}>
                                            <SelectTrigger className="w-[90%] mx-auto">
                                                <SelectValue placeholder="Selecciona un torneo en juego" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {playingInTournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <TournamentDetails tournamentId={selectedPlayingId} />
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="favorites" className="mt-4">
                                {(!favoriteTournaments || favoriteTournaments.length === 0) ? <EmptyState message="No tienes torneos guardados en tus favoritos." /> : (
                                    <>
                                        <Select onValueChange={setSelectedFavoriteId} defaultValue={selectedFavoriteId || undefined}>
                                            <SelectTrigger className="w-[90%] mx-auto">
                                                <SelectValue placeholder="Selecciona un torneo favorito" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {favoriteTournaments.map(id => <SelectItem key={id} value={id}>{id.replace(/-/g, ' ').toLocaleUpperCase()}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <TournamentDetails tournamentId={selectedFavoriteId} />
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                    <CardFooter className="pt-4"><Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button></CardFooter>
                </Card>
            </motion.div>
        </motion.div>
    );
};
