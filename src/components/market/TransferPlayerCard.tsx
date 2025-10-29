'use client';

import Link from 'next/link';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { TransferStatusBadge } from '@/components/profile/TransferStatusBadge';

interface TransferPlayerCardProps {
  player: User;
}

export const TransferPlayerCard = ({ player }: TransferPlayerCardProps) => {
  if (!player) return null;

  return (
    <div className="flex items-center justify-between p-2 md:p-4 bg-secondary border-t border-b border-border-soft">
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
      {/* --- CAMBIO: AÑADIDO flex-grow y justify-center para centrar la insignia --- */}
      <div className="flex-grow flex justify-center">
        <TransferStatusBadge user={player} onTransferClick={() => {}} />
      </div>
      <div className="pl-2 md:pl-4">
        <Link href={`/profile/${player.id}`} passHref>
          <button className="flex items-center gap-1 bg-container hover:bg-accent-red text-white font-semibold rounded-md transition-colors duration-200 text-xs md:text-sm py-1.5 px-3 md:py-2 md:px-4">
            <span className="hidden sm:inline">Ver </span>Perfil
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
};
