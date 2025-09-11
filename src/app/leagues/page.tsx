'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { Trophy, Calendar, BarChart3, ShieldQuestion, Star, ShieldCheck, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data - in a real app, this would be fetched based on the tournament ID
const mockPositions = [
  { rank: 1, team: 'Equipo A', played: 5, won: 4, drawn: 1, lost: 0, points: 13, gf: 12, gc: 4, dg: 8 },
  { rank: 2, team: 'Equipo B', played: 5, won: 3, drawn: 1, lost: 1, points: 10, gf: 10, gc: 6, dg: 4 },
  { rank: 3, team: 'Equipo C', played: 5, won: 2, drawn: 2, lost: 1, points: 8, gf: 8, gc: 8, dg: 0 },
  { rank: 4, team: 'Equipo D', played: 5, won: 1, drawn: 1, lost: 3, points: 4, gf: 5, gc: 10, dg: -5 },
  { rank: 5, team: 'Equipo E', played: 5, won: 0, drawn: 1, lost: 4, points: 1, gf: 3, gc: 10, dg: -7 },
];

const mockFixture = [
  { round: 1, home: 'Equipo A', score: '3-1', away: 'Equipo B', finished: true },
  { round: 1, home: 'Equipo C', score: '2-2', away: 'Equipo D', finished: true },
  { round: 2, home: 'Equipo A', score: '20:00', away: 'Equipo C', finished: false },
  { round: 2, home: 'Equipo B', score: '21:00', away: 'Equipo E', finished: false },
];

const mockScorers = [
  { rank: 1, player: 'Juan Perez', team: 'Equipo A', goals: 7 },
  { rank: 2, player: 'Carlos Lopez', team: 'Equipo B', goals: 5 },
  { rank: 3, player: 'Pedro Gomez', team: 'Equipo C', goals: 4 },
];

const mockGoalkeepers = [
  { rank: 1, player: 'Marcos Díaz', team: 'Equipo A', played: 5, goalsConceded: 4, average: 0.8 },
  { rank: 2, player: 'Luis García', team: 'Equipo B', played: 5, goalsConceded: 6, average: 1.2 },
  { rank: 3, player: 'Jorge Campos', team: 'Equipo C', played: 5, goalsConceded: 8, average: 1.6 },
]

const mockSanctions = [
    { player: 'Diego Maradona', team: 'Equipo D', yellow: 3, red: 1},
    { player: 'Claudio Caniggia', team: 'Equipo E', yellow: 4, red: 0},
]

interface Tournament {
  id: string;
  name: string;
  type: string;
  format: string;
}

export default function LeaguesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const savedTournaments = JSON.parse(
      localStorage.getItem('tournaments') || '[]'
    );
    setTournaments(savedTournaments);

    const savedFavorites = JSON.parse(
      localStorage.getItem('favorite_tournaments') || '[]'
    );
    setFavorites(savedFavorites);
    setLoading(false);
  }, []);

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
          tournaments.map((tournament) => {
            const isFavorite = favorites.includes(tournament.id);
            return (
              <Card key={tournament.id}>
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
                              {mockPositions.map((pos) => (
                                <TableRow key={pos.rank}>
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
                       <div className="rounded-lg border">
                         <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Fecha</TableHead>
                                <TableHead className="text-right">Local</TableHead>
                                <TableHead className="text-center w-[100px]">Resultado</TableHead>
                                <TableHead>Visitante</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mockFixture.map((match, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">F. {match.round}</TableCell>
                                  <TableCell className="text-right">{match.home}</TableCell>
                                  <TableCell className={`text-center font-bold ${!match.finished && 'text-sm'}`}>{match.score}</TableCell>
                                  <TableCell>{match.away}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                       </div>
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
                                <TableHead className="text-right">Goles</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mockScorers.map((scorer) => (
                                 <TableRow key={scorer.rank}>
                                  <TableCell className="font-bold flex items-center gap-1">{scorer.rank === 1 && <Crown className="w-4 h-4 text-amber-400"/>}{scorer.rank}</TableCell>
                                  <TableCell>{scorer.player}</TableCell>
                                  <TableCell>{scorer.team}</TableCell>
                                  <TableCell className="text-right font-bold">{scorer.goals}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                       </div>
                    </TabsContent>

                    {/* VALLA MENOS VENCIDA */}
                    <TabsContent value="goalkeepers" className="mt-4">
                       <div className="rounded-lg border">
                          <Table>
                             <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Arquero</TableHead>
                                <TableHead>Equipo</TableHead>
                                <TableHead className="text-center">PJ</TableHead>
                                <TableHead className="text-center">GC</TableHead>
                                <TableHead className="text-right">Promedio</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mockGoalkeepers.map((gk) => (
                                 <TableRow key={gk.rank}>
                                  <TableCell className="font-bold flex items-center gap-1">{gk.rank === 1 && <ShieldCheck className="w-4 h-4 text-green-400"/>}{gk.rank}</TableCell>
                                  <TableCell>{gk.player}</TableCell>
                                  <TableCell>{gk.team}</TableCell>
                                  <TableCell className="text-center">{gk.played}</TableCell>
                                  <TableCell className="text-center">{gk.goalsConceded}</TableCell>
                                  <TableCell className="text-right font-bold">{gk.average.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
                              {mockSanctions.map((s, i) => (
                                 <TableRow key={i}>
                                  <TableCell>{s.player}</TableCell>
                                  <TableCell>{s.team}</TableCell>
                                  <TableCell className="text-center font-bold">{s.yellow}</TableCell>
                                  <TableCell className="text-center font-bold text-destructive">{s.red}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                       </div>
                    </TabsContent>

                    {/* PENALES */}
                     <TabsContent value="penalties" className="mt-4">
                       <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">La tabla de posiciones del torneo de penales aparecerá aquí.</p>
                        </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )
          })
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
