'use client';

import { PlayerTeamInfo } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface ProfileTeamBadgeProps {
  team: PlayerTeamInfo;
}

export const ProfileTeamBadge = ({ team }: ProfileTeamBadgeProps) => {
  return (
    // Contenedor principal reducido
    <div className="relative flex items-center justify-start h-10">
      {/* Avatar posicionado y reducido */}
      <div className="z-10">
        <Avatar className="w-10 h-10 border-2 border-background">
          <AvatarImage src={team.crestUrl || '/assets/images/default-team-logo.png'} alt={team.name} />
          <AvatarFallback>{team.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>

      {/* Tarjeta posicionada y con padding/texto reducido */}
      <div className="absolute left-7 z-0">
        <Card className="relative bg-container shadow-md overflow-hidden [clip-path:polygon(0%_0%,_100%_0%,_88%_100%,_0%_100%)] border-0 rounded-none">
          <div className="py-0.5 pl-5 pr-4">
            <p className="text-white font-semibold text-xs whitespace-nowrap">{team.name}</p>
          </div>

          {/* ÚNICA LÍNEA INFERIOR */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-red" />
        </Card>
      </div>
    </div>
  );
};
