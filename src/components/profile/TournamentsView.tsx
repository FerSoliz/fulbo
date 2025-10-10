
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getTournamentStats } from '@/lib/firebase/db';
import { FullTournament } from '@/lib/tournaments-data';
import { UserProfile } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy, X, Info } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// --- Componentes internos sin cambios ---
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }, exit: { opacity: 0, y: 30 } };
const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-48">
        <Info className="w-10 h-10 mb-4" />
        <p>{message}</p>
    </div>
);
const TournamentDetails = ({ tournamentId }: { tournamentId: string | null }) => {
    const [tournamentData, setTournamentData] = useState<FullTournament | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!tournamentId) { setLoading(false); setTournamentData(null); return; }
        const fetchFullTournamentDetails = async () => {
            setLoading(true);
            try {
                const tournamentRef = ref(db, `tournaments/${tournamentId}`);
                const snapshot = await get(tournamentRef);
                if (snapshot.exists()) {
                    const basicTournamentData = { id: snapshot.key, ...snapshot.val() } as FullTournament;
                    const stats = await getTournamentStats(tournamentId);
                    setTournamentData({ ...basicTournamentData, standings: stats?.positions || [], scorers: stats?.scorers || [], sanctions: stats?.sanctions || [] });
                } else { setTournamentData(null); }
            } catch (err) { console.error("Error en TournamentDetails:", err); }
            setLoading(false);
        };
        fetchFullTournamentDetails();
    }, [tournamentId]);
    if (loading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!tournamentData) return <EmptyState message="Selecciona un torneo para ver sus detalles." />;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <CardDescription className="text-center mb-4">{tournamentData.name}</CardDescription>
            <Tabs defaultValue="positions" className="w-full p-1">
                 <TabsList className="grid w-full grid-cols-3 bg-muted/80"><TabsTrigger value="positions">Posiciones</TabsTrigger><TabsTrigger value="scorers">Goleadores</TabsTrigger><TabsTrigger value="sanctions">Sanciones</TabsTrigger></TabsList>
                <TabsContent value="positions"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Equipo</TableHead><TableHead>PJ</TableHead><TableHead>Ptos</TableHead></TableRow></TableHeader><TableBody>{tournamentData.standings.map((pos, index) => (<TableRow key={pos.teamId}><TableCell>{index + 1}</TableCell><TableCell>{pos.teamName}</TableCell><TableCell>{pos.played}</TableCell><TableCell>{pos.points}</TableCell></TableRow>))}</TableBody></Table></TabsContent>
                <TabsContent value="scorers"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Jugador</TableHead><TableHead>Goles</TableHead></TableRow></TableHeader><TableBody>{tournamentData.scorers.map((s, index) => (<TableRow key={s.playerInfo.id}><TableCell>{index + 1}</TableCell><TableCell>{s.playerInfo.name}</TableCell><TableCell>{s.goals}</TableCell></TableRow>))}</TableBody></Table></TabsContent>
                <TabsContent value="sanctions"><Table><TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Amarillas</TableHead><TableHead>Rojas</TableHead></TableRow></TableHeader><TableBody>{tournamentData.sanctions.map((s, i) => (<TableRow key={i}><TableCell>{s.playerInfo.name}</TableCell><TableCell>{s.yellowCards}</TableCell><TableCell>{s.redCards}</TableCell></TableRow>))}</TableBody></Table></TabsContent>
            </Tabs>
        </motion.div>
    );
};

// --- COMPONENTE PRINCIPAL (CON DEPURACIÓN) ---

interface TournamentsViewProps {
    profileUser: UserProfile;
    onClose: () => void;
}

export const TournamentsView = ({ profileUser, onClose }: TournamentsViewProps) => {
    // SONDA 1: ¿Qué `profileUser` nos llega?
    console.log("[SONDA 1] Entrando a TournamentsView. `profileUser` recibido:", profileUser);
    
    const { favoriteTournaments, team } = profileUser;

    // SONDA 2: ¿Qué hay exactamente en la variable `team`?
    console.log("[SONDA 2] Objeto `team` extraído del profileUser:", team);

    const [playingInTournaments, setPlayingInTournaments] = useState<FullTournament[]>([]);
    const [loadingPlaying, setLoadingPlaying] = useState(true);
    const [selectedPlayingId, setSelectedPlayingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlayingInTournaments = async () => {
            setLoadingPlaying(true);
            console.log("[SONDA 3] Entrando al useEffect. `team?.id` es:", team?.id);

            if (!team?.id) {
                console.log("[SONDA 4] `team.id` no existe. Abortando búsqueda.");
                setPlayingInTournaments([]);
                setLoadingPlaying(false);
                return;
            }

            try {
                const teamTournamentsRef = ref(db, `teams/${team.id}/tournaments`);
                console.log(`[SONDA 5] Preparando la consulta a Firebase en la ruta: teams/${team.id}/tournaments`);
                
                const teamSnapshot = await get(teamTournamentsRef);
                
                console.log("[SONDA 6] Respuesta de Firebase recibida. ¿Existe?", teamSnapshot.exists());

                if (teamSnapshot.exists()) {
                    const tournamentData = teamSnapshot.val();
                    console.log("[SONDA 7] ¡Datos de torneos encontrados! Contenido:", tournamentData);
                    
                    const tournamentIds = Object.keys(tournamentData);
                    console.log("[SONDA 8] IDs de torneos extraídos:", tournamentIds);

                    if (tournamentIds.length === 0) {
                        console.log("[SONDA 9] No hay IDs de torneos. Lista vacía.");
                        setPlayingInTournaments([]);
                        setLoadingPlaying(false);
                        return;
                    }

                    const tournamentPromises = tournamentIds.map(tournamentId => {
                        const tournamentRef = ref(db, `tournaments/${tournamentId}`);
                        return get(tournamentRef);
                    });

                    const tournamentSnapshots = await Promise.all(tournamentPromises);
                    const tournaments = tournamentSnapshots
                        .filter(snapshot => snapshot.exists())
                        .map(snapshot => ({ id: snapshot.key, ...snapshot.val() } as FullTournament));
                    
                    console.log("[SONDA 10] Lista final de objetos de torneos completa:", tournaments);
                    setPlayingInTournaments(tournaments);

                    if (tournaments.length > 0) {
                        setSelectedPlayingId(tournaments[0].id);
                    }
                } else {
                    console.log("[SONDA 7 BIS] La ruta de torneos del equipo no existe o está vacía.");
                    setPlayingInTournaments([]);
                }
            } catch (error) {
                console.error("[SONDA ERROR] Ocurrió un error en `fetchPlayingInTournaments`:", error);
                setPlayingInTournaments([]);
            } finally {
                console.log("[SONDA FIN] `finally` block alcanzado. `loadingPlaying` a false.");
                setLoadingPlaying(false);
            }
        };

        fetchPlayingInTournaments();
    }, [team?.id]);

    const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);

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
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose}><X /></Button>
                    <CardHeader className="text-center items-center pt-10">
                        <Trophy className="w-12 h-12 text-primary" />
                        <CardTitle>Mis Torneos</CardTitle>
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
                                            <SelectTrigger><SelectValue placeholder="Selecciona un torneo" /></SelectTrigger>
                                            <SelectContent>
                                                {playingInTournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <TournamentDetails tournamentId={selectedPlayingId} />
                                    </>
                                )}
                            </TabsContent>
                            <TabsContent value="favorites">
                                 <EmptyState message="Aún no has guardado torneos favoritos." />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};
