'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTournamentDetails } from '@/lib/firebase/db/tournaments';
import { FullTournament, Standing, Scorer, Sanction } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';

// --- Importando los nuevos componentes de vista ---
import { FixtureView } from '@/components/tournaments/fixture-view';
import { TeamsView } from '@/components/tournaments/teams-view';

// --- Componentes de Tabla (Sin cambios) ---

const StandingsTable = ({ standings }: { standings?: Standing[] }) => {
  if (!standings || standings.length === 0) {
    return <Card className="text-center text-muted-foreground py-6 px-4"><p>La tabla de posiciones aún no está disponible.</p></Card>;
  }
  return (
    <Card>
      <CardHeader><CardTitle>Tabla de Posiciones</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">PJ</TableHead><TableHead className="text-center">G</TableHead><TableHead className="text-center">E</TableHead><TableHead className="text-center">P</TableHead><TableHead className="text-center font-bold">Pts</TableHead></TableRow></TableHeader>
          <TableBody>
            {standings.map((s, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{s.rank}</TableCell>
                <TableCell><div className="flex items-center gap-3">{s.crestUrl && <Image src={s.crestUrl} alt={`Escudo de ${s.team}`} width={24} height={24} className="object-contain" />}<span className="font-medium">{s.team}</span></div></TableCell>
                <TableCell className="text-center">{s.played}</TableCell>
                <TableCell className="text-center">{s.won}</TableCell>
                <TableCell className="text-center">{s.drawn}</TableCell>
                <TableCell className="text-center">{s.lost}</TableCell>
                <TableCell className="text-center font-bold">{s.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const ScorersTable = ({ scorers }: { scorers?: Scorer[] }) => {
  if (!scorers || scorers.length === 0) {
    return <Card className="text-center text-muted-foreground py-6 px-4"><p>La tabla de goleadores aún no está disponible.</p></Card>;
  }
  return (
    <Card>
      <CardHeader><CardTitle>Goleadores</CardTitle></CardHeader>
      <CardContent>
        <Table>
            <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-right">Goles</TableHead></TableRow></TableHeader>
            <TableBody>
                {scorers.map((s, index) => (
                    <TableRow key={index}>
                        <TableCell>{s.rank}</TableCell>
                        <TableCell className="font-medium">{s.player}</TableCell>
                        <TableCell className="text-muted-foreground">{s.team}</TableCell>
                        <TableCell className="text-right font-bold">{s.goals}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const SanctionsTable = ({ sanctions }: { sanctions?: Sanction[] }) => {
  if (!sanctions || sanctions.length === 0) {
    return <Card className="text-center text-muted-foreground py-6 px-4"><p>No hay jugadores sancionados en este torneo.</p></Card>;
  }
  return (
    <Card>
      <CardHeader><CardTitle>Sanciones</CardTitle></CardHeader>
      <CardContent>
        <Table>
            <TableHeader><TableRow><TableHead>Jugador</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center font-bold text-yellow-500">A</TableHead><TableHead className="text-center font-bold text-red-600">R</TableHead></TableRow></TableHeader>
            <TableBody>
                {sanctions.map((s, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{s.player}</TableCell>
                        <TableCell className="text-muted-foreground">{s.team}</TableCell>
                        <TableCell className="text-center font-bold">{s.yellowCards}</TableCell>
                        <TableCell className="text-center font-bold">{s.redCards}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Componente Principal Integrado ---

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [tournament, setTournament] = useState<FullTournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchAndSetDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getTournamentDetails(tournamentId);

        if (data) {
          setTournament(data);
        } else {
          setError('El torneo que buscas no existe o fue eliminado.');
        }
      } catch (err) {
        console.error(err);
        setError('Ocurrió un error al cargar los datos del torneo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetDetails();
  }, [tournamentId]);

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
      {isLoading && <p className="text-center text-muted-foreground py-10">Cargando detalles del torneo...</p>}
      {error && <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
      
      {tournament && (
        <div className="space-y-6">
          <header className="space-y-2">
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">{tournament.name}</h1>
             <p className="text-md sm:text-lg text-muted-foreground">{tournament.category} - {tournament.venue}</p>
          </header>

          <Tabs defaultValue="fixture" className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="fixture">Fixture</TabsTrigger>
                <TabsTrigger value="positions">Posiciones</TabsTrigger>
                <TabsTrigger value="teams">Equipos</TabsTrigger>
                <TabsTrigger value="scorers">Goleadores</TabsTrigger>
                <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
              </TabsList>
            </div>

            {/* --- CONTENIDO FINAL DE LAS PESTAÑAS -- */}
            <TabsContent value="fixture" className="mt-4">
              <FixtureView matches={tournament.matches} />
            </TabsContent>

            <TabsContent value="positions" className="mt-4">
              <StandingsTable standings={tournament.standings} />
            </TabsContent>

            <TabsContent value="teams" className="mt-4">
              <TeamsView teams={tournament.teamsList} />
            </TabsContent>

            <TabsContent value="scorers" className="mt-4">
              <ScorersTable scorers={tournament.scorers} />
            </TabsContent>
            
            <TabsContent value="sanctions" className="mt-4">
              <SanctionsTable sanctions={tournament.sanctions} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
