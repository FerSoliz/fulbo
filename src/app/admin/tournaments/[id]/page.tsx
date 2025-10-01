'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb, ref, onValue, update, set, get } from '@/lib/firebase';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';

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
import { ArrowLeft, Loader2, ShieldCheck, Trophy, PlusCircle, ListOrdered, XCircle, ShieldAlert } from 'lucide-react';
import { PlanillaPartidoSVG } from '@/components/planilla-partido-svg';
import { toPng } from 'html-to-image';
import React from 'react';

// Tipos
interface Tournament { id: string; name: string; teamCount: number; teams: { [key: string]: { roster: { [playerId: string]: Player } } }; }
interface Team { id: string; name: string; logoUrl: string; }
interface Player { id: string; name: string; lastName: string; dni: string; }
interface PlayerStatsInfo { goals: number; yellowCards: number; redCard: boolean; }
interface Match { id: string; tournamentId: string; round: number; homeTeamId: string; awayTeamId: string; status: 'pending' | 'finished'; result?: { home: number | null; away: number | null }; details?: { date: string; time: string; referee: string }; }
interface Stats { positions: any[]; scorers: any[]; sanctions: any[]; }
type PageState = 'LOADING' | 'ACCESS_DENIED' | 'NOT_FOUND' | 'READY';

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
    const planillaRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

    const handleDownloadPlanilla = useCallback(async (matchId: string, roundNumber: number) => {
        const node = planillaRefs.current[matchId];
        if (node) {
            try {
                const dataUrl = await toPng(node);
                const link = document.createElement('a');
                link.download = `Planilla_Fecha${roundNumber}_${tournament?.name || 'Torneo'}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error('oops, something went wrong!', err);
                toast({ title: 'Error al descargar', description: 'No se pudo generar la imagen de la planilla.', variant: 'destructive' });
            }
        }
    }, [tournament?.name, toast]);


    const calculateAndSaveStats = useCallback(async () => {
        if (!tournament || !tournament.teams) return;

        const [matchesSnapshot, matchStatsSnapshot] = await Promise.all([
            get(ref(rtdb, 'matches')),
            get(ref(rtdb, 'match_stats'))
        ]);

        const allMatches: Match[] = Object.values(matchesSnapshot.val() || {}).filter((m: any) => m.tournamentId === tournamentId);
        const finishedMatches = allMatches.filter(m => m.status === 'finished');
        const allMatchStats: { [matchId: string]: { [playerId: string]: PlayerStatsInfo } } = matchStatsSnapshot.val() || {};

        const teamStats: { [teamId: string]: any } = teams.reduce((acc, team) => ({ ...acc, [team.id]: { teamId: team.id, teamName: team.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, gc: 0, dg: 0, points: 0 } }), {});
        finishedMatches.forEach(match => {
            const homeScore = match.result?.home ?? 0, awayScore = match.result?.away ?? 0;
            const home = teamStats[match.homeTeamId], away = teamStats[match.awayTeamId];
            if(home) { home.played++; home.gf += homeScore; home.gc += awayScore; }
            if(away) { away.played++; away.gf += awayScore; away.gc += homeScore; }
            if (homeScore > awayScore) { if(home) { home.won++; home.points += 3; } if(away) { away.lost++; } }
            else if (awayScore > homeScore) { if(away) { away.won++; away.points += 3; } if(home) { home.lost++; } }
            else { if(home) { home.drawn++; home.points += 1; } if(away) { away.drawn++; away.points += 1; } }
        });
        Object.values(teamStats).forEach(team => { team.dg = team.gf - team.gc; });
        const sortedPositions = Object.values(teamStats).sort((a, b) => b.points - a.points || b.dg - a.dg || b.gf - a.gf);

        const playerTotals: { [playerId: string]: { playerInfo: Player, teamId: string, teamName: string, goals: number, yellowCards: number, redCards: number } } = {};
        for (const teamId in tournament.teams) {
            const team = teams.find(t => t.id === teamId);
            if (tournament.teams[teamId].roster && team) {
                for (const playerId in tournament.teams[teamId].roster) {
                    const player = tournament.teams[teamId].roster[playerId];
                    playerTotals[playerId] = { playerInfo: player, teamId: teamId, teamName: team.name, goals: 0, yellowCards: 0, redCards: 0 };
                }
            }
        }

        finishedMatches.forEach(match => {
            const matchStats = allMatchStats[match.id];
            if (matchStats) {
                for (const playerId in matchStats) {
                    if (playerTotals[playerId]) {
                        playerTotals[playerId].goals += matchStats[playerId].goals || 0;
                        playerTotals[playerId].yellowCards += matchStats[playerId].yellowCards || 0;
                        if (matchStats[playerId].redCard) playerTotals[playerId].redCards += 1;
                    }
                }
            }
        });

        const allPlayerStats = Object.values(playerTotals);
        const sortedScorers = allPlayerStats.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals || a.playerInfo.lastName.localeCompare(b.playerInfo.lastName));
        const sortedSanctions = allPlayerStats.filter(p => p.redCards > 0 || p.yellowCards > 0).sort((a, b) => b.redCards - a.redCards || b.yellowCards - a.yellowCards);

        await set(ref(rtdb, `tournament_stats/${tournamentId}`), { 
            positions: sortedPositions,
            scorers: sortedScorers,
            sanctions: sortedSanctions
        });
        toast({ title: "Estadísticas recalculadas", description: "La tabla de posiciones, goleadores y sanciones ha sido actualizada." });
    }, [tournamentId, teams, tournament, toast]);

    useEffect(() => {
        if (userLoading) return;
        if (!user || user.role !== 'admin') { setPageState('ACCESS_DENIED'); return; }
        if (!tournamentId) { setPageState('NOT_FOUND'); return; }

        const tournamentRef = ref(rtdb, `tournaments/${tournamentId}`);
        const unsubscribeTournament = onValue(tournamentRef, async (snapshot) => {
            if (snapshot.exists()) {
                const tournamentData = snapshot.val();
                setTournament({ id: snapshot.key, ...tournamentData });
                if (tournamentData.teams) {
                    const teamIds = Object.keys(tournamentData.teams);
                    const teamsData = await Promise.all(teamIds.map(id => get(ref(rtdb, `teams/${id}`)).then(snap => ({ id: snap.key, ...snap.val() }))));
                    setTeams(teamsData.filter(t => t.id));
                }
                setPageState('READY');
            } else {
                setPageState('NOT_FOUND');
            }
        });

        const matchesRef = ref(rtdb, 'matches');
        const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
            const allMatches = snapshot.val() || {};
            setMatches(Object.values(allMatches).filter((m: any) => m.tournamentId === tournamentId).sort((a: any, b: any) => a.round - b.round) as Match[]);
        });

        const statsRef = ref(rtdb, `tournament_stats/${tournamentId}`);
        const unsubscribeStats = onValue(statsRef, (snapshot) => setStats(snapshot.val()));

        return () => { unsubscribeTournament(); unsubscribeMatches(); unsubscribeStats(); };
    }, [tournamentId, user, userLoading, router]);

    useEffect(() => {
        if (pageState === 'ACCESS_DENIED' || pageState === 'NOT_FOUND') {
            const destination = pageState === 'ACCESS_DENIED' ? '/' : '/admin/manage-tournaments';
            const timer = setTimeout(() => router.push(destination), 4000);
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
            await update(ref(rtdb), updates);
            toast({ title: "¡Fixture Generado!" });
        } catch (error) { console.error(error); toast({ title: "Error al generar fixture", variant: "destructive" });
        } finally { setIsGenerating(false); }
    };

    const updateMatchData = (matchId: string, path: string, value: any) => {
      set(ref(rtdb, `matches/${matchId}/${path}`), value);
    };

    const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || 'Equipo...';
    const rounds = useMemo(() => Object.entries(matches.reduce((acc, match) => ({ ...acc, [match.round]: [...(acc[match.round] || []), match] }), {} as { [round: number]: Match[] })).sort(([a], [b]) => Number(a) - Number(b)), [matches]);

    if (pageState === 'LOADING') return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /><p className="ml-4 text-lg">Cargando...</p></div>;
    if (pageState === 'ACCESS_DENIED') return <div className="flex flex-col h-screen items-center justify-center text-center p-4"><ShieldAlert className="h-16 w-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Acceso Denegado</h1><p className="text-muted-foreground mt-2">No tienes permiso. Serás redirigido.</p></div>;
    if (pageState === 'NOT_FOUND') return <div className="flex flex-col h-screen items-center justify-center text-center p-4"><XCircle className="h-16 w-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Torneo no Encontrado</h1><p className="text-muted-foreground mt-2">Serás redirigido.</p></div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/admin/manage-tournaments"><Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
                <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">{tournament?.name}</h1><p className="text-muted-foreground">Gestiona el fixture, resultados y estadísticas del torneo.</p></div>
                <Tabs defaultValue="fixture">
                    <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="fixture">Fixture</TabsTrigger><TabsTrigger value="positions">Posiciones</TabsTrigger><TabsTrigger value="scorers">Goleadores</TabsTrigger><TabsTrigger value="sanctions">Sanciones</TabsTrigger></TabsList>
                    <TabsContent value="fixture" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Partidos del Torneo</CardTitle><CardDescription>Carga los resultados. Los cambios se guardan automáticamente.</CardDescription></CardHeader>
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
                                                                    <Input type="number" placeholder="-" className="w-16 h-12 text-center text-lg font-bold" defaultValue={match.result?.home ?? ''} onBlur={(e) => updateMatchData(match.id, 'result/home', e.target.value === '' ? null : Number(e.target.value))} disabled={match.status === 'finished'} />
                                                                    <span className="text-2xl font-bold">-</span>
                                                                    <Input type="number" placeholder="-" className="w-16 h-12 text-center text-lg font-bold" defaultValue={match.result?.away ?? ''} onBlur={(e) => updateMatchData(match.id, 'result/away', e.target.value === '' ? null : Number(e.target.value))} disabled={match.status === 'finished'} />
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                                    <Input type="date" className="h-8" defaultValue={match.details?.date || ''} onBlur={(e) => updateMatchData(match.id, 'details/date', e.target.value)} disabled={match.status === 'finished'}/>
                                                                    <Input type="time" className="h-8" defaultValue={match.details?.time || ''} onBlur={(e) => updateMatchData(match.id, 'details/time', e.target.value)} disabled={match.status === 'finished'}/>
                                                                    <Input placeholder="Árbitro" className="h-8" defaultValue={match.details?.referee || ''} onBlur={(e) => updateMatchData(match.id, 'details/referee', e.target.value)} disabled={match.status === 'finished'}/>
                                                                </div>
                                                            </CardContent>
                                                            <CardContent className="flex items-center justify-between">
                                                                <MatchStatsDialog matchId={match.id} tournamentId={tournamentId} homeTeamId={match.homeTeamId} awayTeamId={match.awayTeamId} isFinished={match.status === 'finished'} />
                                                                <div className="flex items-center space-x-2">
                                                                    <Label htmlFor={`finished-${match.id}`}>Finalizado</Label>
                                                                    <Switch id={`finished-${match.id}`} checked={match.status === 'finished'} onCheckedChange={(checked) => { updateMatchData(match.id, 'status', checked ? 'finished' : 'pending'); if(checked) calculateAndSaveStats(); }} />
                                                                </div>
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
                    <TabsContent value="positions" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Tabla de Posiciones</CardTitle><CardDescription>Se actualiza al finalizar un partido.</CardDescription></CardHeader>
                            <CardContent>
                                {stats?.positions && stats.positions.length > 0 ? (
                                    <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead className="w-[40px]">#</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">PJ</TableHead><TableHead className="text-center">G</TableHead><TableHead className="text-center">E</TableHead><TableHead className="text-center">P</TableHead><TableHead className="hidden md:table-cell text-center">GF</TableHead><TableHead className="hidden md:table-cell text-center">GC</TableHead><TableHead className="hidden md:table-cell text-center">DG</TableHead><TableHead className="text-right">Puntos</TableHead></TableRow></TableHeader><TableBody>{stats.positions.map((pos, index) => (<TableRow key={pos.teamId}><TableCell className="font-bold">{index + 1}</TableCell><TableCell>{pos.teamName}</TableCell><TableCell className="text-center">{pos.played}</TableCell><TableCell className="text-center">{pos.won}</TableCell><TableCell className="text-center">{pos.drawn}</TableCell><TableCell className="text-center">{pos.lost}</TableCell><TableCell className="hidden md:table-cell text-center">{pos.gf}</TableCell><TableCell className="hidden md:table-cell text-center">{pos.gc}</TableCell><TableCell className="hidden md:table-cell text-center">{pos.dg}</TableCell><TableCell className="text-right font-bold">{pos.points}</TableCell></TableRow>))}</TableBody></Table></div>
                                ) : <p className="text-muted-foreground text-center py-4">No hay datos de posiciones. Finaliza un partido para empezar a calcular.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="scorers" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Tabla de Goleadores</CardTitle><CardDescription>Se actualiza al finalizar un partido.</CardDescription></CardHeader>
                             <CardContent>
                                {stats?.scorers && stats.scorers.length > 0 ? (
                                    <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead className="w-[40px]">#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-right">Goles</TableHead></TableRow></TableHeader><TableBody>{stats.scorers.map((scorer, index) => (<TableRow key={scorer.playerInfo.id}><TableCell className="font-bold">{index + 1}</TableCell><TableCell>{`${scorer.playerInfo.name} ${scorer.playerInfo.lastName}`}</TableCell><TableCell>{scorer.teamName}</TableCell><TableCell className="text-right font-bold">{scorer.goals}</TableCell></TableRow>))}</TableBody></Table></div>
                                ) : <p className="text-muted-foreground text-center py-4">No hay goleadores todavía.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="sanctions" className="mt-6">
                        <Card>
                            <CardHeader><CardTitle>Tabla de Sanciones</CardTitle><CardDescription>Se actualiza al finalizar un partido.</CardDescription></CardHeader>
                             <CardContent>
                                {stats?.sanctions && stats.sanctions.length > 0 ? (
                                    <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">Amarillas</TableHead><TableHead className="text-center">Rojas</TableHead></TableRow></TableHeader><TableBody>{stats.sanctions.map((p, index) => (<TableRow key={p.playerInfo.id}><TableCell>{`${p.playerInfo.name} ${p.playerInfo.lastName}`}</TableCell><TableCell>{p.teamName}</TableCell><TableCell className="text-center font-bold">{p.yellowCards}</TableCell><TableCell className="text-center font-bold">{p.redCards}</TableCell></TableRow>))}</TableBody></Table></div>
                                ) : <p className="text-muted-foreground text-center py-4">No hay jugadores sancionados.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
