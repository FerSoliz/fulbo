'use client';

import { useEffect, useState } from 'react';
import { getAllTournaments } from '@/lib/firebase/db';
import { FullTournament } from '@/lib/types';
import Link from 'next/link';
import { Trophy, MapPin, ShieldCheck } from 'lucide-react';


const TournamentCard = ({ tournament }: { tournament: FullTournament }) => (
  <Link
    href={`/tournaments/${tournament.id}`}
    className="block bg-card border rounded-lg shadow hover:bg-muted/50 transition-colors duration-200"
    >
    <div className="p-5">
      <div className="flex items-start gap-4">
        <Trophy className="h-8 w-8 text-amber-400 mt-1" />
        <div className="flex-1">
          <h2 className="text-xl font-bold tracking-tight text-card-foreground">{tournament.name}</h2>
          <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{tournament.venue || 'Sede no definida'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>{tournament.status || 'Estado no definido'}</span>
            </div>
          </div>
        </div>
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
        console.log("Datos de torneos recibidos de Firebase:", data); // Para depuración
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
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Ligas en Curso</h1>
        <p className="text-muted-foreground mt-2 text-lg">Explora los torneos activos de SudOne y sigue las estadísticas de tu equipo.</p>
      </header>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Skeleton Loader */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg shadow p-5">
              <div className="flex items-start gap-4 animate-pulse">
                <div className="bg-muted rounded-full h-8 w-8 mt-1"></div>
                <div className="flex-1 space-y-3 mt-1">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-800">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.length > 0 ? (
            tournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-16">
              <Trophy className="h-16 w-16 mx-auto text-muted" />
              <h3 className="mt-4 text-xl font-semibold">No hay torneos disponibles</h3>
              <p className="mt-2">Pronto habrá nuevas competencias. ¡Vuelve a consultar más tarde!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
