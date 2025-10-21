'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAllTournaments } from '@/lib/firebase/db';
import { FullTournament } from '@/lib/types';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

// --- FUNCIÓN AUXILIAR PARA OBTENER EL DÍA DE LA SEMANA ---
const getSpanishDayOfWeek = (dateString: string): string | null => {
  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return null;

    let dayName = date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' });
    
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  } catch (error) {
    console.error("Error parsing date string:", dateString, error);
    return null;
  }
};


const TournamentCard = ({ tournament }: { tournament: FullTournament }) => {
  const dayOfWeek = tournament.startDate ? getSpanishDayOfWeek(tournament.startDate) : null;

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="relative block border border-soft rounded-lg shadow hover:bg-muted/50 transition-colors duration-200 overflow-hidden aspect-[2/1] border-b-2 border-b-accent-blue"
    >
      {/* --- Capas de Fondo --- */}
      <div className="absolute inset-0 bg-container z-0"></div>
      <Image
        src="/assets/profile/puntos.png"
        alt="Fondo decorativo de puntos"
        fill
        className="object-cover z-10 scale-[2.0]"
      />
      <Image
        src="/assets/profile/estandarte.png"
        alt="Estandarte decorativo"
        fill
        className="object-contain object-right opacity-80 z-20"
      />
      
      {/* --- Contenido de Texto --- */}
      <div className="relative p-4 pl-0.5 pb-px z-30 flex flex-col justify-end h-full">
        <div style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          <p className="italic uppercase font-bold text-2xl text-white leading-[1.125] tracking-tighter">
            Liga Sudone
          </p>
          <h2 className="text-xs font-semibold tracking-tight text-white leading-tight truncate">
            {tournament.name}
          </h2>
          <div className="text-xs text-gray-200">
              <p className="leading-tight">
                  {dayOfWeek && (
                    <span>
                      <span className="font-bold text-amber-400">DÍA:</span> {dayOfWeek}
                    </span>
                  )}
                  {dayOfWeek && tournament.venue && (
                    <span className="mx-2">|</span>
                  )}
                  {tournament.venue && (
                    <span>
                      <span className="font-bold text-amber-400">SEDE:</span> {tournament.venue}
                    </span>
                  )}
              </p>
          </div>
        </div>
      </div>
    </Link>
  )
};


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
      } catch (err)
      {
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
      <div className="relative bg-container border rounded-lg shadow-lg overflow-hidden mb-8 h-28">
        <div className="absolute right-0 top-0 bottom-0 w-48">
            <Image
                src="/assets/profile/fondo-pelota.png"
                alt="Fondo de pelota de fútbol"
                fill
                className="object-contain object-right"
            />
        </div>
        <div className="relative h-full flex items-end z-10">
            <h1 className="border-l-2 border-accent-red italic uppercase text-4xl font-extrabold tracking-tighter text-white scale-y-150 origin-bottom-left leading-none" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                Ligas en Curso
            </h1>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg shadow p-5 aspect-[2/1]">
              <div className="h-full bg-muted animate-pulse rounded-md"></div>
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
