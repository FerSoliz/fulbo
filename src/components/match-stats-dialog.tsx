'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, Star, TriangleAlert, Shield, Save } from 'lucide-react';
import { Separator } from './ui/separator';

interface Player {
  id: string;
  name: string;
  // add other relevant player fields if needed
}

interface MatchStatsDialogProps {
  tournamentId: string;
  match: { home: string; away: string };
}

export function MatchStatsDialog({
  tournamentId,
  match,
}: MatchStatsDialogProps) {
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  const [mvp, setMvp] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [playerId: string]: { goals: number, yellow: boolean, red: boolean } }>({});
  const [penaltyScore, setPenaltyScore] = useState({ home: 0, away: 0 });

  useEffect(() => {
    // Load rosters from localStorage
    const homeRosterData = JSON.parse(
      localStorage.getItem(`roster_${tournamentId}_${match.home}`) || '[]'
    ).map((p: any) => ({ id: p.uniqueCode, name: `${p.name} ${p.lastName}` }));
    const awayRosterData = JSON.parse(
      localStorage.getItem(`roster_${tournamentId}_${match.away}`) || '[]'
    ).map((p: any) => ({ id: p.uniqueCode, name: `${p.name} ${p.lastName}` }));
    setHomeRoster(homeRosterData);
    setAwayRoster(awayRosterData);
  }, [tournamentId, match]);

  const handleStatChange = (playerId: string, stat: 'goals' | 'yellow' | 'red', value: any) => {
    setStats(prev => ({
        ...prev,
        [playerId]: {
            ...prev[playerId],
            goals: prev[playerId]?.goals || 0,
            yellow: prev[playerId]?.yellow || false,
            red: prev[playerId]?.red || false,
            [stat]: value
        }
    }));
  };

  const handleMvpChange = (playerId: string) => {
    setMvp(prev => prev === playerId ? null : playerId);
  }
  
  const handleSaveStats = () => {
    // Logic to save stats to localStorage
    const matchStats = {
      mvp,
      stats,
      penaltyScore,
    };
    const matchId = `${tournamentId}_${match.home}_vs_${match.away}`;
    localStorage.setItem(`matchStats_${matchId}`, JSON.stringify(matchStats));
    alert('Estadísticas guardadas!');
  }

  const renderPlayerStats = (player: Player) => (
    <div key={player.id} className="grid grid-cols-[1fr_80px_80px_auto] items-center gap-2">
      <div className="flex items-center gap-2">
         <Checkbox 
            id={`mvp-${player.id}`}
            checked={mvp === player.id}
            onCheckedChange={() => handleMvpChange(player.id)}
         />
         <Label htmlFor={`mvp-${player.id}`} className="flex items-center gap-1 cursor-pointer">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            {player.name}
         </Label>
      </div>
      <Input
        type="number"
        placeholder="Goles"
        className="h-8 w-14"
        value={stats[player.id]?.goals || ''}
        onChange={(e) => handleStatChange(player.id, 'goals', Number(e.target.value))}
      />
      <div className="flex gap-1">
        <Button 
            size="icon" 
            variant={stats[player.id]?.yellow ? 'destructive' : 'outline'}
            className="h-8 w-8"
            onClick={() => handleStatChange(player.id, 'yellow', !stats[player.id]?.yellow)}
        >
            <div className="w-3 h-4 bg-amber-400" />
        </Button>
         <Button 
            size="icon" 
            variant={stats[player.id]?.red ? 'destructive' : 'outline'}
            className="h-8 w-8"
            onClick={() => handleStatChange(player.id, 'red', !stats[player.id]?.red)}
         >
            <div className="w-3 h-4 bg-red-600" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardList className="mr-2 h-4 w-4" />
          Estadísticas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Estadísticas del Partido: {match.home} vs {match.away}</DialogTitle>
          <DialogDescription>
            Carga los goles, tarjetas y jugador del partido.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto p-2">
            <div>
                <h3 className="font-semibold mb-2">{match.home}</h3>
                <div className="space-y-2">
                    {homeRoster.map(renderPlayerStats)}
                </div>
            </div>
             <div>
                <h3 className="font-semibold mb-2">{match.away}</h3>
                 <div className="space-y-2">
                    {awayRoster.map(renderPlayerStats)}
                </div>
            </div>
        </div>
        <Separator className="my-4"/>
        <div>
            <h3 className="font-semibold mb-2">Resultado Partido de Penales</h3>
            <div className="flex items-center justify-center gap-4">
                 <Label>{match.home}</Label>
                 <Input type="number" className="w-16 h-10 text-center" value={penaltyScore.home} onChange={(e) => setPenaltyScore(p => ({...p, home: Number(e.target.value)}))}/>
                 <span>-</span>
                 <Input type="number" className="w-16 h-10 text-center" value={penaltyScore.away} onChange={(e) => setPenaltyScore(p => ({...p, away: Number(e.target.value)}))}/>
                 <Label>{match.away}</Label>
            </div>
        </div>
         <div className="flex justify-end pt-4">
            <Button onClick={handleSaveStats}><Save className="mr-2 h-4 w-4"/> Guardar Estadísticas</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    