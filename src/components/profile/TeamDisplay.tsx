
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface TeamDisplayProps {
  team: UserProfile['team'];
}

export const TeamDisplay = ({ team }: TeamDisplayProps) => {
  if (!team || !team.id) return null;

  return (
    <Link href={`/admin/teams/${team.id}`}>
      {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
      }
      <div className="mt-4 p-3 bg-secondary/50 rounded-lg flex items-center gap-4 transition-colors hover:bg-secondary cursor-pointer">
        <Avatar className="w-12 h-12 border-2 border-muted">
          {team.crestUrl ? (
            <AvatarImage src={team.crestUrl} alt={`Escudo de ${team.name}`} />
          ) : (
            <ShieldCheck className="w-6 h-6 text-muted-foreground" />
          )}
          <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs text-muted-foreground font-semibold">EQUIPO ACTUAL</p>
          <p className="font-bold text-lg text-foreground">{team.name}</p>
        </div>
      </div>
    </Link>
  );
};
