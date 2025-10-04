
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card';
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Shield, Goal, X } from 'lucide-react';

interface FavoriteTournamentsViewProps {
    onClose: () => void;
}

// DATOS MOCK (simulando una estructura más realista)
const mockTournamentStats = {
    name: "Liga Sudone Clausura 2024",
    positions: [
        { rank: 1, team: 'SUDONE FC', played: 4, won: 3, drawn: 1, lost: 0, points: 10 },
        { rank: 2, team: 'Los Renegados', played: 4, won: 2, drawn: 1, lost: 1, points: 7 },
        { rank: 3, team: 'La Naranja Mecánica', played: 4, won: 1, drawn: 0, lost: 3, points: 3 },
    ],
    scorers: [
        { rank: 1, player: 'L. Mingrone', team: 'SUDONE FC', goals: 6 },
        { rank: 2, player: 'J. Pérez', team: 'Los Renegados', goals: 4 },
    ],
    sanctions: [
        { player: 'F. González', team: 'SUDONE FC', yellow: 2, red: 0 },
        { player: 'M. Rodríguez', team: 'La Naranja Mecánica', yellow: 1, red: 1 },
    ]
};

// Animaciones consistentes
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } },
  exit: { opacity: 0, y: 30 },
};

export const FavoriteTournamentsView = ({ onClose }: FavoriteTournamentsViewProps) => {
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
                         <CardDescription className="mt-1">{mockTournamentStats.name}</CardDescription>
                    </CardHeader>

                    <CardContent className="max-h-[60vh] overflow-y-auto px-2 py-0">
                         <Tabs defaultValue="positions" className="w-full p-2">
                            <TabsList className="grid w-full grid-cols-3 bg-muted/80">
                                <TabsTrigger value="positions">Posiciones</TabsTrigger>
                                <TabsTrigger value="scorers">Goleadores</TabsTrigger>
                                <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
                            </TabsList>

                            <TabsContent value="positions" className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Equipo</TableHead>
                                            <TableHead className="text-center">PJ</TableHead>
                                            <TableHead className="text-center">Ptos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockTournamentStats.positions.map((pos) => (
                                            <TableRow key={pos.team} className="hover:bg-accent/50">
                                                <TableCell className="font-bold">{pos.rank}</TableCell>
                                                <TableCell>{pos.team}</TableCell>
                                                <TableCell className="text-center">{pos.played}</TableCell>
                                                <TableCell className="text-center font-semibold">{pos.points}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="scorers" className="mt-4">
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Jugador</TableHead>
                                            <TableHead className="text-right">Goles</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockTournamentStats.scorers.map((s) => (
                                            <TableRow key={s.player} className="hover:bg-accent/50">
                                                <TableCell className="font-bold">{s.rank}</TableCell>
                                                <TableCell>{s.player}</TableCell>
                                                <TableCell className="text-right font-semibold">{s.goals}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="sanctions" className="mt-4">
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jugador</TableHead>
                                            <TableHead className="text-center">Amarillas</TableHead>
                                            <TableHead className="text-center">Rojas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockTournamentStats.sanctions.map((s, i) => (
                                            <TableRow key={i} className="hover:bg-accent/50">
                                                <TableCell>{s.player}</TableCell>
                                                <TableCell className="text-center font-semibold text-yellow-500">{s.yellow}</TableCell>
                                                <TableCell className="text-center font-semibold text-red-500">{s.red}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                     <CardFooter className='pt-4'>
                        <Button variant="ghost" className="w-full" onClick={onClose}>Cerrar</Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </motion.div>
    );
};
