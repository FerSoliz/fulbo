'use client';

import Link from 'next/link';
import { User, PlayingPosition } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TransferStatusBadge } from '@/components/profile/TransferStatusBadge';

interface TransferPlayerCardProps {
  player: User;
}

// Mapeo para mostrar los nombres de las posiciones en español y con mayúscula inicial
const positionTranslations: Record<PlayingPosition, string> = {
  arquero: 'Arquero',
  defensa: 'Defensa',
  mediocampo: 'Mediocampo',
  lateral: 'Lateral',
  delantero: 'Delantero',
  otro: 'Otro',
};

export const TransferPlayerCard = ({ player }: TransferPlayerCardProps) => {
  if (!player) return null;

  // Obtenemos la posición y su traducción. Si no existe, usamos un texto por defecto.
  const playerPosition = player.playingPosition
    ? positionTranslations[player.playingPosition]
    : 'Sin Posición';

  const cardStyle = {
    backgroundImage: `linear-gradient(rgba(41, 46, 56, 0.4), rgba(41, 46, 56, 0.4)), url('/assets/profile/puntos.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <Link href={`/profile/${player.id}`} passHref className="block w-full">
      <div
        className="flex items-center justify-between p-2 md:p-4 border-t border-b border-border-soft transition-colors duration-200 cursor-pointer"
        style={cardStyle}
      >
        {/* Sección de Información del Jugador (Izquierda) */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <Avatar className="w-10 h-10 md:w-12 md:h-12">
            <AvatarImage src={player.avatar} alt={player.name} />
            <AvatarFallback>{player.name?.charAt(0) ?? 'S'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm md:text-base truncate uppercase italic text-white">
              <span className="text-accent-red">#</span>{player.username}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {player.name || 'Jugador'}
            </p>
          </div>
        </div>

        {/* Sección de Insignias (Derecha) - Apiladas Verticalmente */}
        <div className="flex flex-col items-end space-y-2 pl-2 md:pl-4">
          <TransferStatusBadge user={player} onTransferClick={() => {}} />
          <Badge variant="outline" className="border-accent-blue text-accent-blue text-xs">
            {playerPosition}
          </Badge>
        </div>
      </div>
    </Link>
  );
};
