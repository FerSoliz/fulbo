'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { rtdb, ref, onValue, get } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Shield, Trophy, Users, Calendar, Info } from 'lucide-react';

// Tipos
interface Tournament { id: string; name: string; description: string; logoUrl: string; }
interface Team { id: string; name: string; logoUrl: string; }
interface Match { id: string; round: number; homeTeamId: string; awayTeamId: string; status: string; result?: { home: number | null; away: number | null }; details?: { date: string; time: string; }; }
interface Stats {
    positions: { teamId: string, teamName: string, played: number, won: number, drawn: number, lost: number, gf: number, gc: number, dg: number, points: number }[];
    scorers: { playerInfo: { id: string, name: string, lastName: string }, teamName: string, goals: number }[];
    sanctions: { playerInfo: { id: string, name: string, lastName: string }, teamName: string, yellowCards: number, redCards: number }[];
}
type PageState = 'LOADING' | 'NOT_FOUND' | 'READY';

export default function PublicTournamentPage() {
    const params = useParams();
    const tournamentId = params.id as string;

    const [pageState, setPageState] = useState<PageState>('LOADING');
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        if (!tournamentId) {
            setPageState('NOT_FOUND');
            return;
        }

        const tournamentRef = ref(rtdb, `tournaments/${tournamentId}`);
        const unsubscribeTournament = onValue(tournamentRef, async (snapshot) => {
            if (snapshot.exists()) {
                const tournamentData = snapshot.val();
                setTournament({ id: snapshot.key, ...tournamentData });

                const teamIds = tournamentData.teams ? Object.keys(tournamentData.teams) : [];
                const teamsPromises = teamIds.map(id => get(ref(rtdb, `teams/${id}`)).then(snap => ({ id: snap.key, ...snap.val() })));
                const teamsData = await Promise.all(teamsPromises);
                setTeams(teamsData.filter(Boolean));
                
                setPageState('READY');
            } else {
                setPageState('NOT_FOUND');
            }
        });

        const matchesRef = ref(rtdb, 'matches');
        const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
            const allMatches = snapshot.val() || {};
            const tournamentMatches = Object.values(allMatches).filter((m: any) => m.tournamentId === tournamentId) as Match[];
            setMatches(tournamentMatches.sort((a, b) => a.round - b.round));
        });

        const statsRef = ref(rtdb, `tournament_stats/${tournamentId}`);
        const unsubscribeStats = onValue(statsRef, (snapshot) => {
            setStats(snapshot.val());
        });

        return () => {
            unsubscribeTournament();
            unsubscribeMatches();
            unsubscribeStats();
        };
    }, [tournamentId]);

    const getTeam = (teamId: string) => teams.find(t => t.id === teamId);

    const rounds = useMemo(() => {
        return Object.values(matches.reduce((acc, match) => {
            const round = match.round;
            if (!acc[round]) acc[round] = [];
            acc[round].push(match);
            return acc;
        }, {} as { [key: number]: Match[] }));
    }, [matches]);
    
    if (pageState === 'LOADING') return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    if (pageState === 'NOT_FOUND') return <div className="flex h-screen w-full flex-col items-center justify-center"><Info className="h-12 w-12 text-destructive" /><h1 className="mt-4 text-2xl font-bold">Torneo no encontrado</h1><p className="text-muted-foreground">El torneo que buscas no existe o fue eliminado.</p></div>;

    return (
        <div className="container mx-auto p-4">
            <header className="mb-8 flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/10">
                    <AvatarImage src={tournament?.logoUrl} alt={`Logo de ${tournament?.name}`} />
                    <AvatarFallback>{tournament?.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">{tournament?.name}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">{tournament?.description}</p>
                </div>
            </header>

            <Tabs defaultValue="fixture" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4"><TabsTrigger value="fixture">Fixture</TabsTrigger><TabsTrigger value="positions">Posiciones</TabsTrigger><TabsTrigger value="scorers">Goleadores</TabsTrigger><TabsTrigger value="sanctions">Sanciones</TabsTrigger></TabsList>
                
                <TabsContent value="fixture" className="mt-6">
                    {rounds.length > 0 ? rounds.map((roundMatches, index) => (
                        <Card key={index} className="mb-6">
                            <CardHeader><CardTitle>Fecha {roundMatches[0].round}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {roundMatches.map(match => {
                                    const homeTeam = getTeam(match.homeTeamId);
                                    const awayTeam = getTeam(match.awayTeamId);
                                    return (
                                        <div key={match.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-4 text-lg font-semibold w-2/5">
                                                <Avatar className="h-8 w-8"><AvatarImage src={homeTeam?.logoUrl} alt={homeTeam?.name} /><AvatarFallback>{homeTeam?.name?.charAt(0)}</AvatarFallback></Avatar>
                                                <span>{homeTeam?.name || 'Equipo A'}</span>
                                            </div>
                                            <div className="text-center">
                                                {match.status === 'finished' ? (
                                                    <span className="text-2xl font-bold">{match.result?.home ?? '-'} : {match.result?.away ?? '-'}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">vs</span>
                                                )}
                                                <p className="text-xs text-muted-foreground">{match.details?.date ? `${new Date(match.details.date).toLocaleDateString()} ${match.details.time}` : 'Por definir'}</p>
                                            </div>
                                            <div className="flex items-center justify-end gap-4 text-lg font-semibold w-2/5">
                                                <span>{awayTeam?.name || 'Equipo B'}</span>
                                                <Avatar className="h-8 w-8"><AvatarImage src={awayTeam?.logoUrl} alt={awayTeam?.name} /><AvatarFallback>{awayTeam?.name?.charAt(0)}</AvatarFallback></Avatar>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )) : <p className="text-center text-muted-foreground py-8">El fixture de este torneo aún no ha sido generado.</p>}
                </TabsContent>

                <TabsContent value="positions" className="mt-6">
                    <Card><CardHeader><CardTitle>Tabla de Posiciones</CardTitle></CardHeader><CardContent>
                        {stats?.positions && stats.positions.length > 0 ? (
                            <Table><TableHeader><TableRow><TableHead className="w-[40px]">#</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">PJ</TableHead><TableHead className="text-center">G</TableHead><TableHead className="text-center">E</TableHead><TableHead className="text-center">P</TableHead><TableHead className="hidden md:table-cell text-center">GF</TableHead><TableHead className="hidden md:table-cell text-center">GC</TableHead><TableHead className="hidden md:table-cell text-center">DG</TableHead><TableHead className="text-right">Puntos</TableHead></TableRow></TableHeader><TableBody>{stats.positions.map((pos, index) => (<TableRow key={pos.teamId}><TableCell className="font-bold">{index + 1}</TableCell><TableCell>{pos.teamName}</TableCell><TableCell className="text-center">{pos.played}</TableCell><TableCell className="text-center">{pos.won}</TableCell><TableCell className="text-center">{pos.drawn}</TableCell><TableCell className="text-center">{pos.lost}</TableCell><TableCell className="hidden md:table-cell text-center">{pos.gf}</TableCell><TableCell className="hidden md:table-cell text-center">{pos.gc}</TableCell><TableCell className="hidden md:table-cell text-center">{pos.dg}</TableCell><TableCell className="text-right font-bold">{pos.points}</TableCell></TableRow>))}</TableBody></Table>
                        ) : <p className="text-center text-muted-foreground py-8">La tabla de posiciones se generará cuando finalicen los primeros partidos.</p>}
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="scorers" className="mt-6">
                     <Card><CardHeader><CardTitle>Goleadores</CardTitle></CardHeader><CardContent>
                        {stats?.scorers && stats.scorers.length > 0 ? (
                            <Table><TableHeader><TableRow><TableHead className="w-[40px]">#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-right">Goles</TableHead></TableRow></TableHeader><TableBody>{stats.scorers.map((scorer, index) => (<TableRow key={scorer.playerInfo.id}><TableCell className="font-bold">{index + 1}</TableCell><TableCell>{`${scorer.playerInfo.name} ${scorer.playerInfo.lastName}`}</TableCell><TableCell>{scorer.teamName}</TableCell><TableCell className="text-right font-bold">{scorer.goals}</TableCell></TableRow>))}</TableBody></Table>
                        ) : <p className="text-center text-muted-foreground py-8">Aún no hay goleadores en este torneo.</p>}
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="sanctions" className="mt-6">
                     <Card><CardHeader><CardTitle>Sanciones</CardTitle></CardHeader><CardContent>
                        {stats?.sanctions && stats.sanctions.length > 0 ? (
                            <Table><TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">Amarillas</TableHead><TableHead className="text-center">Rojas</TableHead></TableRow></TableHeader><TableBody>{stats.sanctions.map((p) => (<TableRow key={p.playerInfo.id}><TableCell>{`${p.playerInfo.name} ${p.playerInfo.lastName}`}</TableCell><TableCell>{p.teamName}</TableCell><TableCell className="text-center font-bold">{p.yellowCards}</TableCell><TableCell className="text-center font-bold">{p.redCards}</TableCell></TableRow>))}</TableBody></Table>
                        ) : <p className="text-center text-muted-foreground py-8">No hay jugadores sancionados.</p>}
                    </CardContent></Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
