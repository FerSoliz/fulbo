'use client';

import { Match } from '@/lib/types';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MatchCard = ({ match }: { match: Match }) => {
  // --- INICIO DE LA CORRECCIÓN ---
  // 1. Validar si la fecha del partido es un valor válido.
  const isValidDate = match.date && !isNaN(new Date(match.date).getTime());
  const matchDate = isValidDate ? new Date(match.date) : null;
  // --- FIN DE LA CORRECCIÓN ---

  const TeamDisplay = ({ name, crest }: { name?: string, crest?: string }) => (
    <div className="flex flex-col items-center gap-2 w-28 text-center">
      <Image 
        src={crest || '/images/team-placeholder.png'} 
        alt={`Escudo de ${name}`}
        width={48}
        height={48}
        className="object-contain h-12 w-12"
      />
      <span className="font-semibold text-sm leading-tight">{name || 'A confirmar'}</span>
    </div>
  );

  return (
    <Card className="p-4 flex items-center justify-between gap-2">
      <TeamDisplay name={match.homeTeamName} crest={match.homeTeamCrest} />

      <div className="flex flex-col items-center text-center">
        {match.status === 'FINISHED' && match.result ? (
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{match.result.homeScore}</p>
            <span className="text-muted-foreground">-</span>
            <p className="text-2xl font-bold">{match.result.awayScore}</p>
          </div>
        ) : (
          <p className="text-xl font-bold text-muted-foreground">VS</p>
        )}
        
        {/* --- INICIO DE LA CORRECCIÓN: Renderizado Condicional -- */}
        {matchDate ? (
          <>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(matchDate, 'dd MMM', { locale: es })}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{format(matchDate, 'HH:mm', { locale: es })}hs</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground mt-2">
            Fecha a confirmar
          </div>
        )}
        {/* --- FIN DE LA CORRECCIÓN -- */}

      </div>

      <TeamDisplay name={match.awayTeamName} crest={match.awayTeamCrest} />
    </Card>
  );
};

export const FixtureView = ({ matches }: { matches?: Match[] }) => {
  if (!matches || matches.length === 0) {
    return (
      <Card className="text-center text-muted-foreground py-6 px-4">
        <p>El fixture del torneo aún no está disponible.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
};
