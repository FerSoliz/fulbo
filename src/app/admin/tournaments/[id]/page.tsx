'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ref, onValue, update, set, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { updatePlayerGlobalStats, revertMatchStats, calculateTournamentStats } from '@/lib/firebase/stats';

import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MatchStatsDialog } from '@/components/match-stats-dialog';
import { AddMatchDialog } from '@/components/add-match-dialog';
import { ArrowLeft, Loader2, ListOrdered, PlusCircle, XCircle, ShieldAlert, Pencil, Trash2 } from 'lucide-react';

// --- TIPOS (actualizados para reflejar la nueva estructura de stats.ts)
import { Tournament, Team, Match, Stats, PageState, PlayerStatsInfo } from '@/lib/types';

// --- LÓGICA DE NEGOCIO (sin cambios aquí) ---
const generateRoundRobinFixture = (teams: Team[]) => {
    const schedule: { round: number; homeTeamId: string; awayTeamId: string; }[] = [];
    let localTeams = [...teams];
    if (localTeams.length % 2 !== 0) localTeams.push({ id: 'bye', name: 'BYE', logoUrl: '' });
    const numRounds = localTeams.length - 1;
    const halfSize = localTeams.length / 2;
    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
            const home = localTeams[i], away = localTeams[localTeams.length - 1 - i];
            if (home.id !== 'bye' && away.id !== 'bye') schedule.push({ round: round + 1, homeTeamId: home.id, awayTeamId: away.id });
        }
        const lastTeam = localTeams.pop();
        if (lastTeam) localTeams.splice(1, 0, lastTeam);
    }
    return schedule;
};


// --- COMPONENTE PRINCIPAL ---
export default function TournamentFixturePage() {
    const router = useRouter();
    const params = useParams();
    const tournamentId = params.id as string;
    const { user, loading: userLoading } = useUser();
    const { toast } = useToast();

    const [pageState, setPageState] = useState<PageState>('LOADING');
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);

    const updateMatchData = (matchId: string, path: string, value: any) => {
        set(ref(db, `matches/${matchId}/${path}`), value);
    };

    const updateMatchScoreFromStats = useCallback(async (matchId: string) => {
        const matchStatsSnap = await get(ref(db, `match_stats/${matchId}`));
        if (!matchStatsSnap.exists()) return { homeScore: 0, awayScore: 0 };

        const matchRef = ref(db, `matches/${matchId}`);
        const matchSnap = await get(matchRef);
        if (!matchSnap.exists()) return { homeScore: 0, awayScore: 0 };
        const matchData = matchSnap.val();

        const homeTeam = teams.find(t => t.id === matchData.homeTeamId);
        const awayTeam = teams.find(t => t.id === matchData.awayTeamId);

        if (!homeTeam?.players || !awayTeam?.players) return { homeScore: 0, awayScore: 0 };

        const homePlayerIds = Object.keys(homeTeam.players);
        const awayPlayerIds = Object.keys(awayTeam.players);
        const stats: { [playerId: string]: PlayerStatsInfo } = matchStatsSnap.val();

        let homeScore = 0;
        let awayScore = 0;

        for (const playerId in stats) {
            const playerGoals = stats[playerId].goals || 0;
            if (homePlayerIds.includes(playerId)) homeScore += playerGoals;
            else if (awayPlayerIds.includes(playerId)) awayScore += playerGoals;
        }

        await update(ref(db, `matches/${matchId}/result`), { home: homeScore, away: awayScore });
        return { homeScore, awayScore };
    }, [teams]);

    const handleStatsSaved = useCallback(async (match: Match) => {
        if (!tournament) return;

        try {
            const { homeScore, awayScore } = await updateMatchScoreFromStats(match.id);
            toast({ title: "Paso 1/4: Marcador Actualizado", description: `Resultado guardado: ${homeScore} - ${awayScore}.` });

            await update(ref(db, `matches/${match.id}`), { status: 'finished' });
            toast({ title: "Paso 2/4: Partido Cerrado" });

            await calculateTournamentStats(tournament.id, teams);
            toast({ title: "Paso 3/4: Tablas del Torneo Actualizadas" });

            await updatePlayerGlobalStats(match.id, tournament.id, tournament.name);
            toast({ title: "Paso 4/4: Ranking Global Actualizado", className: "bg-green-500 text-white" });

        } catch (error) {
            console.error("Error en guardado de stats:", error);
            toast({ title: "Error en el Proceso", variant: "destructive" });
        }
    }, [updateMatchScoreFromStats, tournament, teams, toast]);
    
    const handleReopenMatch = useCallback(async (match: Match) => {
        if (!tournament) return;
        try {
            await revertMatchStats(match.id, tournament.id);
            toast({ title: "Paso 1/2: Stats Globales Revertidas" });

            const updates: { [key: string]: any } = {};
            updates[`/matches/${match.id}/status`] = 'pending';
            updates[`/matches/${match.id}/statsProcessed`] = false;
            await update(ref(db), updates);
            await calculateTournamentStats(tournament.id, teams);
            toast({ title: "Paso 2/2: Partido Reabierto", className: "bg-blue-500 text-white" });

        } catch (error) {
            console.error("Error al reabrir el partido:", error);
            toast({ title: "Error al Reabrir", variant: "destructive" });
        }
    }, [tournament, teams, toast]);

    const handleDeleteMatch = async (matchId: string) => {
        try {
            await remove(ref(db, `matches/${matchId}`));
            toast({ title: "Partido Eliminado", description: "El partido ha sido eliminado del fixture." });
        } catch (error) {
            console.error("Error deleting match:", error);
            toast({ title: "Error", description: "No se pudo eliminar el partido.", variant: "destructive" });
        }
    };


    useEffect(() => {
        if (userLoading) return;
        if (!user || user.role !== 'admin') { setPageState('ACCESS_DENIED'); return; }
        if (!tournamentId) { setPageState('NOT_FOUND'); return; }

        const tournamentRef = ref(db, `tournaments/${tournamentId}`);
        const unsubscribeTournament = onValue(tournamentRef, async (snapshot) => {
            if (snapshot.exists()) {
                const tournamentData = snapshot.val();
                setTournament({ id: snapshot.key, ...tournamentData });
                if (tournamentData.teams) {
                    const teamIds = Object.keys(tournamentData.teams);
                    const teamsPromises = teamIds.map(id => get(ref(db, `teams/${id}`)).then(s => s.exists() ? { id: s.key, ...s.val() } : null));
                    const teamsData = (await Promise.all(teamsPromises)).filter((t): t is Team => t !== null);
                    setTeams(teamsData);
                }
                setPageState('READY');
            } else { setPageState('NOT_FOUND'); }
        });

        const matchesQuery = ref(db, 'matches');
        const unsubscribeMatches = onValue(matchesQuery, (snapshot) => {
            const allMatches = snapshot.val() || {};
            const filtered = Object.values(allMatches).filter((m: any) => m.tournamentId === tournamentId).sort((a: any, b: any) => a.round - b.round) as Match[];
            setMatches(filtered);
        });

        const statsRef = ref(db, `tournament_stats/${tournamentId}`);
        const unsubscribeStats = onValue(statsRef, (snapshot) => setStats(snapshot.val()));

        return () => { unsubscribeTournament(); unsubscribeMatches(); unsubscribeStats(); };
    }, [tournamentId, user, userLoading]);

    useEffect(() => {
        if (pageState === 'ACCESS_DENIED' || pageState === 'NOT_FOUND') {
            const timer = setTimeout(() => router.push(pageState === 'ACCESS_DENIED' ? '/' : '/admin/manage-tournaments'), 3000);
            return () => clearTimeout(timer);
        }
    }, [pageState, router]);
    
    const handleGenerateFixture = async () => {
        if (teams.length < 2) { toast({ title: "No hay suficientes equipos", variant: "destructive" }); return; }
        setIsGenerating(true);
        try {
            const fixtureSchedule = generateRoundRobinFixture(teams);
            const updates: { [key: string]: any } = {};
            fixtureSchedule.forEach(match => {
                const matchId = `match_${tournamentId}_r${match.round}_${match.homeTeamId.substring(0,4)}_${match.awayTeamId.substring(0,4)}_${Math.random().toString(36).substring(2, 7)}`;
                updates[`/matches/${matchId}`] = { id: matchId, tournamentId, round: match.round, homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId, status: 'pending', result: { home: null, away: null } };
            });
            await update(ref(db), updates);
            toast({ title: "¡Fixture Generado!" });
        } catch (error) { console.error(error); toast({ title: "Error al generar fixture", variant: "destructive" });
        } finally { setIsGenerating(false); }
    };

    const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || 'Equipo...';
    
    const rounds = useMemo(() => {
        const roundsMap = matches.reduce((acc, match) => {
            if (!acc[match.round]) acc[match.round] = [];
            acc[match.round].push(match);
            return acc;
        }, {} as { [round: number]: Match[] });
        return Object.entries(roundsMap).sort(([a], [b]) => Number(a) - Number(b));
    }, [matches]);

    if (pageState === 'LOADING') return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /><p className="ml-4 text-lg">Cargando...</p></div>;
    if (pageState === 'ACCESS_DENIED') return <div className="flex flex-col h-screen items-center justify-center text-center p-4"><ShieldAlert className="h-16 w-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Acceso Denegado</h1></div>;
    if (pageState === 'NOT_FOUND') return <div className="flex flex-col h-screen items-center justify-center text-center p-4"><XCircle className="h-16 w-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Torneo no Encontrado</h1></div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/admin/manage-tournaments"><Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
                <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">{tournament?.name}</h1><p className="text-muted-foreground">Gestiona el fixture, resultados y estadísticas del torneo.</p></div>
                <Tabs defaultValue="fixture">
                    <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="fixture">Fixture</TabsTrigger><TabsTrigger value="positions">Posiciones</TabsTrigger><TabsTrigger value="scorers">Goleadores</TabsTrigger><TabsTrigger value="sanctions">Sanciones</TabsTrigger></TabsList>
                    <TabsContent value="fixture" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Partidos del Torneo</CardTitle>
                                    <CardDescription>Carga o corrige las estadísticas de un partido. El sistema recalculará todo automáticamente.</CardDescription>
                                </div>
                                <Button onClick={() => setIsAddMatchDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Partido</Button>
                            </CardHeader>
                            <CardContent>
                                {matches.length > 0 ? (
                                    <Tabs defaultValue={`round-${rounds[0]?.[0]}`} className="w-full">
                                        <TabsList>{rounds.map(([roundNum]) => <TabsTrigger key={roundNum} value={`round-${roundNum}`}>FECHA {roundNum}</TabsTrigger>)}</TabsList>
                                        {rounds.map(([roundNum, roundMatches]) => (
                                            <TabsContent key={roundNum} value={`round-${roundNum}`}>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                                    {roundMatches.map(match => (
                                                        <Card key={match.id} className={match.status === 'finished' ? 'bg-green-900/20 border-green-500' : ''}>
                                                            <CardHeader><CardTitle className="text-lg">{getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}</CardTitle></CardHeader>
                                                            <CardContent className="space-y-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Input readOnly type="number" placeholder="-" className="w-16 h-12 text-center text-lg font-bold bg-muted/50" value={match.result?.home ?? ''} />
                                                                    <span className="text-2xl font-bold">-</span>
                                                                    <Input readOnly type="number" placeholder="-" className="w-16 h-12 text-center text-lg font-bold bg-muted/50" value={match.result?.away ?? ''} />
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                                    <Input type="date" className="h-8" defaultValue={match.details?.date || ''} onBlur={(e) => updateMatchData(match.id, 'details/date', e.target.value)} disabled={match.status === 'finished'}/>
                                                                    <Input type="time" className="h-8" defaultValue={match.details?.time || ''} onBlur={(e) => updateMatchData(match.id, 'details/time', e.target.value)} disabled={match.status === 'finished'}/>
                                                                    <Input placeholder="Árbitro" className="h-8" defaultValue={match.details?.referee || ''} onBlur={(e) => updateMatchData(match.id, 'details/referee', e.target.value)} disabled={match.status === 'finished'}/>
                                                                </div>
                                                            </CardContent>
                                                            <CardContent className="flex items-center justify-between">
                                                                <MatchStatsDialog 
                                                                    matchId={match.id} 
                                                                    tournamentId={tournamentId} 
                                                                    homeTeamId={match.homeTeamId} 
                                                                    awayTeamId={match.awayTeamId} 
                                                                    isFinished={match.status === 'finished'}
                                                                    onStatsSaved={() => handleStatsSaved(match)}
                                                                />
                                                                
                                                                {match.status === 'pending' && typeof match.statsProcessed === 'undefined' && (
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>¿Eliminar este partido?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Esta acción eliminará permanentemente el partido del fixture. No se puede deshacer.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => handleDeleteMatch(match.id)} className="bg-destructive hover:bg-destructive/80">Sí, Eliminar</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}

                                                                {match.status === 'finished' && (
                                                                     <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" /> Corregir</Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>¿Reabrir partido para corregir?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Esta acción revertirá las estadísticas globales de los jugadores y reabrirá el partido para que puedas editar los datos. Las tablas del torneo se recalcularán. Es un proceso seguro. ¿Estás seguro?
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => handleReopenMatch(match)} className="bg-destructive hover:bg-destructive/80">Sí, Reabrir</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                        <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No hay fixture</h3><p className="mt-2 text-sm text-muted-foreground">Aún no se han generado los partidos.</p>
                                        <AlertDialog><AlertDialogTrigger asChild><Button className="mt-6" disabled={isGenerating || teams.length < 2}><PlusCircle className="mr-2 h-4 w-4" />Generar Fixture</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar?</AlertDialogTitle><AlertDialogDescription>Se crearán partidos para los {teams.length} equipos.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleGenerateFixture}>Sí, generar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="positions" className="mt-6"><Card><CardHeader><CardTitle>Tabla de Posiciones</CardTitle></CardHeader><CardContent>{stats?.positions && stats.positions.length > 0 ? <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Equipo</TableHead><TableHead>PJ</TableHead><TableHead>G</TableHead><TableHead>E</TableHead><TableHead>P</TableHead><TableHead>GF</TableHead><TableHead>GC</TableHead><TableHead>DG</TableHead><TableHead>Ptos</TableHead></TableRow></TableHeader><TableBody>{stats.positions.map((pos, i) => <TableRow key={pos.teamId}><TableCell>{i+1}</TableCell><TableCell>{pos.teamName}</TableCell><TableCell>{pos.played}</TableCell><TableCell>{pos.won}</TableCell><TableCell>{pos.drawn}</TableCell><TableCell>{pos.lost}</TableCell><TableCell>{pos.gf}</TableCell><TableCell>{pos.gc}</TableCell><TableCell>{pos.dg}</TableCell><TableCell>{pos.points}</TableCell></TableRow>)}</TableBody></Table></div> : <p>No hay datos.</p>}</CardContent></Card></TabsContent>
                    <TabsContent value="scorers" className="mt-6"><Card><CardHeader><CardTitle>Goleadores</CardTitle></CardHeader><CardContent>{stats?.scorers && stats.scorers.length > 0 ? <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead>Goles</TableHead></TableRow></TableHeader><TableBody>{stats.scorers.map((s, i) => <TableRow key={s.playerInfo.id}><TableCell>{i+1}</TableCell><TableCell>{s.playerInfo.name}</TableCell><TableCell>{s.teamName}</TableCell><TableCell>{s.goals}</TableCell></TableRow>)}</TableBody></Table></div> : <p>No hay datos.</p>}</CardContent></Card></TabsContent>
                    <TabsContent value="sanctions" className="mt-6"><Card><CardHeader><CardTitle>Sanciones</CardTitle></CardHeader><CardContent>{stats?.sanctions && stats.sanctions.length > 0 ? <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead>Amarillas</TableHead><TableHead>Rojas</TableHead></TableRow></TableHeader><TableBody>{stats.sanctions.map(p => <TableRow key={p.playerInfo.id}><TableCell>{p.playerInfo.name}</TableCell><TableCell>{p.teamName}</TableCell><TableCell>{p.yellowCards}</TableCell><TableCell>{p.redCards}</TableCell></TableRow>)}</TableBody></Table></div> : <p>No hay datos.</p>}</CardContent></Card></TabsContent>
                </Tabs>
                 <AddMatchDialog
                    tournamentId={tournamentId}
                    teams={teams}
                    open={isAddMatchDialogOpen}
                    onOpenChange={setIsAddMatchDialogOpen}
                />
            </div>
        </div>
    );
}
