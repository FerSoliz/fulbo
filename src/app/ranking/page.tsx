'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRankedUsers } from '@/lib/firebase/db';
import { UserProfile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { DivisionBadge } from '@/components/division-badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type RankedUser = UserProfile & { rank: number };

export default function RankingPage() {
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      const users = await getRankedUsers();
      const usersWithRank = users.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
      setRankedUsers(usersWithRank);
      setLoading(false);
    };

    fetchRanking();
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-foreground';
  };

  const renderSkeletons = () => (
    Array.from({ length: 10 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tighter">Ranking de Jugadores</h1>
          <p className="text-muted-foreground mt-2">
            La tabla de clasificación de los mejores jugadores de SUDONE.
          </p>
        </header>

        <div className="rounded-lg border bg-card">
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
              {loading ? renderSkeletons() : (
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
      </div>
    </div>
  );
}
