
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { FullTournament } from '@/lib/tournaments-data';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Star, X, Info } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface FavoriteTournamentsViewProps {
    tournamentIds: string[];
    onClose: () => void;
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }, exit: { opacity: 0, y: 30 } };

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-48">
        <Info className="w-10 h-10 mb-4" />
        <p>{message}</p>
    </div>
);

export const FavoriteTournamentsView = ({ tournamentIds, onClose }: FavoriteTournamentsViewProps) => {
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(tournamentIds?.[0] || null);
    const [tournamentData, setTournamentData] = useState<FullTournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedTournamentId) {
            setLoading(false);
            return;
        }

        const fetchTournamentData = async () => {
            setLoading(true);
            setError(null);
            try {
                const tournamentRef = ref(db, `tournaments/${selectedTournamentId}`);
                const snapshot = await get(tournamentRef);

                if (snapshot.exists()) {
                    setTournamentData(snapshot.val() as FullTournament);
                } else {
                    setError('No se encontraron datos para este torneo.');
                }
            } catch (err) {
                console.error("Error fetching tournament data:", err);
                setError('Ocurrió un error al cargar el torneo.');
            }
            setLoading(false);
        };

        fetchTournamentData();
    }, [selectedTournamentId]);

    const handleTournamentChange = (value: string) => {
        setSelectedTournamentId(value);
    };

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
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose} aria-label="Cerrar modal">
                        <X className="h-5 w-5" />
                    </Button>

                    <CardHeader className="text-center items-center pt-10">
                        <Star className="w-12 h-12 text-yellow-400" />
                        <CardTitle className="mt-2 text-2xl font-bold">Torneos Favoritos</CardTitle>
                         {tournamentIds && tournamentIds.length > 1 && (
                            <Select onValueChange={handleTournamentChange} defaultValue={selectedTournamentId || undefined}>
                                <SelectTrigger className="w-[280px] mt-2 mx-auto">
                                    <SelectValue placeholder="Selecciona un torneo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tournamentIds.map(id => (
                                        <SelectItem key={id} value={id}>{id.replace(/-/g, ' ').toLocaleUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                         {tournamentData && <CardDescription className="mt-1">{tournamentData.name}</CardDescription>}
                    </CardHeader>

                    <CardContent className="max-h-[60vh] min-h-[300px] overflow-y-auto px-2 py-0">
                        {loading ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                        ) : error ? (
                            <EmptyState message={error} />
                        ) : !tournamentData ? (
                             <EmptyState message="No hay torneos favoritos seleccionados o no se encontraron datos." />
                        ) : (
                            <Tabs defaultValue="positions" className="w-full p-2">
                                <TabsList className="grid w-full grid-cols-3 bg-muted/80">
                                    <TabsTrigger value="positions">Posiciones</TabsTrigger>
                                    <TabsTrigger value="scorers">Goleadores</TabsTrigger>
                                    <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
                                </TabsList>

                                <TabsContent value="positions" className="mt-4">
                                    {tournamentData.standings?.length > 0 ? (
                                        <Table>
                                            <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">PJ</TableHead><TableHead className="text-center">Ptos</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {tournamentData.standings.map((pos) => (
                                                    <TableRow key={pos.team}>
                                                        <TableCell className="font-bold">{pos.rank}</TableCell>
                                                        <TableCell className='flex items-center gap-2'><Avatar className='w-6 h-6'><AvatarImage src={pos.crestUrl} /><AvatarFallback>{pos.team.charAt(0)}</AvatarFallback></Avatar>{pos.team}</TableCell>
                                                        <TableCell className="text-center">{pos.played}</TableCell>
                                                        <TableCell className="text-center font-semibold">{pos.points}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <EmptyState message="La tabla de posiciones aún no está disponible." />}
                                </TabsContent>
                                <TabsContent value="scorers" className="mt-4">
                                    {tournamentData.scorers?.length > 0 ? (
                                         <Table>
                                            <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-right">Goles</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {tournamentData.scorers.map((s) => (
                                                    <TableRow key={s.player}>
                                                        <TableCell className="font-bold">{s.rank}</TableCell>
                                                        <TableCell>{s.player}</TableCell>
                                                        <TableCell>{s.team}</TableCell>
                                                        <TableCell className="text-right font-semibold">{s.goals}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                     ) : <EmptyState message="La tabla de goleadores aún no está disponible." />}
                                </TabsContent>
                                <TabsContent value="sanctions" className="mt-4">
                                     {tournamentData.sanctions?.length > 0 ? (
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">Amarillas</TableHead><TableHead className="text-center">Rojas</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {tournamentData.sanctions.map((s, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{s.player}</TableCell>
                                                        <TableCell>{s.team}</TableCell>
                                                        <TableCell className="text-center font-semibold text-yellow-500">{s.yellow}</TableCell>
                                                        <TableCell className="text-center font-semibold text-red-500">{s.red}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                     ) : <EmptyState message="No hay sanciones registradas en este torneo." />}
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>

                    <CardFooter className='pt-4'>
                        <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </motion.div>
    );
};
