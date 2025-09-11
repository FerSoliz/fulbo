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
import { Trophy, Calendar, BarChart3, ShieldQuestion } from 'lucide-react';

// Mock data - in a real app, this would be fetched based on the tournament ID
const mockPositions = [
  { rank: 1, team: 'Equipo A', played: 5, won: 4, drawn: 1, lost: 0, points: 13 },
  { rank: 2, team: 'Equipo B', played: 5, won: 3, drawn: 1, lost: 1, points: 10 },
  { rank: 3, team: 'Equipo C', played: 5, won: 2, drawn: 2, lost: 1, points: 8 },
  { rank: 4, team: 'Equipo D', played: 5, won: 1, drawn: 1, lost: 3, points: 4 },
  { rank: 5, team: 'Equipo E', played: 5, won: 0, drawn: 1, lost: 4, points: 1 },
];

const mockFixture = [
  { round: 1, home: 'Equipo A', score: '3-1', away: 'Equipo B' },
  { round: 1, home: 'Equipo C', score: '2-2', away: 'Equipo D' },
  { round: 2, home: 'Equipo A', score: 'vs', away: 'Equipo C' },
  { round: 2, home: 'Equipo B', score: 'vs', away: 'Equipo E' },
];

const mockScorers = [
  { rank: 1, player: 'Juan Perez (Equipo A)', goals: 7 },
  { rank: 2, player: 'Carlos Lopez (Equipo B)', goals: 5 },
  { rank: 3, player: 'Pedro Gomez (Equipo C)', goals: 4 },
];

interface Tournament {
  id: string;
  name: string;
  type: string;
  format: string;
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
            <Card key={tournament.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-amber-400" />
                  {tournament.name}
                </CardTitle>
                <CardDescription>
                  {tournament.type} - {tournament.format}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="positions" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="positions">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Tabla de Posiciones
                    </TabsTrigger>
                    <TabsTrigger value="fixture">
                      <Calendar className="mr-2 h-4 w-4" />
                      Fixture Completo
                    </TabsTrigger>
                    <TabsTrigger value="scorers">
                      <Trophy className="mr-2 h-4 w-4" />
                      Goleadores
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* TABLA DE POSICIONES */}
                  <TabsContent value="positions" className="mt-4">
                     <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Equipo</TableHead>
                              <TableHead className="text-center">PJ</TableHead>
                              <TableHead className="text-center">G</TableHead>
                              <TableHead className="text-center">E</TableHead>
                              <TableHead className="text-center">P</TableHead>
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
                                <TableCell className="text-center font-bold">{match.score}</TableCell>
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
                              <TableHead className="text-right">Goles</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockScorers.map((scorer) => (
                               <TableRow key={scorer.rank}>
                                <TableCell className="font-bold">{scorer.rank}</TableCell>
                                <TableCell>{scorer.player}</TableCell>
                                <TableCell className="text-right font-bold">{scorer.goals}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                     </div>
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
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
