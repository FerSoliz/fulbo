import Link from 'next/link';
import { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DivisionBadge } from '@/components/ui/division-badge';
import { Crown } from 'lucide-react';
import { cn, getDivisionInfo } from '@/lib/utils';

type RankedUser = UserProfile & { rank: number };

interface PlayerRankingCardProps {
  user: RankedUser;
}

export const PlayerRankingCard = ({ user }: PlayerRankingCardProps) => {
  // --- MI CORRECCIÓN ---
  // Si el usuario no existe, no renderizamos nada.
  // Esto previene el error si llegan datos inesperados.
  if (!user) {
    return null;
  }
  // --- FIN DE LA CORRECCIÓN ---

  const divisionInfo = getDivisionInfo(user.sudpoints ?? 0);
  const divisionColor = divisionInfo?.color || 'hsl(var(--foreground))';

  const cardStyle = {
    backgroundImage: `linear-gradient(rgba(41, 46, 56, 0.4), rgba(41, 46, 56, 0.4)), url('/assets/profile/puntos.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center p-2 gap-2 transition-all hover:brightness-125 border border-border-soft"
      style={cardStyle}
    >
        {/* Rank */}
        <div className={cn('flex items-center justify-center w-8 font-bold text-xl')}>
            {user.rank === 1 ? (
                <Crown className="w-7 h-7 text-amber-400" />
            ) : (
                <span style={{ color: divisionColor }}>{user.rank}</span>
            )}
        </div>

        {/* Avatar */}
        <Avatar className="w-10 h-10 border-2 border-background">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0) ?? 'S'}</AvatarFallback>
        </Avatar>

        {/* Info del Jugador y Stats */}
        <div className="flex-1 grid grid-cols-2 items-center gap-1.5">
            {/* Nombre y Username */}
            <div className='flex-1 min-w-0'>
                <p className="font-bold text-sm truncate uppercase italic">
                  <span className="text-accent-red">#</span>{user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.name}</p>
            </div>

            {/* División y Puntos */}
            <div className="flex flex-col items-end gap-1">
                <DivisionBadge sudpoints={user.sudpoints ?? 0} />
                <Badge variant="outline" className="font-bold text-[11px] py-0.5 px-2">
                    {user.sudpoints ?? 0} SP
                </Badge>
            </div>
        </div>
    </Link>
  );
};
