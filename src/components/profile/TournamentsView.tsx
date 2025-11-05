'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getTournamentDetails, getTeamTournaments } from '@/lib/firebase/db';
import { UserProfile, FullTournament, Tournament, Standing, Scorer, Sanction, Team, Match } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy, X, Info } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlayoffBracket } from '@/components/admin/PlayoffBracket';

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }, exit: { opacity: 0, y: 30 } };

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-48">
        <Info className="w-10 h-10 mb-4" />
        <p>{message}</p>
    </div>
);

const TournamentDetails = ({ tournamentData }: { tournamentData: FullTournament | null }) => {
    if (!tournamentData) {
        return <EmptyState message="Selecciona un torneo para ver sus detalles." />;
    }

    const playoffMatches = useMemo(() => {
        if (!tournamentData?.matches) return [];
        return tournamentData.matches.filter((match) => !!match.stage);
    }, [tournamentData?.matches]);

    const hasPlayoffs = useMemo(() => playoffMatches.length > 0, [playoffMatches]);

    const playoffBracketData = useMemo(() => {
        if (!hasPlayoffs) return [];
        
        const teams = tournamentData?.teamsList || [];
        
        const getTeamData = (teamId: string) => {
            const team = teams.find(t => t.id === teamId);
            if (team) return { id: team.id, name: team.name, logoUrl: team.logoUrl };
            return { id: teamId, name: 'A definir' };
        };
    
        const roundsMap = playoffMatches.reduce((acc, match) => {
          const stage = match.stage || 'Playoffs';
          if (!acc[stage]) {
            acc[stage] = { name: stage, matches: [] };
          }
          const homeScore = match.result?.home;
          const awayScore = match.result?.away;
          let winnerId = null;
          if (typeof homeScore === 'number' && typeof awayScore === 'number') {
              winnerId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
          }

          acc[stage].matches.push({
            id: match.id,
            home: { ...getTeamData(match.homeTeamId), score: homeScore },
            away: { ...getTeamData(match.awayTeamId), score: awayScore },
            winnerId,
          });
          return acc;
        }, {} as { [key: string]: { name: string; matches: any[] } });
        
        const stageOrder = ['16vos de Final', 'Octavos de Final', 'Cuartos de Final', 'Semifinales', 'Final'];
        return Object.values(roundsMap).sort((a, b) => stageOrder.indexOf(a.name) - stageOrder.indexOf(b.name));
    
    }, [playoffMatches, tournamentData?.teamsList, hasPlayoffs]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <Tabs defaultValue="positions" className="w-full p-1">
                <TabsList className={`grid w-full ${hasPlayoffs ? 'grid-cols-4' : 'grid-cols-3'} bg-muted/80`}>
                    <TabsTrigger value="positions">Posiciones</TabsTrigger>
                    {hasPlayoffs && <TabsTrigger value="playoffs">Playoffs</TabsTrigger>}
                    <TabsTrigger value="scorers">Goleadores</TabsTrigger>
                    <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
                </TabsList>
                <TabsContent value="positions"><PositionsTable standings={tournamentData.standings} /></TabsContent>
                {hasPlayoffs && (
                    <TabsContent value="playoffs">
                        <Card className="border-0 shadow-none">
                            <CardContent className="pt-6">
                                <PlayoffBracket rounds={playoffBracketData} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                <TabsContent value="scorers"><ScorersTable scorers={tournamentData.scorers} /></TabsContent>
                <TabsContent value="sanctions"><SanctionsTable sanctions={tournamentData.sanctions} /></TabsContent>
            </Tabs>
        </motion.div>
    );
};

const PositionsTable = ({ standings }: { standings?: Standing[] }) => (
    <Table>
        <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Equipo</TableHead><TableHead>PJ</TableHead><TableHead>Ptos</TableHead></TableRow></TableHeader>
        <TableBody>
            {standings?.length ? standings.map((pos) => (
                <TableRow key={pos.team}><TableCell>{pos.rank}</TableCell><TableCell className="flex items-center gap-2"><Avatar className="w-5 h-5"><AvatarImage src={pos.crestUrl} /><AvatarFallback>{pos.team?.charAt(0)}</AvatarFallback></Avatar>{pos.team}</TableCell><TableCell>{pos.played}</TableCell><TableCell>{pos.points}</TableCell></TableRow>
            )) : <TableRow><TableCell colSpan={4}><EmptyState message="No hay datos de posiciones." /></TableCell></TableRow>}
        </TableBody>
    </Table>
);

const ScorersTable = ({ scorers }: { scorers?: Scorer[] }) => (
    <Table>
        <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead>Goles</TableHead></TableRow></TableHeader>
        <TableBody>
            {scorers?.length ? scorers.map((s) => (
                <TableRow key={`${s.player}-${s.team}`}><TableCell>{s.rank}</TableCell><TableCell>{s.player}</TableCell><TableCell>{s.team}</TableCell><TableCell>{s.goals}</TableCell></TableRow>
            )) : <TableRow><TableCell colSpan={4}><EmptyState message="No hay datos de goleadores." /></TableCell></TableRow>}
        </TableBody>
    </Table>
);

const SanctionsTable = ({ sanctions }: { sanctions?: Sanction[] }) => (
    <Table>
        <TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead>TA</TableHead><TableHead>TR</TableHead></TableRow></TableHeader>
        <TableBody>
            {sanctions?.length ? sanctions.map((s, i) => (
                <TableRow key={`${s.player}-${s.team}-${i}`}><TableCell>{s.player}</TableCell><TableCell>{s.team}</TableCell><TableCell>{s.yellowCards}</TableCell><TableCell>{s.redCards}</TableCell></TableRow>
            )) : <TableRow><TableCell colSpan={4}><EmptyState message="No hay datos de sanciones." /></TableCell></TableRow>}
        </TableBody>
    </Table>
);

interface TournamentsViewProps { profileUser: UserProfile; onClose: () => void; }

export const TournamentsView = ({ profileUser, onClose }: TournamentsViewProps) => {
    const { team } = profileUser;
    const [playingInTournaments, setPlayingInTournaments] = useState<Tournament[]>([]);
    const [loadingPlaying, setLoadingPlaying] = useState(true);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [selectedTournamentData, setSelectedTournamentData] = useState<FullTournament | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchPlayingInTournaments = async () => {
            if (!team?.id) { setLoadingPlaying(false); return; }
            try {
                const tournaments = await getTeamTournaments(team.id);
                setPlayingInTournaments(tournaments);
                if (tournaments.length > 0) setSelectedTournamentId(tournaments[0].id);
            } catch (error) { console.error("Error al obtener los torneos del equipo:", error); }
            finally { setLoadingPlaying(false); }
        };
        fetchPlayingInTournaments();
    }, [team?.id]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedTournamentId) { setSelectedTournamentData(null); return; }
            setLoadingDetails(true);
            try {
                const details = await getTournamentDetails(selectedTournamentId);
                setSelectedTournamentData(details);
            } catch (error) { console.error("Error al obtener detalles del torneo:", error); setSelectedTournamentData(null); }
            finally { setLoadingDetails(false); }
        };
        fetchDetails();
    }, [selectedTournamentId]);

    return (
        <motion.div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose} variants={backdropVariants} initial="hidden" animate="visible" exit="hidden">
            <motion.div className="relative w-full max-w-2xl bg-card rounded-xl border shadow-lg" onClick={(e) => e.stopPropagation()} variants={modalVariants}>
                <Card className='border-0 bg-transparent'>
                    <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 rounded-full" onClick={onClose}><X /></Button>
                    <CardHeader className="text-center items-center pt-10"><Trophy className="w-12 h-12 text-primary" /><CardTitle>Mis Torneos</CardTitle></CardHeader>
                    <CardContent className="max-h-[70vh] min-h-[400px] overflow-y-auto px-2 py-0">
                        <Tabs defaultValue="playing" className="w-full p-2">
                            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="playing">En Juego</TabsTrigger><TabsTrigger value="favorites">Favoritos</TabsTrigger></TabsList>
                            <TabsContent value="playing" className="mt-4">
                                {loadingPlaying ? <div className="flex justify-center pt-8"><Loader2 className="w-8 h-8 animate-spin" /></div> : 
                                 !playingInTournaments.length ? <EmptyState message="No estás participando en ningún torneo actualmente." /> : (
                                    <>
                                        <Select onValueChange={setSelectedTournamentId} value={selectedTournamentId || ''}>
                                            <SelectTrigger><SelectValue placeholder="Selecciona un torneo" /></SelectTrigger>
                                            <SelectContent>{playingInTournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {loadingDetails ? <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : <TournamentDetails tournamentData={selectedTournamentData} />}
                                    </>
                                )}
                            </TabsContent>
                            <TabsContent value="favorites"><EmptyState message="Aún no has guardado torneos favoritos." /></TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};