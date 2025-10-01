'use client';

import { useState, useEffect } from 'react';
import { rtdb, ref, get, set } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart, Shield, Sword, ShieldAlert, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatchStatsDialogProps {
  matchId: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  isFinished: boolean;
}

interface Player {
  id: string;
  name: string;
  lastName: string;
  dni: string;
}

interface PlayerStats {
  goals: number;
  yellowCards: number;
  redCard: boolean;
}

const TeamRoster = ({ title, players, stats, onStatChange, isFinished }: {
    title: string;
    players: Player[];
    stats: { [playerId: string]: PlayerStats };
    onStatChange: (playerId: string, stat: keyof PlayerStats, value: number | boolean) => void;
    isFinished: boolean;
}) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">{title}</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {players.map(player => (
                <div key={player.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{player.name} {player.lastName}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 items-center">
                        <div className="flex items-center gap-1">
                           <Sword className="h-4 w-4 text-muted-foreground" />
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onStatChange(player.id, 'goals', Math.max(0, (stats[player.id]?.goals || 0) - 1))} disabled={isFinished}><Minus className="h-4 w-4" /></Button>
                            <span className="font-bold w-4 text-center">{stats[player.id]?.goals || 0}</span>
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onStatChange(player.id, 'goals', (stats[player.id]?.goals || 0) + 1)} disabled={isFinished}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex items-center gap-1">
                           <div className="w-4 h-5 bg-yellow-400 border border-black" />
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onStatChange(player.id, 'yellowCards', Math.max(0, (stats[player.id]?.yellowCards || 0) - 1))} disabled={isFinished}><Minus className="h-4 w-4" /></Button>
                            <span className="font-bold w-4 text-center">{stats[player.id]?.yellowCards || 0}</span>
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onStatChange(player.id, 'yellowCards', (stats[player.id]?.yellowCards || 0) + 1)} disabled={isFinished}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-5 bg-red-600 border border-black" />
                            <input type="checkbox" className="w-6 h-6" checked={stats[player.id]?.redCard || false} onChange={(e) => onStatChange(player.id, 'redCard', e.target.checked)} disabled={isFinished} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export function MatchStatsDialog({ matchId, tournamentId, homeTeamId, awayTeamId, isFinished }: MatchStatsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  const [stats, setStats] = useState<{ [playerId: string]: PlayerStats }>({});
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchRostersAndStats = async () => {
        setLoading(true);
        try {
          // Cargar nombres de equipos
          const homeTeamSnap = await get(ref(rtdb, `teams/${homeTeamId}/name`));
          setHomeTeamName(homeTeamSnap.val() || 'Local');
          const awayTeamSnap = await get(ref(rtdb, `teams/${awayTeamId}/name`));
          setAwayTeamName(awayTeamSnap.val() || 'Visitante');

          // Cargar planteles
          const homeRosterSnap = await get(ref(rtdb, `tournaments/${tournamentId}/teams/${homeTeamId}/roster`));
          setHomeRoster(homeRosterSnap.exists() ? Object.values(homeRosterSnap.val()) : []);

          const awayRosterSnap = await get(ref(rtdb, `tournaments/${tournamentId}/teams/${awayTeamId}/roster`));
          setAwayRoster(awayRosterSnap.exists() ? Object.values(awayRosterSnap.val()) : []);

          // Cargar estadísticas existentes
          const statsSnap = await get(ref(rtdb, `match_stats/${matchId}`));
          setStats(statsSnap.exists() ? statsSnap.val() : {});

        } catch (error) {
          console.error("Error fetching match data:", error);
          toast({ title: "Error", description: "No se pudieron cargar los datos del partido.", variant: "destructive" });
        }
        setLoading(false);
      };
      fetchRostersAndStats();
    }
  }, [isOpen, tournamentId, homeTeamId, awayTeamId, matchId, toast]);

  const handleStatChange = (playerId: string, stat: keyof PlayerStats, value: number | boolean) => {
    setStats(prevStats => ({
      ...prevStats,
      [playerId]: {
        ...prevStats[playerId],
        goals: prevStats[playerId]?.goals || 0,
        yellowCards: prevStats[playerId]?.yellowCards || 0,
        redCard: prevStats[playerId]?.redCard || false,
        [stat]: value
      }
    }));
  };

  const handleSaveChanges = async () => {
    try {
      await set(ref(rtdb, `match_stats/${matchId}`), stats);
      toast({ title: "Estadísticas guardadas", description: "Los eventos del partido se han actualizado correctamente." });
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving stats:", error);
      toast({ title: "Error", description: "No se pudieron guardar las estadísticas.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><BarChart className="mr-2 h-4 w-4" /> Cargar Stats</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cargar Estadísticas del Partido</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3">Cargando planteles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <TeamRoster title={homeTeamName} players={homeRoster} stats={stats} onStatChange={handleStatChange} isFinished={isFinished} />
            <TeamRoster title={awayTeamName} players={awayRoster} stats={stats} onStatChange={handleStatChange} isFinished={isFinished} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          {!isFinished && <Button onClick={handleSaveChanges}>Guardar Cambios</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
