'use client';

import { Team } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface ProfileTeamBadgeProps {
  team: Team | null | undefined;
}

export const ProfileTeamBadge = ({ team }: ProfileTeamBadgeProps) => {
  if (!team) {
    return null;
  }

  return (
    <div className="relative flex items-center h-12">
      {/* Avatar del equipo */}
      <div className="z-10">
        <Avatar className="w-12 h-12 border-2 border-background">
          <AvatarImage src={team.crestUrl} alt={`Escudo de ${team.name}`} />
          <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
      </div>

      {/* Tarjeta con el nombre del equipo, forma diagonal y línea inferior creada manualmente */}
      <div className="absolute left-8 z-0">
        <Card className="relative bg-container shadow-md overflow-hidden [clip-path:polygon(0%_0%,_100%_0%,_88%_100%,_0%_100%)] border-0">
          <div className="py-1 pl-6 pr-8">
            <p className="text-white font-semibold text-sm whitespace-nowrap">{team.name.toUpperCase()}</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-red" />
        </Card>
      </div>
    </div>
  );
};
