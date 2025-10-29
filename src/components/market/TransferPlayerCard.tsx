// src/components/market/TransferPlayerCard.tsx (Versión Final Definitiva)

import Link from 'next/link';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface TransferPlayerCardProps {
  player: User;
}

export const TransferPlayerCard = ({ player }: TransferPlayerCardProps) => {
  if (!player) return null;

  const status = player.transferStatus || 'libre';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="flex items-center justify-between p-2 md:p-4 bg-secondary border-t border-b border-border-soft">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Avatar className="w-10 h-10 md:w-12 md:h-12">
          <AvatarImage src={player.avatar} alt={player.name} />
          <AvatarFallback>{player.name?.charAt(0) ?? 'S'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* --- CORRECCIÓN FINAL: Estilos replicados de RankingCard --- */}
          <p className="font-bold text-sm md:text-base truncate uppercase italic text-white">
            <span className="text-accent-red">#</span>{player.username}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground truncate">
            {player.name || 'Jugador'}
          </p>
        </div>
      </div>
      <div className="px-2 md:px-4">
        <Badge
          className={cn(
            'font-semibold text-white text-xs md:text-sm',
            status === 'libre' && 'bg-green-600 hover:bg-green-700',
            status === 'traspaso' && 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {statusLabel}
        </Badge>
      </div>
      <div className="pl-2 md:pl-4">
        <Link href={`/profile/${player.id}`} passHref>
          {/* --- AJUSTE DE HOVER: De accent-blue a accent-red --- */}
          <button className="flex items-center gap-1 bg-container hover:bg-accent-red text-white font-semibold rounded-md transition-colors duration-200 text-xs md:text-sm py-1.5 px-3 md:py-2 md:px-4">
            <span className="hidden sm:inline">Ver </span>Perfil
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
};
