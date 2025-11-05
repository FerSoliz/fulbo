
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ref, onValue, update, set, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { saveMatchStatsAndRecalculate, revertMatchStats, calculateTournamentStats } from '@/lib/firebase/stats';

import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MatchStatsDialog } from '@/components/match-stats-dialog';
import { AddMatchDialog } from '@/components/add-match-dialog';
import { CreatePlayoffsDialog } from '@/components/admin/CreatePlayoffsDialog';
import { PlayoffBracket } from '@/components/admin/PlayoffBracket';
import { ArrowLeft, Loader2, ListOrdered, PlusCircle, XCircle, ShieldAlert, Pencil, Trash2, Video, VideoOff, Trophy } from 'lucide-react';

import { Tournament, Team, Match, Stats, PageState, MatchStats } from '@/lib/types';

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
    const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
    const [isPlayoffsDialogOpen, setIsPlayoffsDialogOpen] = useState(false);
    const [editingVideoMatchId, setEditingVideoMatchId] = useState<string | null>(null);

    const { regularSeasonMatches, playoffMatches, playoffStages } = useMemo(() => {
        const regular = matches.filter(match => !match.stage);
        const playoffs = matches.filter(match => !!match.stage);
        const stageOrder = ['16vos de Final', 'Octavos de Final', 'Cuartos de Final', 'Semifinales', 'Final'];
        const stages = [...new Set(playoffs.map(match => match.stage))].sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b));
        return { regularSeasonMatches: regular, playoffMatches: playoffs, playoffStages: stages };
    }, [matches]);
    
    const playoffBracketData = useMemo(() => {
      if (playoffMatches.length === 0) return [];
  
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
  
    }, [playoffMatches, teams]);

    const allRegularSeasonMatchesFinished = useMemo(() => {
        if (regularSeasonMatches.length === 0) return false;
        return regularSeasonMatches.every(match => match.status === 'finished');
    }, [regularSeasonMatches]);

    const updateMatchData = (matchId: string, path: string, value: any) => {
        set(ref(db, `matches/${matchId}/${path}`), value);
    };
    
    const handleConfirmStats = useCallback(async (match: Match, newStats: MatchStats) => {
        if (!tournament) return;
        
        try {
            toast({ title: "Paso 1/4: Guardando planilla..." });
            await saveMatchStatsAndRecalculate(match.id, newStats, match.homeTeamId);
            toast({ title: "Paso 2/4: Planilla guardada y partido cerrado" });

            const matchSnap = await get(ref(db, `matches/${match.id}`));
            const updatedMatch = matchSnap.val();

            if (updatedMatch.advancesToMatchId && updatedMatch.advancesToPosition) {
                const winnerId = updatedMatch.result.home > updatedMatch.result.away ? updatedMatch.homeTeamId : updatedMatch.awayTeamId;
                const nextMatchRef = ref(db, `matches/${updatedMatch.advancesToMatchId}/${updatedMatch.advancesToPosition === 'home' ? 'homeTeamId' : 'awayTeamId'}`);
                await set(nextMatchRef, winnerId);
                toast({ title: "¡Equipo avanza en playoffs!", className: "bg-blue-500 text-white" });
            }

            if (!match.stage) {
                 await calculateTournamentStats(tournament.id, teams);
                 toast({ title: "Paso 3/4: Tablas del Torneo Actualizadas" });
            }

            await updatePlayerGlobalStats(match.id, tournament.id, tournament.name);
            toast({ title: "Paso 4/4: Ranking Global Actualizado", className: "bg-green-500 text-white" });

        } catch (error) {
            console.error("Error en el proceso de guardado de stats:", error);
            toast({ title: "Error en el Proceso", description: "Ocurrió un error al guardar y procesar los datos.", variant: "destructive" });
        }
    }, [tournament, teams, toast]);

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
            const filtered = Object.values(allMatches).filter((m: any) => m.tournamentId === tournamentId).sort((a: any, b: any) => (a.round || 0) - (b.round || 0)) as Match[];
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

    const getTeamName = (teamId: string) => {
        if (teamId.startsWith('winner-') || teamId.startsWith('Ganador')) return teamId;
        return teams.find(t => t.id === teamId)?.name || 'Equipo...';
    }
    
    const rounds = useMemo(() => {
        const roundsMap = regularSeasonMatches.reduce((acc, match) => {
            const roundNum = match.round || 0;
            if (!acc[roundNum]) acc[roundNum] = [];
            acc[roundNum].push(match);
            return acc;
        }, {} as { [round: number]: Match[] });
        return Object.entries(roundsMap).sort(([a], [b]) => Number(a) - Number(b));
    }, [regularSeasonMatches]);

    const renderMatchCard = (match: Match) => (
        <Card key={match.id} className={match.status === 'finished' ? 'bg-green-900/20 border-green-500' : ''}>
            <CardHeader><CardTitle className="text-lg">{getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                    <Input readOnly type="number" placeholder="-" className="w-16 h-12 text-center text-lg font-bold bg-muted/50" value={match.result?.home ?? ''} />
                    <span className="text-2xl font-bold">-</span>
                    <Input readOnly type="number" placeholder="-" className="w-16 h-12 text-center text-lg font-bold bg-muted/50" value={match.result?.away ?? ''} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <Input type="date" className="h-8" defaultValue={match.details?.date || ''} onBlur={(e) => updateMatchData(match.id, 'details/date', e.target.value)} disabled={match.status === 'finished'}/>
                    <Input type="time" className="h-8" defaultValue={match.details?.time || ''} onBlur={(e) => updateMatchData(match.id, 'details/time', e.target.value)} disabled={match.status === 'finished'}/>
                    <Input placeholder="Árbitro" className="h-8" defaultValue={match.details?.referee || ''} onBlur={(e) => updateMatchData(match.id, 'details/referee', e.target.value)} disabled={match.status === 'finished'}/>
                    <div className="relative">
                        {editingVideoMatchId === match.id ? (
                            <Input
                                placeholder="URL Video"
                                className="h-8 pr-8"
                                defaultValue={match.details?.videoUrl || ''}
                                onBlur={(e) => { updateMatchData(match.id, 'details/videoUrl', e.target.value); setEditingVideoMatchId(null); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { updateMatchData(match.id, 'details/videoUrl', e.currentTarget.value); setEditingVideoMatchId(null); } }}
                                autoFocus
                            />
                        ) : (
                            <Button variant="outline" size="sm" className="h-8 w-full justify-start px-2 font-normal text-muted-foreground" onClick={() => setEditingVideoMatchId(match.id)}>
                                {match.details?.videoUrl ? <Video className="h-4 w-4 mr-2 text-green-400" /> : <VideoOff className="h-4 w-4 mr-2" />}
                                <span className="truncate">{match.details?.videoUrl ? 'Ver/Editar' : 'Añadir video'}</span>
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardContent className="flex items-center justify-between">
                 <MatchStatsDialog 
                    matchId={match.id}
                    homeTeamId={match.homeTeamId}
                    awayTeamId={match.awayTeamId}
                    isFinished={match.status === 'finished'}
                    onConfirm={(newStats) => handleConfirmStats(match, newStats)}
                 />
                
                {match.status === 'pending' && typeof match.statsProcessed === 'undefined' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar este partido?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMatch(match.id)} className="bg-destructive hover:bg-destructive/80">Sí, Eliminar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {match.status === 'finished' && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" /> Corregir</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Reabrir partido para corregir?</AlertDialogTitle><AlertDialogDescription>Esta acción revertirá las estadísticas y reabrirá el partido para edición. ¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleReopenMatch(match)} className="bg-destructive hover:bg-destructive/80">Sí, Reabrir</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardContent>
        </Card>
    );

    if (pageState === 'LOADING') return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /><p className="ml-4 text-lg">Cargando...</p></div>;
    if (pageState === 'ACCESS_DENIED') return <div className="flex flex-col h-screen items-center justify-center text-center p-4"><ShieldAlert className="h-16 w-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Acceso Denegado</h1></div>;
    if (pageState === 'NOT_FOUND') return <div className="flex flex-col h-screen items-center justify-center text-center p-4"><XCircle className="h-16 w-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Torneo no Encontrado</h1></div>;

    const hasPlayoffs = playoffMatches.length > 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/admin/manage-tournaments"><Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
                <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">{tournament?.name}</h1><p className="text-muted-foreground">Gestiona el fixture, resultados y estadísticas del torneo.</p></div>
                
                <div className="flex flex-wrap justify-start items-center gap-4 mb-4">
                    <Button onClick={() => setIsAddMatchDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Partido</Button>
                    {allRegularSeasonMatchesFinished && (
                        <Button variant="outline" onClick={() => setIsPlayoffsDialogOpen(true)}>
                            <Trophy className="mr-2 h-4 w-4 text-yellow-400" />
                            Crear Playoffs
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="fixture">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <TabsList className="inline-flex h-auto">
                            <TabsTrigger value="fixture">Fixture</TabsTrigger>
                            {hasPlayoffs && <TabsTrigger value="playoffs">Playoffs</TabsTrigger>}
                            <TabsTrigger value="positions">Posiciones</TabsTrigger>
                            <TabsTrigger value="scorers">Goleadores</TabsTrigger>
                            <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
                        </TabsList>
                    </ScrollArea>
                    
                    <TabsContent value="fixture" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Partidos del Torneo</CardTitle>
                                <CardDescription>Carga o corrige las estadísticas de un partido.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {matches.length > 0 ? (
                                    <Tabs defaultValue={regularSeasonMatches.length > 0 ? `round-1` : (playoffStages[0] || '')} className="w-full">
                                        <TabsList className="overflow-x-auto h-auto">
                                            {rounds.map(([roundNum]) => <TabsTrigger key={`round-${roundNum}`} value={`round-${roundNum}`}>FECHA {roundNum}</TabsTrigger>)}
                                            {playoffStages.map(stage => <TabsTrigger key={stage} value={stage}>{stage}</TabsTrigger>)}
                                        </TabsList>

                                        {rounds.map(([roundNum, roundMatches]) => (
                                            <TabsContent key={`content-round-${roundNum}`} value={`round-${roundNum}`}>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                                    {roundMatches.map(renderMatchCard)}
                                                </div>
                                            </TabsContent>
                                        ))}

                                        {playoffStages.map(stage => (
                                            <TabsContent key={`content-stage-${stage}`} value={stage}>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                                    {playoffMatches.filter(m => m.stage === stage).map(renderMatchCard)}
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
                    
                    {hasPlayoffs && (
                        <TabsContent value="playoffs" className="mt-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <PlayoffBracket rounds={playoffBracketData} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    <TabsContent value="positions" className="mt-6"><Card><CardHeader><CardTitle>Tabla de Posiciones</CardTitle></CardHeader><CardContent>{stats?.positions && stats.positions.length > 0 ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Equipo</TableHead><TableHead>PJ</TableHead><TableHead>G</TableHead><TableHead>E</TableHead><TableHead>P</TableHead><TableHead>GF</TableHead><TableHead>GC</TableHead><TableHead>DG</TableHead><TableHead>Ptos</TableHead></TableRow></TableHeader><TableBody>{stats.positions.map((pos, i) => <TableRow key={pos.teamId}><TableCell>{i+1}</TableCell><TableCell>{pos.teamName}</TableCell><TableCell>{pos.played}</TableCell><TableCell>{pos.won}</TableCell><TableCell>{pos.drawn}</TableCell><TableCell>{pos.lost}</TableCell><TableCell>{pos.gf}</TableCell><TableCell>{pos.gc}</TableCell><TableCell>{pos.dg}</TableCell><TableCell>{pos.points}</TableCell></TableRow>)}</TableBody></Table></div> : <p>No hay datos.</p>}</CardContent></Card></TabsContent>
                    <TabsContent value="scorers" className="mt-6"><Card><CardHeader><CardTitle>Goleadores</CardTitle></CardHeader><CardContent>{stats?.scorers && stats.scorers.length > 0 ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead>Goles</TableHead></TableRow></TableHeader><TableBody>{stats.scorers.map((s, i) => <TableRow key={s.playerInfo.id}><TableCell>{i+1}</TableCell><TableCell>{s.playerInfo.name}</TableCell><TableCell>{s.teamName}</TableCell><TableCell>{s.goals}</TableCell></TableRow>)}</TableBody></Table></div> : <p>No hay datos.</p>}</CardContent></Card></TabsContent>
                    <TabsContent value="sanctions" className="mt-6"><Card><CardHeader><CardTitle>Sanciones</CardTitle></CardHeader><CardContent>{stats?.sanctions && stats.sanctions.length > 0 ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead>Amarillas</TableHead><TableHead>Rojas</TableHead></TableRow></TableHeader><TableBody>{stats.sanctions.map(p => <TableRow key={p.playerInfo.id}><TableCell>{p.playerInfo.name}</TableCell><TableCell>{p.teamName}</TableCell><TableCell>{p.yellowCards}</TableCell><TableCell>{p.redCards}</TableCell></TableRow>)}</TableBody></Table></div> : <p>No hay datos.</p>}</CardContent></Card></TabsContent>
                </Tabs>
                 <AddMatchDialog
                    tournamentId={tournamentId}
                    teams={teams}
                    open={isAddMatchDialogOpen}
                    onOpenChange={setIsAddMatchDialogOpen}
                />
                {stats?.positions && (
                    <CreatePlayoffsDialog 
                        open={isPlayoffsDialogOpen}
                        onOpenChange={setIsPlayoffsDialogOpen}
                        tournamentId={tournamentId}
                        teams={teams}
                        positions={stats.positions}
                    />
                )}
            </div>
        </div>
    );
}
