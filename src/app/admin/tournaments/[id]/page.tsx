'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertTriangle,
  Crown
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
    Table as UiTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MatchStatsDialog } from '@/components/match-stats-dialog';
import { PlanillaPartidoSVG } from '@/components/planilla-partido-svg';
import * as htmlToImage from 'html-to-image';
import QRCode from 'qrcode';


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

type ManualMatch = { home: string; away: string };
interface Position { rank: number; team: string; played: number; won: number; drawn: number; lost: number; points: number; gf: number; gc: number; dg: number; }
interface Scorer { player: string; team: string; goals: number; }
interface Sanction { player: string; team: string; yellow: number; red: number; }
interface PenaltyPosition { rank: number; team: string; played: number; won: number; lost: number; points: number; }
interface Player { id: string; name: string; lastName: string; dni: string; }
type PlanillaData = {
    home: string;
    away: string;
    matchId: string;
    qrCodeUrl: string;
    homeRoster: Player[];
    awayRoster: Player[];
    homeSuspensions: string[];
    awaySuspensions: string[];
    date?: string;
    time?: string;
    referee?: string;
};
type SuspensionInfo = { [playerId: string]: { nextMatchSuspended: boolean } };


export default function TournamentDetailsPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<any>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [fixture, setFixture] = useState<ManualMatch[][]>([]);
  const [isGroupStageFinished, setIsGroupStageFinished] = useState(false);
  const [matchResults, setMatchResults] = useState<any>({});
  const [matchDetails, setMatchDetails] = useState<any>({});
  const [finishedMatches, setFinishedMatches] = useState<Set<string>>(new Set());

  const [positions, setPositions] = useState<Position[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [penalties, setPenalties] = useState<PenaltyPosition[]>([]);
  const [suspensions, setSuspensions] = useState<SuspensionInfo>({});

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
  const planillaRef = useRef<HTMLDivElement>(null);
  const [planillaData, setPlanillaData] = useState<PlanillaData | null>(null);

  const loadStats = () => {
    const savedPositions = JSON.parse(localStorage.getItem(`positions_${tournamentId}`) || '[]');
    const savedScorers = JSON.parse(localStorage.getItem(`scorers_${tournamentId}`) || '[]');
    const savedSanctions = JSON.parse(localStorage.getItem(`sanctions_${tournamentId}`) || '[]');
    const savedPenalties = JSON.parse(localStorage.getItem(`penalties_${tournamentId}`) || '[]');
    const savedSuspensions = JSON.parse(localStorage.getItem(`suspensions_${tournamentId}`) || '{}');
    setPositions(savedPositions);
    setScorers(savedScorers);
    setSanctions(savedSanctions);
    setPenalties(savedPenalties);
    setSuspensions(savedSuspensions);
  };

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
      const storedFixture = JSON.parse(localStorage.getItem(`fixture_${tournamentId}`) || 'null');
      if (storedFixture && storedFixture.length > 0 && storedFixture.flat().length > 0) {
        setFixture(storedFixture);
      } else if (currentTournament?.autoFixture) {
        const newFixture = generateFixture([...teamNames]);
        setFixture(newFixture);
        localStorage.setItem(`fixture_${tournamentId}`, JSON.stringify(newFixture));
      }
    }

    const stageStatus = JSON.parse(localStorage.getItem(`groupStageStatus_${tournamentId}`) || 'false');
    setIsGroupStageFinished(stageStatus);

    const savedResults = JSON.parse(localStorage.getItem(`results_${tournamentId}`) || '{}');
    setMatchResults(savedResults);
    
    const savedDetails = JSON.parse(localStorage.getItem(`details_${tournamentId}`) || '{}');
    setMatchDetails(savedDetails);

    const savedFinished = JSON.parse(localStorage.getItem(`finished_matches_${tournamentId}`) || '[]');
    setFinishedMatches(new Set(savedFinished));

    loadStats();

  }, [tournamentId]);

  useEffect(() => {
    if (planillaData && planillaRef.current) {
        htmlToImage.toPng(planillaRef.current, { quality: 0.95, backgroundColor: '#FFFFFF' })
        .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `Planilla_${planillaData.home}_vs_${planillaData.away}.png`;
            link.href = dataUrl;
            link.click();
            setPlanillaData(null); // Reset after download
        })
        .catch((err) => {
            console.error('oops, something went wrong!', err);
            setPlanillaData(null);
        });
    }
  }, [planillaData]);


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
  
  const handleDetailChange = (roundIndex: number, matchIndex: number, field: 'date' | 'time' | 'referee', value: string) => {
    const matchId = `r${roundIndex}m${matchIndex}`;
    const newDetails = {
        ...matchDetails,
        [matchId]: {
            ...matchDetails[matchId],
            [field]: value
        }
    };
    setMatchDetails(newDetails);
    localStorage.setItem(`details_${tournamentId}`, JSON.stringify(newDetails));
  }

  const calculateAllTournamentStats = (currentFinishedMatches: Set<string>) => {
    if (!teams || teams.length === 0) return;

    let allRosters: {[key: string]: any[]} = {};
    teams.forEach(teamId => {
        const teamKey = `team_${tournamentId}_${teamId.replace(/\s+/g, '_')}`;
        const rosterKey = `roster_${teamKey}`;
        const storedRoster = localStorage.getItem(rosterKey);
        if (storedRoster) {
          allRosters[teamId] = JSON.parse(storedRoster);
        } else {
           const teamNames = JSON.parse(localStorage.getItem(`teams_${tournamentId}`) || '[]');
           const index = teamNames.indexOf(teamId);
           const legacyTeamId = `team_${tournamentId}_${teamId.replace(/\s+/g, '_') || index}`;
           const legacyRoster = localStorage.getItem(`roster_${tournamentId}_${legacyTeamId}`);
           if (legacyRoster) {
             allRosters[teamId] = JSON.parse(legacyRoster);
           } else {
             allRosters[teamId] = [];
           }
        }
    });

    const stats: { [team: string]: any } = teams.reduce((acc, team) => {
      if (team !== 'BYE') {
        acc[team] = { rank: 0, team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, gc: 0, dg: 0, points: 0 };
      }
      return acc;
    }, {} as { [team: string]: any });

    const playerStats: { [dni: string]: { player: string, team: string, goals: number, yellow: number, red: number, suspendedMatches: number } } = {};
    
    // Load previously served suspension matches to avoid double counting
    const servedSuspensions = JSON.parse(localStorage.getItem(`served_suspensions_${tournamentId}`) || '{}');

    const penaltyTable: { [team: string]: any } = teams.reduce((acc, team) => {
        if (team !== 'BYE') {
          acc[team] = { rank: 0, team, played: 0, won: 0, lost: 0, points: 0 };
        }
        return acc;
    }, {} as { [team: string]: any });
    
    // Reset suspensions for this calculation
    const newSuspensions: SuspensionInfo = {};


    fixture.forEach((round, roundIndex) => {
      round.forEach((match, matchIndex) => {
        const matchId = `r${roundIndex}m${matchIndex}`;
        const matchIdForStats = `${tournamentId}_${matchId}`;
        const isFinished = currentFinishedMatches.has(matchId);
        
        const homeRoster = allRosters[match.home] || [];
        const awayRoster = allRosters[match.away] || [];
        const playerRoster = [...homeRoster, ...awayRoster];

        playerRoster.forEach(player => {
            if (!playerStats[player.dni]) {
                playerStats[player.dni] = { player: `${player.name} ${player.lastName}`, team: teams.find(t => allRosters[t]?.some((p:any) => p.dni === player.dni)) || 'N/A', goals: 0, yellow: 0, red: 0, suspendedMatches: 0 };
            }
        });

        if (isFinished && match.home && match.away && match.home !== 'BYE' && match.away !== 'BYE') {
          const result = matchResults[matchId] || {};
          const homeScore = parseInt(result.home, 10) || 0;
          const awayScore = parseInt(result.away, 10) || 0;

          // Main Table Stats
          stats[match.home].played++;
          stats[match.away].played++;
          stats[match.home].gf += homeScore;
          stats[match.away].gf += awayScore;
          stats[match.home].gc += awayScore;
          stats[match.away].gc += homeScore;
          stats[match.home].dg = stats[match.home].gf - stats[match.home].gc;
          stats[match.away].dg = stats[match.away].gf - stats[match.away].gc;

          if (homeScore > awayScore) {
            stats[match.home].won++;
            stats[match.away].lost++;
            stats[match.home].points += 3;
          } else if (awayScore > homeScore) {
            stats[match.away].won++;
            stats[match.home].lost++;
            stats[match.away].points += 3;
          } else {
            stats[match.home].drawn++;
            stats[match.away].drawn++;
            stats[match.home].points += 1;
            stats[match.away].points += 1;
          }

          // Individual Player Stats & Suspension Logic
          const matchPlayerStats = JSON.parse(localStorage.getItem(`matchStats_${matchIdForStats}`) || '{}');
          if (matchPlayerStats.stats) {
            for (const dni in matchPlayerStats.stats) {
              const pData = matchPlayerStats.stats[dni];
              
              if (playerStats[dni]) {
                  playerStats[dni].goals += pData.goals || 0;
                  
                  if (pData.red) {
                      playerStats[dni].red++;
                      playerStats[dni].yellow = 0; // Red card clears yellow cards
                      newSuspensions[dni] = { nextMatchSuspended: true };
                  } else if (pData.yellow) {
                      playerStats[dni].yellow++;
                      if (playerStats[dni].yellow >= 5) {
                          playerStats[dni].yellow -= 5; // Reset after suspension
                          newSuspensions[dni] = { nextMatchSuspended: true };
                      }
                  }
              }
            }
          }
          
           // Penalty Table Stats
           if(matchPlayerStats.penaltyScore) {
               const homePenalty = matchPlayerStats.penaltyScore.home || 0;
               const awayPenalty = matchPlayerStats.penaltyScore.away || 0;
               if(homePenalty > 0 || awayPenalty > 0){
                   penaltyTable[match.home].played++;
                   penaltyTable[match.away].played++;
                   if(homePenalty > awayPenalty){
                       penaltyTable[match.home].won++;
                       penaltyTable[match.away].lost++;
                       penaltyTable[match.home].points += 3;
                   } else if (awayPenalty > homePenalty) {
                       penaltyTable[match.away].won++;
                       penaltyTable[match.home].lost++;
                       penaltyTable[match.away].points += 3;
                   }
               }
           }
        }
      });
    });

    const sortedTeams = Object.values(stats).sort((a, b) => b.points - a.points || b.dg - a.dg || b.gf - a.gf);
    sortedTeams.forEach((team, index) => team.rank = index + 1);
    
    const sortedScorers = Object.values(playerStats).filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
    
    const sortedSanctions = Object.values(playerStats).filter(p => p.yellow > 0 || p.red > 0).sort((a, b) => b.red - a.red || b.yellow - a.yellow);

    const sortedPenalties = Object.values(penaltyTable).sort((a, b) => b.points - a.points);


    localStorage.setItem(`positions_${tournamentId}`, JSON.stringify(sortedTeams));
    localStorage.setItem(`scorers_${tournamentId}`, JSON.stringify(sortedScorers));
    localStorage.setItem(`sanctions_${tournamentId}`, JSON.stringify(sortedSanctions));
    localStorage.setItem(`penalties_${tournamentId}`, JSON.stringify(sortedPenalties));
    localStorage.setItem(`suspensions_${tournamentId}`, JSON.stringify(newSuspensions));
    
    loadStats();
  };


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
    const matchId = `r${roundIndex}m${matchIndex}`;
    const newFinishedMatches = new Set(finishedMatches);
    if(isFinalized) {
        newFinishedMatches.add(matchId);
    } else {
        newFinishedMatches.delete(matchId);
    }
    setFinishedMatches(newFinishedMatches);
    localStorage.setItem(`finished_matches_${tournamentId}`, JSON.stringify(Array.from(newFinishedMatches)));

    calculateAllTournamentStats(newFinishedMatches);
  };

  const handleDownloadPlanilla = async (match: { home: string; away: string }, roundIndex: number, matchIndex: number) => {
      const matchId = `${tournamentId}-R${roundIndex + 1}-M${matchIndex + 1}`;
      const details = matchDetails[`r${roundIndex}m${matchIndex}`] || {};
      
      const getTeamId = (teamName: string) => {
          const teamNames = JSON.parse(localStorage.getItem(`teams_${tournamentId}`) || '[]');
          const index = teamNames.indexOf(teamName);
          return index !== -1 ? `team_${tournamentId}_${teamName.replace(/\s+/g, '_') || index}` : null;
      }
      
      const homeTeamId = getTeamId(match.home);
      const awayTeamId = getTeamId(match.away);
      
      const homeRoster: Player[] = homeTeamId ? JSON.parse(localStorage.getItem(`roster_${tournamentId}_${homeTeamId}`) || '[]') : [];
      const awayRoster: Player[] = awayTeamId ? JSON.parse(localStorage.getItem(`roster_${tournamentId}_${awayTeamId}`) || '[]') : [];

      const homeSuspensions = homeRoster.filter(p => suspensions[p.dni]?.nextMatchSuspended).map(p => p.dni);
      const awaySuspensions = awayRoster.filter(p => suspensions[p.dni]?.nextMatchSuspended).map(p => p.dni);

      try {
          const qrCodeUrl = await QRCode.toDataURL(matchId);
          setPlanillaData({
              home: match.home,
              away: match.away,
              matchId: matchId,
              qrCodeUrl: qrCodeUrl,
              homeRoster,
              awayRoster,
              homeSuspensions,
              awaySuspensions,
              date: details.date,
              time: details.time,
              referee: details.referee,
          });
      } catch (err) {
          console.error("Failed to generate QR code", err);
      }
  };
  
  const generateEmptyFixture = () => {
    if (teams.length < 2) return;
    const numTeams = teams.length % 2 === 0 ? teams.length : teams.length + 1;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const newFixture: ManualMatch[][] = Array(numRounds)
      .fill(null)
      .map(() =>
        Array(matchesPerRound)
          .fill(null)
          .map(() => ({ home: '', away: '' }))
      );
    setFixture(newFixture);
    localStorage.setItem(`fixture_${tournamentId}`, JSON.stringify(newFixture));
  };
  
  const handleManualMatchChange = (roundIndex: number, matchIndex: number, teamType: 'home' | 'away', teamName: string) => {
    const newFixture = [...fixture];
    newFixture[roundIndex][matchIndex][teamType] = teamName;
    setFixture(newFixture);
    localStorage.setItem(`fixture_${tournamentId}`, JSON.stringify(newFixture));
  }

  const fixtureWarnings = useMemo(() => {
    const warnings: {[key: string]: boolean} = {};
    const seenMatches = new Set<string>();

    fixture.forEach((round, roundIndex) => {
        round.forEach((match, matchIndex) => {
            if (match.home && match.away) {
                const sortedTeams = [match.home, match.away].sort().join('-');
                if (seenMatches.has(sortedTeams)) {
                    warnings[`${roundIndex}-${matchIndex}`] = true;
                }
                seenMatches.add(sortedTeams);
            }
        });
    });
    return warnings;
  }, [fixture]);


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
    <TooltipProvider>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hidden div for rendering the planilla SVG for download */}
        <div className="fixed -left-[9999px] top-0">
          {planillaData && (
              <PlanillaPartidoSVG 
                  ref={planillaRef} 
                  homeTeam={planillaData.home} 
                  awayTeam={planillaData.away}
                  matchId={planillaData.matchId}
                  qrCodeUrl={planillaData.qrCodeUrl}
                  homeRoster={planillaData.homeRoster}
                  awayRoster={planillaData.awayRoster}
                  homeSuspensions={planillaData.homeSuspensions}
                  awaySuspensions={planillaData.awaySuspensions}
                  date={planillaData.date}
                  time={planillaData.time}
                  referee={planillaData.referee}
              />
          )}
        </div>

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
                  fixture.length > 0 ? (
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
                            const details = matchDetails[matchId] || {};
                            return (
                            <Card key={matchIndex} className={isFinished ? 'bg-green-900/20 border-green-500' : ''}>
                              <CardHeader>
                                {tournament?.autoFixture ? (
                                     <CardTitle className="text-lg">
                                        {match.home} vs {match.away}
                                     </CardTitle>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Select value={match.home} onValueChange={(value) => handleManualMatchChange(roundIndex, matchIndex, 'home', value)} disabled={isFinished}>
                                            <SelectTrigger><SelectValue placeholder="Equipo Local" /></SelectTrigger>
                                            <SelectContent>
                                                {teams.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <span>vs</span>
                                         <Select value={match.away} onValueChange={(value) => handleManualMatchChange(roundIndex, matchIndex, 'away', value)} disabled={isFinished}>
                                            <SelectTrigger><SelectValue placeholder="Equipo Visitante" /></SelectTrigger>
                                            <SelectContent>
                                                {teams.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {fixtureWarnings[`${roundIndex}-${matchIndex}`] && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <AlertTriangle className="w-5 h-5 text-destructive"/>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Este partido ya existe en el fixture.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                )}
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
                                  <Input type="date" value={details.date || ''} onChange={(e) => handleDetailChange(roundIndex, matchIndex, 'date', e.target.value)} disabled={isFinished}/>
                                  <Input type="time" value={details.time || ''} onChange={(e) => handleDetailChange(roundIndex, matchIndex, 'time', e.target.value)} disabled={isFinished}/>
                                  <Input placeholder="Árbitro" value={details.referee || ''} onChange={(e) => handleDetailChange(roundIndex, matchIndex, 'referee', e.target.value)} disabled={isFinished}/>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" disabled={isFinished} onClick={() => handleDownloadPlanilla(match, roundIndex, matchIndex)}>
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
                                <MatchStatsDialog tournamentId={tournamentId} match={match} roundIndex={roundIndex} matchIndex={matchIndex} isFinished={isFinished} suspensions={suspensions}/>
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor={`finished-${matchId}`}>
                                    Finalizar Partido
                                  </Label>
                                  <Switch id={`finished-${matchId}`} 
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
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        No se ha generado un fixture para este torneo.
                      </p>
                       {!tournament?.autoFixture && (
                         <Button onClick={generateEmptyFixture} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Generar Fechas Vacías
                        </Button>
                       )}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="positions" className="mt-4">
               <div className="rounded-lg border">
                  <UiTable>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className="text-center">PJ</TableHead>
                        <TableHead className="text-center">G</TableHead>
                        <TableHead className="text-center">E</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="hidden md:table-cell text-center">GF</TableHead>
                        <TableHead className="hidden md:table-cell text-center">GC</TableHead>
                        <TableHead className="hidden md:table-cell text-center">DG</TableHead>
                        <TableHead className="text-right">Puntos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((pos) => (
                        <TableRow key={pos.team}>
                          <TableCell className="font-bold">{pos.rank}</TableCell>
                          <TableCell>{pos.team}</TableCell>
                          <TableCell className="text-center">{pos.played}</TableCell>
                          <TableCell className="text-center">{pos.won}</TableCell>
                          <TableCell className="text-center">{pos.drawn}</TableCell>
                          <TableCell className="text-center">{pos.lost}</TableCell>
                          <TableCell className="hidden md:table-cell text-center">{pos.gf}</TableCell>
                          <TableCell className="hidden md:table-cell text-center">{pos.gc}</TableCell>
                          <TableCell className="hidden md:table-cell text-center">{pos.dg}</TableCell>
                          <TableCell className="text-right font-bold">{pos.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </UiTable>
               </div>
            </TabsContent>
            <TabsContent value="scorers" className="mt-4">
               <div className="rounded-lg border">
                  <UiTable>
                     <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Jugador</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className="text-right">Goles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scorers.map((scorer, index) => (
                         <TableRow key={scorer.player}>
                          <TableCell className="font-bold flex items-center gap-1">{index + 1 === 1 && <Crown className="w-4 h-4 text-amber-400"/>}{index + 1}</TableCell>
                          <TableCell>{scorer.player}</TableCell>
                          <TableCell>{scorer.team}</TableCell>
                          <TableCell className="text-right font-bold">{scorer.goals}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </UiTable>
               </div>
            </TabsContent>
            <TabsContent value="goalkeepers" className="mt-4">
               <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">La tabla de valla menos vencida aparecerá aquí.</p>
                </div>
            </TabsContent>
             <TabsContent value="sanctions" className="mt-4">
               <div className="rounded-lg border">
                  <UiTable>
                     <TableHeader>
                      <TableRow>
                        <TableHead>Jugador</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className="text-center">Amarillas</TableHead>
                        <TableHead className="text-center">Rojas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sanctions.map((s, i) => (
                         <TableRow key={i}>
                          <TableCell>{s.player}</TableCell>
                          <TableCell>{s.team}</TableCell>
                          <TableCell className="text-center font-bold text-amber-400">{s.yellow}</TableCell>
                          <TableCell className="text-center font-bold text-destructive">{s.red}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </UiTable>
               </div>
            </TabsContent>
             <TabsContent value="penalties" className="mt-4">
               <div className="rounded-lg border">
                   <UiTable>
                       <TableHeader>
                           <TableRow>
                               <TableHead>#</TableHead>
                               <TableHead>Equipo</TableHead>
                               <TableHead className="text-center">PJ</TableHead>
                               <TableHead className="text-center">G</TableHead>
                               <TableHead className="text-center">P</TableHead>
                               <TableHead className="text-right">Puntos</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {penalties.map((p, i) => (
                               <TableRow key={p.team}>
                                   <TableCell className="font-bold">{i + 1}</TableCell>
                                   <TableCell>{p.team}</TableCell>
                                   <TableCell className="text-center">{p.played}</TableCell>
                                   <TableCell className="text-center">{p.won}</TableCell>
                                   <TableCell className="text-center">{p.lost}</TableCell>
                                   <TableCell className="text-right font-bold">{p.points}</TableCell>
                               </TableRow>
                           ))}
                       </TableBody>
                   </UiTable>
               </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
    </TooltipProvider>
  );
}
