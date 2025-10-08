'use client';

import { useEffect, useState } from 'react';
import { getAllTournaments } from '@/lib/firebase/db';
import { FullTournament } from '@/lib/types';
import Link from 'next/link';

// A futuro, este será un componente de tarjeta dedicado.
const TournamentCard = ({ tournament }: { tournament: FullTournament }) => (
  <Link href={`/tournaments/${tournament.id}`} className="block bg-card border rounded-lg shadow hover:bg-muted/50 transition-colors">
    <div className="p-6">
      <h2 className="text-2xl font-bold tracking-tight text-card-foreground">{tournament.name}</h2>
      <p className="text-muted-foreground mt-2">Categoría: {tournament.category}</p>
      <p className="text-sm text-muted-foreground mt-1">Sede: {tournament.venue}</p>
      <div className="mt-4 text-xs text-muted-foreground">
        <span>{new Date(tournament.startDate).toLocaleDateString()}</span> - 
        <span>{new Date(tournament.endDate).toLocaleDateString()}</span>
      </div>
    </div>
  </Link>
);

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<FullTournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setIsLoading(true);
        const data = await getAllTournaments();
        setTournaments(data);
      } catch (err) {
        setError('No se pudieron cargar los torneos. Por favor, inténtalo de nuevo más tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ligas en Curso</h1>
        <p className="text-muted-foreground mt-1">Explora los torneos activos de SudOne y sigue las estadísticas.</p>
      </header>

      {isLoading && (
        <div className="text-center text-muted-foreground">
          <p>Cargando torneos...</p>
          {/* A futuro, podríamos poner aquí un skeleton loader */}
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.length > 0 ? (
            tournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-10">
              <p>No hay torneos en curso en este momento.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
