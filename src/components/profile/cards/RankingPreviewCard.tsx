'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRankingPreview, RankingPlayer } from '@/hooks/useRankingPreview';
import { Crown, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';

// Props
interface RankingPreviewCardProps {
  profileUserId: string;
}

// Sub-componente para una fila de jugador
const PlayerRow = ({ player, isCurrentUser }: { player: RankingPlayer, isCurrentUser: boolean }) => (
  <div
    className={cn(
      "flex items-center gap-4 p-2.5 rounded-lg transition-colors",
      isCurrentUser && "bg-amber-400/10 border-l-4 border-amber-400"
    )}
  >
    <div className="font-bold text-lg w-8 text-center flex-shrink-0 text-muted-foreground">
      {player.rank === 1 ? <Crown className="w-6 h-6 text-amber-400 mx-auto" /> : player.rank}
    </div>
    <p className="font-semibold truncate">{player.name}</p>
    <p className="ml-auto font-bold text-sm whitespace-nowrap text-muted-foreground">{player.sudpoints} SP</p>
  </div>
);

// --- Componente Principal ---
export const RankingPreviewCard = ({ profileUserId }: RankingPreviewCardProps) => {
  const { rankingData, loading } = useRankingPreview(profileUserId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // --- Lógica para procesar los datos para la vista previa ---
  const topPlayers = rankingData.slice(0, 3);
  const currentUserData = rankingData.find(p => p.id === profileUserId);
  const isCurrentUserInTop = topPlayers.some(p => p.id === profileUserId);

  // --- Renderizado ---
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Posición en el Ranking</CardTitle>
        <CardDescription>Tu lugar entre los mejores de SudOne.</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        {rankingData.length > 0 && currentUserData ? (
          <div className="space-y-1">
            {topPlayers.map(player => (
              <PlayerRow 
                key={player.id} 
                player={player} 
                isCurrentUser={player.id === profileUserId} 
              />
            ))}
            
            {!isCurrentUserInTop && (
              <Fragment>
                <div className="flex items-center justify-center py-2">
                  <div className="w-1/4 h-px bg-border-soft"></div>
                  <span className="px-2 text-xs text-muted-foreground">TU POSICIÓN</span>
                  <div className="w-1/4 h-px bg-border-soft"></div>
                </div>
                <PlayerRow player={currentUserData} isCurrentUser={true} />
              </Fragment>
            )}

          </div>
        ) : (
          <div className="text-center h-40 flex flex-col justify-center items-center text-muted-foreground bg-secondary/30 rounded-lg">
            <Trophy className="w-10 h-10 mb-2" />
            <p className="font-semibold">Aún no hay datos</p>
            <p className="text-sm">Juega tu primer partido para aparecer en el ranking.</p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Link href="/ranking" className="w-full">
          <Button variant="outline" className="w-full">
            Ver Ranking Completo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
