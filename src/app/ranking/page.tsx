'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRankedUsers } from '@/lib/firebase/db';
import { UserProfile } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';

// Componentes de la tabla para Desktop
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Componentes nuevos para la vista móvil y compartidos
import { PlayerRankingCard } from '@/components/ranking/PlayerRankingCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { DivisionBadge } from '@/components/ui/division-badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type RankedUser = UserProfile & { rank: number };

// --- Skeleton Loaders --- //

const TableSkeleton = () => (
  Array.from({ length: 10 }).map((_, i) => (
    <TableRow key={`skeleton-table-${i}`}>
      <TableCell className="text-center"><Skeleton className="h-6 w-6 rounded-full mx-auto" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
    </TableRow>
  ))
);

const CardListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
       <div key={`skeleton-card-${i}`} className="flex items-center bg-container p-3 gap-3 border border-border-soft">
          <Skeleton className="h-7 w-10 rounded-md" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 grid grid-cols-2 items-center gap-2">
              <div className='flex-1 min-w-0'>
                  <Skeleton className="h-5 w-3/4 mb-1.5" />
                  <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
              </div>
          </div>
      </div>
    ))}
  </div>
);

// --- Componente Principal de la Página --- //

export default function RankingPage() {
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const users = await getRankedUsers();
        const usersWithRank = users.map((user, index) => ({
          ...user,
          rank: index + 1,
        }));
        setRankedUsers(usersWithRank);
      } catch (error) {
        console.error("Error fetching ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-foreground';
  };

  // --- Renderizado de Vistas --- //

  const renderDesktopView = () => (
    <div className="border bg-card">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-[80px] text-center">Rank</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead>División</TableHead>
                <TableHead className="text-right">Sudpoints</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? <TableSkeleton /> : (
                rankedUsers.length > 0 ? (
                rankedUsers.map(user => (
                    <TableRow key={user.id}>
                    <TableCell className="text-center">
                        <span className={cn('text-lg font-bold flex items-center justify-center', getRankColor(user.rank))}>
                        {user.rank === 1 && <Crown className="w-5 h-5 mr-1" />}                          
                        {user.rank}
                        </span>
                    </TableCell>
                    <TableCell>
                        <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                            <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name?.charAt(0) ?? 'S'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium group-hover:underline">{user.name}</p>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                        </Link>
                    </TableCell>
                    <TableCell>
                        <DivisionBadge sudpoints={user.sudpoints ?? 0} />
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge variant="outline" className="text-base font-bold">{user.sudpoints ?? 0}</Badge>
                    </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    No hay jugadores rankeados todavía.
                    </TableCell>
                </TableRow>
                )
            )}
            </TableBody>
        </Table>
    </div>
  );

  const renderMobileView = () => (
    <div className="space-y-2">
      {loading ? <CardListSkeleton /> : (
        rankedUsers.length > 0 ? (
          rankedUsers.map(user => (
            <PlayerRankingCard key={user.id} user={user} />
          ))
        ) : (
          <div className="text-center py-10">
            <p>No hay jugadores rankeados todavía.</p>
          </div>
        )
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tighter">Ranking de Jugadores</h1>
          <p className="text-muted-foreground mt-2">
            La tabla de clasificación de los mejores jugadores de SUDONE.
          </p>
        </header>

        {isMobile ? renderMobileView() : renderDesktopView()}

      </div>
    </div>
  );
}
