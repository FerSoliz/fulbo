'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, ShieldQuestion, Star, Crown, ShieldCheck, Shield, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Tournament {
  id: string;
  name: string;
  type: string;
  format: string;
  teamCount: number;
}

interface Position {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  gf: number;
  gc: number;
  dg: number;
}

interface Scorer {
    player: string;
    team: string;
    goals: number;
    nationality: string;
}

interface Sanction {
    player: string;
    team: string;
    yellow: number;
    red: number;
}

interface PenaltyPosition {
    rank: number;
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
}

interface FixtureMatch {
    round: number;
    home: string;
    away: string;
    score: string;
    finished: boolean;
    date: string;
    time: string;
    referee: string;
}


const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [scorers, setScorers] = useState<Scorer[]>([]);
    const [sanctions, setSanctions] = useState<Sanction[]>([]);
    const [penalties, setPenalties] = useState<PenaltyPosition[]>([]);
    const [fixtureRounds, setFixtureRounds] = useState<{[key: string]: FixtureMatch[]}>({});
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const savedPositions = JSON.parse(localStorage.getItem(`positions_${tournament.id}`) || '[]');
        const savedScorers = JSON.parse(localStorage.getItem(`scorers_${tournament.id}`) || '[]');
        const savedSanctions = JSON.parse(localStorage.getItem(`sanctions_${tournament.id}`) || '[]');
        const savedPenalties = JSON.parse(localStorage.getItem(`penalties_${tournament.id}`) || '[]');
        const savedFixture = JSON.parse(localStorage.getItem(`fixture_${tournament.id}`) || '[]');
        const savedResults = JSON.parse(localStorage.getItem(`results_${tournament.id}`) || '{}');
        const savedDetails = JSON.parse(localStorage.getItem(`details_${tournament.id}`) || '{}');
        const savedFinishedMatches = new Set(JSON.parse(localStorage.getItem(`finished_matches_${tournament.id}`) || '[]'));

        const fullFixture: FixtureMatch[] = savedFixture.flatMap((round: any[], roundIndex: number) => 
            round.map((match: any, matchIndex: number) => {
                const matchId = `r${roundIndex}m${matchIndex}`;
                const result = savedResults[matchId];
                const details = savedDetails[matchId];
                const isFinished = savedFinishedMatches.has(matchId);
                
                const date = new Date(details?.date);
                const formattedDate = !isNaN(date.getTime()) 
                    ? date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                    : '-';
                
                return {
                    round: roundIndex + 1,
                    home: match.home,
                    away: match.away,
                    score: isFinished ? `${result?.home ?? 0} - ${result?.away ?? 0}` : 'vs',
                    finished: isFinished,
                    date: formattedDate,
                    time: details?.time || '-',
                    referee: details?.referee || '-',
                }
            })
        );
        
        const rounds = fullFixture.reduce((acc, match) => {
            const roundKey = `FECHA ${match.round}`;
            if (!acc[roundKey]) {
                acc[roundKey] = [];
            }
            acc[roundKey].push(match);
            return acc;
        }, {} as {[key: string]: FixtureMatch[]});

        setFixtureRounds(rounds);
        setPositions(savedPositions);
        setScorers(savedScorers);
        setSanctions(savedSanctions);
        setPenalties(savedPenalties);

        const savedFavorites = JSON.parse(localStorage.getItem('favorite_tournaments') || '[]');
        setFavorites(savedFavorites);
    }, [tournament.id]);


     const toggleFavorite = (tournamentId: string) => {
        let updatedFavorites;
        if(favorites.includes(tournamentId)) {
            updatedFavorites = favorites.filter(id => id !== tournamentId);
        } else {
            updatedFavorites = [...favorites, tournamentId];
        }
        setFavorites(updatedFavorites);
        localStorage.setItem('favorite_tournaments', JSON.stringify(updatedFavorites));
    }
    const isFavorite = favorites.includes(tournament.id);


    return (
        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-amber-400" />
                    {tournament.name}
                 </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => toggleFavorite(tournament.id)}>
                    <Star className={`h-5 w-5 ${isFavorite ? 'text-accent fill-accent' : 'text-muted-foreground'}`}/>
                  </Button>
              </div>
              <CardDescription>
                {tournament.type} - {tournament.format}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 text-xs">
                  <TabsTrigger value="positions">POSICIONES</TabsTrigger>
                  <TabsTrigger value="fixture">FIXTURE</TabsTrigger>
                  <TabsTrigger value="scorers">GOLEADORES</TabsTrigger>
                  <TabsTrigger value="goalkeepers">VALLA</TabsTrigger>
                  <TabsTrigger value="sanctions">SANCIONES</TabsTrigger>
                  <TabsTrigger value="penalties">PENALES</TabsTrigger>
                </TabsList>
                
                {/* TABLA DE POSICIONES */}
                <TabsContent value="positions" className="mt-4">
                   <div className="rounded-lg border">
                      <Table>
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
                      </Table>
                   </div>
                </TabsContent>

                {/* FIXTURE */}
                <TabsContent value="fixture" className="mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(fixtureRounds).map(([roundName, matches]) => (
                      <AccordionItem value={roundName} key={roundName}>
                        <AccordionTrigger className="font-bold">{roundName}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 p-2">
                            {matches.map((match, index) => (
                              <div key={index} className="flex flex-col items-center justify-between text-sm p-3 bg-muted/50 rounded-md">
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold text-right w-2/5 truncate">{match.home}</span>
                                    <span className={`font-bold text-center w-1/5 ${match.finished ? 'text-lg' : 'text-xs'}`}>
                                        {match.score}
                                    </span>
                                    <span className="font-semibold text-left w-2/5 truncate">{match.away}</span>
                                </div>
                                {!match.finished && (
                                  <div className="text-xs text-muted-foreground mt-2 text-center">
                                      <span>{match.date} - {match.time}hs</span>
                                      <br/>
                                      <span>Árbitro: {match.referee}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
                
                {/* GOLEADORES */}
                <TabsContent value="scorers" className="mt-4">
                   <div className="rounded-lg border">
                      <Table>
                         <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Jugador</TableHead>
                            <TableHead>Equipo</TableHead>
                            <TableHead>Nacionalidad</TableHead>
                            <TableHead className="text-right">Goles</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scorers.map((scorer, index) => (
                             <TableRow key={scorer.player}>
                              <TableCell className="font-bold flex items-center gap-1">{index + 1 === 1 && <Crown className="w-4 h-4 text-amber-400"/>}{index + 1}</TableCell>
                              <TableCell>{scorer.player}</TableCell>
                              <TableCell>{scorer.team}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-muted-foreground"/> 
                                    {scorer.nationality?.substring(0,3).toUpperCase() || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold">{scorer.goals}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                   </div>
                </TabsContent>

                {/* VALLA MENOS VENCIDA */}
                <TabsContent value="goalkeepers" className="mt-4">
                   <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">La tabla de valla menos vencida aparecerá aquí.</p>
                    </div>
                </TabsContent>

                {/* SANCIONES */}
                 <TabsContent value="sanctions" className="mt-4">
                   <div className="rounded-lg border">
                      <Table>
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
                      </Table>
                   </div>
                </TabsContent>

                {/* PENALES */}
                 <TabsContent value="penalties" className="mt-4">
                   <div className="rounded-lg border">
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>#</TableHead>
                                   <TableHead>Equipo</TableHead>
                                   <TableHead className="text-center">PJ</TableHead>
                                   <TableHead className="text-center">G</TableHead>
                                   <TableHead className="text-center">E</TableHead>
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
                                       <TableCell className="text-center">{p.drawn}</TableCell>
                                       <TableCell className="text-center">{p.lost}</TableCell>
                                       <TableCell className="text-right font-bold">{p.points}</TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                   </div>
                </TabsContent>
              </Tabs>
            </CardContent>
        </Card>
    )
}

export default function LeaguesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTournaments = JSON.parse(
      localStorage.getItem('tournaments') || '[]'
    );
    setTournaments(savedTournaments);
    setLoading(false);
  }, []);


  if (loading) {
    return <div className="p-8 text-center">Cargando ligas...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-bold tracking-tighter">Ligas en Curso</h1>
          <p className="text-muted-foreground mt-2">
            Sigue el progreso de todos los torneos, revisa las tablas y los
            resultados.
          </p>
        </header>

        {tournaments.length > 0 ? (
          tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
          ))
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg flex flex-col items-center">
            <ShieldQuestion className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No hay ligas en curso</h2>
            <p className="text-muted-foreground mt-2">
              Actualmente no hay torneos activos. Vuelve a consultar más tarde.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
