'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { User, leagues } from '@/lib/data';
import { DivisionBadge } from '@/components/division-badge';
import { cn } from '@/lib/utils';

export default function RankingPage() {
  const [rankedUsers, setRankedUsers] = useState<(User & { rank: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Combine initial users with users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    const leagueOrder = leagues.map(l => l.name);

    const sortedUsers = storedUsers
      .filter((user: User) => user.dni) // Only show users who have linked their profile
      .sort((a: User, b: User) => {
        const leagueIndexA = leagueOrder.indexOf(a.league);
        const leagueIndexB = leagueOrder.indexOf(b.league);
        if (leagueIndexA !== leagueIndexB) {
          return leagueIndexB - leagueIndexA; // Higher league index first
        }
        if (a.division !== b.division) {
          return a.division - b.division; // Lower division number first (I > II)
        }
        return b.sudpoints - a.sudpoints; // Higher sudpoints first
      })
      .map((user: User, index: number) => ({ ...user, rank: index + 1 }));

    setRankedUsers(sortedUsers);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Cargando ranking...</div>;
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-foreground';
  };

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
                <TableHead className="hidden md:table-cell">Equipo</TableHead>
                <TableHead>Liga</TableHead>
                <TableHead className="text-right">Sudpoints</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedUsers.length > 0 ? (
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
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium group-hover:underline">{user.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      Equipo Ficticio FC
                    </TableCell>
                    <TableCell>
                        <DivisionBadge league={user.league} division={user.division} />
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge variant="outline" className="text-base">{user.sudpoints}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No hay jugadores rankeados todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
