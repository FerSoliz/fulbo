'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList, Star, Save } from 'lucide-react';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Player {
  id: string;
  name: string;
}

interface MatchStatsDialogProps {
  tournamentId: string;
  match: { home: string; away: string };
  roundIndex: number;
  matchIndex: number;
  isFinished: boolean;
}

export function MatchStatsDialog({
  tournamentId,
  match,
  roundIndex,
  matchIndex,
  isFinished
}: MatchStatsDialogProps) {
  const { toast } = useToast();
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  const [mvp, setMvp] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [playerId: string]: { goals: number, yellow: boolean, red: boolean } }>({});
  const [penaltyScore, setPenaltyScore] = useState({ home: 0, away: 0 });
  
  const matchId = `${tournamentId}_r${roundIndex}_m${matchIndex}`;

  useEffect(() => {
    // Load rosters from localStorage
    const homeRosterData: Player[] = JSON.parse(
      localStorage.getItem(`roster_${tournamentId}_${match.home}`) || '[]'
    ).map((p: any) => ({ id: p.uniqueCode, name: `${p.name} ${p.lastName}`.trim() }));
    const awayRosterData: Player[] = JSON.parse(
      localStorage.getItem(`roster_${tournamentId}_${match.away}`) || '[]'
    ).map((p: any) => ({ id: p.uniqueCode, name: `${p.name} ${p.lastName}`.trim() }));
    
    setHomeRoster(homeRosterData);
    setAwayRoster(awayRosterData);

    const savedStats = JSON.parse(localStorage.getItem(`matchStats_${matchId}`) || '{}');
    if (savedStats) {
        setMvp(savedStats.mvp || null);
        setStats(savedStats.stats || {});
        setPenaltyScore(savedStats.penaltyScore || { home: 0, away: 0 });
    }

  }, [tournamentId, match, matchId]);

  const handleStatChange = (playerId: string, stat: 'goals' | 'yellow' | 'red', value: any) => {
    if (!playerId || isFinished) return;
    setStats(prev => {
        const currentStats = prev[playerId] || { goals: 0, yellow: false, red: false };
        return {
            ...prev,
            [playerId]: {
                ...currentStats,
                [stat]: value
            }
        }
    });
  };

  const handleMvpChange = (playerId: string) => {
    if (!playerId || isFinished) return;
    setMvp(prev => prev === playerId ? null : playerId);
  }
  
  const handleSaveStats = () => {
    const matchStats = {
      mvp,
      stats,
      penaltyScore,
    };
    localStorage.setItem(`matchStats_${matchId}`, JSON.stringify(matchStats));
    toast({
        title: "¡Estadísticas Guardadas!",
        description: "Los datos del partido se han guardado correctamente.",
    })
  }

  const renderPlayerStats = (player: Player | null, index: number, teamType: 'home' | 'away') => {
    const playerId = player?.id || `${teamType}-placeholder-${index}`;
    const playerName = player?.name || `Jugador ${index + 1}`;
    const playerStats = stats[playerId] || { goals: 0, yellow: false, red: false };

    return (
      <div key={playerId} className="grid grid-cols-[30px_1fr_45px_30px_30px] items-center gap-x-2 py-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleMvpChange(playerId)} disabled={!player || isFinished}>
            <Star className={cn("h-4 w-4 text-muted-foreground", mvp === playerId && "text-amber-400 fill-amber-400")} />
        </Button>
        <p className="text-sm truncate" title={playerName}>{playerName}</p>
        <Input
          id={`goals-${playerId}`}
          type="number"
          min="0"
          className="h-7 w-12 text-center px-1"
          value={playerStats.goals || ''}
          onChange={(e) => handleStatChange(playerId, 'goals', e.target.value ? Number(e.target.value) : 0)}
          disabled={!player || isFinished}
        />
        <Button 
              size="icon" 
              variant={playerStats.yellow ? 'default' : 'outline'}
              className={cn("h-6 w-6 p-0 border-amber-400", playerStats.yellow && "bg-amber-400 hover:bg-amber-500")}
              onClick={() => handleStatChange(playerId, 'yellow', !playerStats.yellow)}
              disabled={!player || isFinished}
          >
              <div className="w-3 h-4 bg-current rounded-sm" />
          </Button>
           <Button 
              size="icon" 
              variant={playerStats.red ? 'default' : 'outline'}
              className={cn("h-6 w-6 p-0 border-red-600", playerStats.red && "bg-red-600 hover:bg-red-700")}
              onClick={() => handleStatChange(playerId, 'red', !playerStats.red)}
              disabled={!player || isFinished}
           >
              <div className="w-3 h-4 bg-current rounded-sm" />
          </Button>
      </div>
    );
  };

  const renderTeamColumn = (title: string, roster: Player[], teamType: 'home' | 'away') => {
    const displayItems = Array.from({ length: 10 }, (_, i) => roster[i] || null);
    return (
        <div>
            <h3 className="font-semibold mb-2 text-center">{title}</h3>
            <div className="space-y-1">
                <div className="grid grid-cols-[30px_1fr_45px_30px_30px] items-center gap-x-2 text-xs font-bold text-muted-foreground px-1">
                    <span className="text-center">MVP</span>
                    <span>JUGADOR</span>
                    <span className="text-center">G</span>
                    <span className="text-center">A</span>
                    <span className="text-center">R</span>
                </div>
                {displayItems.map((player, index) => renderPlayerStats(player, index, teamType))}
            </div>
        </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isFinished}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Estadísticas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Estadísticas del Partido: {match.home} vs {match.away}</DialogTitle>
          <DialogDescription>
            Carga los goles, tarjetas y jugador del partido. {isFinished && <span className="font-bold text-destructive"> (Partido Finalizado)</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-1">
            {renderTeamColumn(match.home, homeRoster, 'home')}
            {renderTeamColumn(match.away, awayRoster, 'away')}
        </div>
        <Separator className="my-2"/>
        <div>
            <h3 className="font-semibold mb-2 text-center">Resultado Tanda de Penales</h3>
            <div className="flex items-center justify-center gap-4">
                 <Label className="text-right w-1/3 truncate" title={match.home}>{match.home}</Label>
                 <Input type="number" min="0" className="w-16 h-10 text-center" value={penaltyScore.home} onChange={(e) => setPenaltyScore(p => ({...p, home: Number(e.target.value)}))} disabled={isFinished}/>
                 <span className="font-bold">-</span>
                 <Input type="number" min="0" className="w-16 h-10 text-center" value={penaltyScore.away} onChange={(e) => setPenaltyScore(p => ({...p, away: Number(e.target.value)}))} disabled={isFinished}/>
                 <Label className="w-1/3 truncate" title={match.away}>{match.away}</Label>
            </div>
        </div>
         <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cerrar</Button>
            </DialogClose>
            {!isFinished && (
              <Button onClick={handleSaveStats}>
                <Save className="mr-2 h-4 w-4"/> Guardar Estadísticas
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
