'use client';

import { Team } from '@/lib/types';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export const TeamsView = ({ teams }: { teams?: Team[] }) => {
  if (!teams || teams.length === 0) {
    return (
      <Card className="text-center text-muted-foreground py-6 px-4">
        <p>Aún no hay equipos inscritos en este torneo.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {teams.map(team => (
        <Card key={team.id} className="p-4 flex items-center gap-4">
          <Image 
            src={team.logoUrl || '/images/team-placeholder.png'} 
            alt={`Escudo de ${team.name}`}
            width={48}
            height={48}
            className="object-contain h-12 w-12"
          />
          <span className="font-semibold">{team.name}</span>
        </Card>
      ))}
    </div>
  );
};
