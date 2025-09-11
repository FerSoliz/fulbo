'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ClipboardList,
  Table,
  Trophy,
  Users,
  BarChart,
  UploadCloud,
  Settings,
  PlusCircle,
  ShieldCheck,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MatchStatsDialog } from '@/components/match-stats-dialog';


// Mock data, this would come from your state management/API
const generateFixture = (teams: string[]) => {
  if (teams.length % 2 !== 0) teams.push('BYE');
  const rounds: { home: string; away: string }[][] = [];
  const numRounds = teams.length - 1;
  const half = teams.length / 2;
  for (let i = 0; i < numRounds; i++) {
    const round: { home: string; away: string }[] = [];
    for (let j = 0; j < half; j++) {
      round.push({ home: teams[j], away: teams[teams.length - 1 - j] });
    }
    teams.splice(1, 0, teams.pop()!);
    rounds.push(round);
  }
  return rounds;
};


export default function TournamentDetailsPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<any>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [fixture, setFixture] = useState<{ home: string; away: string }[][]>([]);
  const [isGroupStageFinished, setIsGroupStageFinished] = useState(false);
  const [matchResults, setMatchResults] = useState<any>({});
  const [finishedMatches, setFinishedMatches] = useState<Set<string>>(new Set());

  const [playoffMatches, setPlayoffMatches] = useState({
    quarter: [
      { team1: '', team2: '' },
      { team1: '', team2: '' },
      { team1: '', team2: '' },
      { team1: '', team2: '' },
    ],
    semi: [
      { team1: '', team2: '' },
      { team1: '', team2: '' },
    ],
    final: [{ team1: '', team2: '' }],
  });

  useEffect(() => {
    if (!tournamentId) return;

    const allTournaments = JSON.parse(
      localStorage.getItem('tournaments') || '[]'
    );
    const currentTournament = allTournaments.find(
      (t: any) => t.id === tournamentId
    );
    setTournament(currentTournament);
    
    const teamNames = JSON.parse(localStorage.getItem(`teams_${tournamentId}`) || '[]');
    setTeams(teamNames);

    if (teamNames.length > 0) {
      setFixture(generateFixture([...teamNames]));
    }

    const stageStatus = JSON.parse(localStorage.getItem(`groupStageStatus_${tournamentId}`) || 'false');
    setIsGroupStageFinished(stageStatus);

    const savedResults = JSON.parse(localStorage.getItem(`results_${tournamentId}`) || '{}');
    setMatchResults(savedResults);

    const savedFinished = JSON.parse(localStorage.getItem(`finished_matches_${tournamentId}`) || '[]');
    setFinishedMatches(new Set(savedFinished));

  }, [tournamentId]);

  const handleFinishGroupStage = () => {
    setIsGroupStageFinished(true);
    localStorage.setItem(`groupStageStatus_${tournamentId}`, JSON.stringify(true));
  };
  
  const handleResultChange = (roundIndex: number, matchIndex: number, team: 'home' | 'away', score: string) => {
    const matchId = `r${roundIndex}m${matchIndex}`;
    const newResults = {
      ...matchResults,
      [matchId]: {
        ...matchResults[matchId],
        [team]: score
      }
    };
    setMatchResults(newResults);
    localStorage.setItem(`results_${tournamentId}`, JSON.stringify(newResults));
  }


  const handlePlayoffTeamChange = (
    stage: 'quarter' | 'semi' | 'final',
    matchIndex: number,
    teamNumber: 'team1' | 'team2',
    teamName: string
  ) => {
    setPlayoffMatches((prev) => {
      const newStage = [...prev[stage]];
      newStage[matchIndex] = { ...newStage[matchIndex], [teamNumber]: teamName };
      return { ...prev, [stage]: newStage };
    });
  };
  
  const handleFinalizeMatch = (roundIndex: number, matchIndex: number, isFinalized: boolean) => {
    // This is the CRUCIAL logic update.
    // When a match is finalized, we recalculate everything.
    const matchId = `r${roundIndex}m${matchIndex}`;
    const newFinishedMatches = new Set(finishedMatches);
    if(isFinalized) {
        newFinishedMatches.add(matchId);
    } else {
        newFinishedMatches.delete(matchId);
    }
    setFinishedMatches(newFinishedMatches);
    localStorage.setItem(`finished_matches_${tournamentId}`, JSON.stringify(Array.from(newFinishedMatches)));

    // In a real app, this is where you'd trigger a server-side recalculation.
    // For now, we are implicitly relying on the fact that when the 'leagues' page
    // is loaded, it will read all this updated data from localStorage and
    // re-render the tables. The logic for calculation will live on the `leagues` page.
    console.log("Recalculating all tournament stats...");
  };


  const renderPlayoffStage = (
    title: string,
    stage: 'quarter' | 'semi' | 'final'
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {playoffMatches[stage].map((match, index) => (
          <div key={index} className="flex items-center justify-center gap-4">
            <Select
              onValueChange={(value) =>
                handlePlayoffTeamChange(stage, index, 'team1', value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Equipo 1" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="font-bold">VS</span>
            <Select
              onValueChange={(value) =>
                handlePlayoffTeamChange(stage, index, 'team2', value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Equipo 2" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin/manage-tournaments">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Administrar Torneos
          </Button>
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {tournament?.name || 'Cargando Torneo...'}
          </h1>
          <p className="text-muted-foreground">
            Gestiona el fixture, resultados y estadísticas del torneo.
          </p>
        </div>

        <Tabs defaultValue="results">
           <TabsList className="grid w-full grid-cols-6 text-xs">
            <TabsTrigger value="results">CARGAR</TabsTrigger>
            <TabsTrigger value="positions">POSICIONES</TabsTrigger>
            <TabsTrigger value="scorers">GOLEADORES</TabsTrigger>
            <TabsTrigger value="goalkeepers">VALLA</TabsTrigger>
            <TabsTrigger value="sanctions">SANCIONES</TabsTrigger>
            <TabsTrigger value="penalties">PENALES</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Fixture y Resultados</CardTitle>
                        <CardDescription>
                          Carga los resultados de cada partido.
                        </CardDescription>
                    </div>
                    {tournament?.format === 'grupos-y-playoffs' && !isGroupStageFinished && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Finalizar Fase de Grupos
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro de finalizar la fase de grupos?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Al finalizar la fase, se bloqueará la carga de resultados y podrás definir los cruces de playoffs.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleFinishGroupStage}>Finalizar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {tournament?.format === 'grupos-y-playoffs' &&
                isGroupStageFinished ? (
                  <div className="space-y-6">
                    <div className="p-4 text-center bg-green-900/20 border-2 border-dashed border-green-500 rounded-lg">
                        <h2 className="text-xl font-bold text-green-400">¡Fase de Grupos Finalizada!</h2>
                        <p className="text-muted-foreground">Define los cruces para los Playoffs.</p>
                    </div>
                    {renderPlayoffStage('Cuartos de Final', 'quarter')}
                    {renderPlayoffStage('Semifinales', 'semi')}
                    {renderPlayoffStage('Final', 'final')}
                     <Button className="w-full">
                        <Trophy className="mr-2 h-4 w-4" />
                        Guardar Fixture de Playoffs
                     </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="round-1" className="w-full">
                    <TabsList>
                      {fixture.map((_, index) => (
                        <TabsTrigger key={index} value={`round-${index + 1}`}>
                          FECHA {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {fixture.map((round, roundIndex) => (
                      <TabsContent
                        key={roundIndex}
                        value={`round-${roundIndex + 1}`}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                          {round.map((match, matchIndex) => {
                            const matchId = `r${roundIndex}m${matchIndex}`;
                            const isFinished = finishedMatches.has(matchId);
                            const result = matchResults[matchId] || {};
                            return (
                            <Card key={matchIndex} className={isFinished ? 'bg-green-900/20 border-green-500' : ''}>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  {match.home} vs {match.away}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="G"
                                    className="w-16 h-12 text-center text-lg font-bold"
                                    value={result.home || ''}
                                    onChange={(e) => handleResultChange(roundIndex, matchIndex, 'home', e.target.value)}
                                    disabled={isFinished}
                                  />
                                  <span className="text-2xl font-bold">-</span>
                                  <Input
                                    type="number"
                                    placeholder="G"
                                    className="w-16 h-12 text-center text-lg font-bold"
                                    value={result.away || ''}
                                    onChange={(e) => handleResultChange(roundIndex, matchIndex, 'away', e.target.value)}
                                    disabled={isFinished}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <Input type="date" disabled={isFinished}/>
                                  <Input type="time" disabled={isFinished}/>
                                  <Input placeholder="Árbitro" disabled={isFinished}/>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" disabled={isFinished}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar Planilla
                                    </Button>
                                     <Button variant="outline" disabled={isFinished}>
                                        <UploadCloud className="mr-2 h-4 w-4" />
                                        Cargar con IA
                                    </Button>
                                </div>
                              </CardContent>
                              <CardContent className="flex items-center justify-between">
                                <MatchStatsDialog tournamentId={tournamentId} match={match} roundIndex={roundIndex} matchIndex={matchIndex} isFinished={isFinished}/>
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor={`finished-${matchIndex}`}>
                                    Finalizar Partido
                                  </Label>
                                  <Switch id={`finished-${matchIndex}`} 
                                    checked={isFinished}
                                    onCheckedChange={(checked) => handleFinalizeMatch(roundIndex, matchIndex, checked)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          )})}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Add other TabsContent for positions, scorers, etc. here */}
        </Tabs>
      </div>
    </div>
  );
}
