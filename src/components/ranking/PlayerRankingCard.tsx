import Link from 'next/link';
import { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DivisionBadge } from '@/components/ui/division-badge';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

type RankedUser = UserProfile & { rank: number };

interface PlayerRankingCardProps {
  user: RankedUser;
}

const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-foreground';
};

export const PlayerRankingCard = ({ user }: PlayerRankingCardProps) => {
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center bg-container p-3 rounded-lg gap-3 transition-colors hover:bg-secondary border border-border-soft"
    >
        {/* Rank */}
        <div className={cn('flex items-center justify-center w-10 font-bold text-2xl', getRankColor(user.rank))}>
            {user.rank === 1 ? <Crown className="w-7 h-7" /> : user.rank}
        </div>

        {/* Avatar */}
        <Avatar className="w-12 h-12 border-2 border-background">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0) ?? 'S'}</AvatarFallback>
        </Avatar>

        {/* Info del Jugador y Stats */}
        <div className="flex-1 grid grid-cols-2 items-center gap-2">
            {/* Nombre y Username */}
            <div className='flex-1 min-w-0'>
                <p className="font-bold text-base truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            </div>

            {/* División y Puntos */}
            <div className="flex flex-col items-end gap-1.5">
                <DivisionBadge sudpoints={user.sudpoints ?? 0} />
                <Badge variant="outline" className="font-bold text-xs py-1">
                    {user.sudpoints ?? 0} SP
                </Badge>
            </div>
        </div>
    </Link>
  );
};
