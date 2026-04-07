'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMatchStatsContext } from '@/lib/firebase/db/matches';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart, Shield, Plus, Minus, Edit, Save, X, ShieldAlert, Volleyball, RectangleHorizontal, Trophy } from 'lucide-react';

import { Player, MatchStats, PlayerStatsInfo } from '@/lib/types';

interface MatchStatsDialogProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  isFinished: boolean;
  disabled?: boolean;
  onConfirm: (stats: MatchStats) => void;
}

const PlayerStatsRow = ({ player, stats, onStatChange, onMvpSelect, isMvp, disabled }: {
    player: Player;
    stats: PlayerStatsInfo;
    onStatChange: (stat: keyof Omit<PlayerStatsInfo, 'mvp'>, value: number | boolean) => void;
    onMvpSelect: () => void;
    isMvp: boolean;
    disabled: boolean;
}) => {
    const StatCounter = ({ icon: Icon, iconClassName, stat, value, onStatChange, disabled, iconSize }: any) => (
        <div className="flex items-center justify-center gap-0 sm:gap-1">
            <Icon className={`${iconSize || 'h-4 w-4 sm:h-5 sm:w-5'} ${iconClassName || 'text-muted-foreground'}`} />
            <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"> 
              {(!disabled && value > 0) && (
                <Button size="icon" variant="outline" className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" onClick={() => onStatChange(stat, Math.max(0, value - 1))}>
                    <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <span className="font-bold w-5 text-center text-base sm:text-lg tabular-nums">{value}</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"> 
              {!disabled && (
                <Button size="icon" variant="outline" className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" onClick={() => onStatChange(stat, value + 1)}>
                    <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
        </div>
    );

    return (
        <div className={`flex items-center justify-between p-1 sm:p-2 rounded-lg border transition-colors ${disabled ? 'bg-muted/50 text-muted-foreground' : 'hover:bg-muted/50'}`}>
            <p className="font-semibold text-sm sm:text-base truncate pr-1 w-2/5 sm:w-1/3">{player.name}</p>
            <div className="flex items-center gap-1 sm:gap-3">
                <Button variant="ghost" size="icon" onClick={onMvpSelect} disabled={disabled} className="w-7 h-7 sm:w-10 sm:h-10">
                    <Trophy className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${isMvp ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50 hover:text-yellow-400'}`} />
                </Button>
                <StatCounter icon={Volleyball} stat="goals" value={stats.goals} onStatChange={onStatChange} disabled={disabled} />
                <StatCounter icon={RectangleHorizontal} iconSize="w-4 h-5 sm:w-5 sm:h-6" iconClassName="text-yellow-400 fill-current rotate-90" stat="yellowCards" value={stats.yellowCards} onStatChange={onStatChange} disabled={disabled} />
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <RectangleHorizontal className="w-4 h-5 sm:w-5 sm:h-6 text-red-600 fill-current rotate-90" />
                    <div className="w-8 h-8 flex items-center justify-center"> 
                      {!disabled && (
                        <Checkbox id={`redCard-${player.id}`} checked={stats.redCard} onCheckedChange={(checked) => onStatChange('redCard', !!checked)} className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function MatchStatsDialog({ matchId, homeTeamId, awayTeamId, isFinished, disabled, onConfirm }: MatchStatsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [homeTeam, setHomeTeam] = useState<{ name: string; players: Player[] }>({ name: 'Local', players: [] });
  const [awayTeam, setAwayTeam] = useState<{ name: string; players: Player[] }>({ name: 'Visitante', players: [] });
  const [stats, setStats] = useState<MatchStats>({});
  const { toast } = useToast();
  
  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
        const context = await getMatchStatsContext(matchId, homeTeamId, awayTeamId);
        setHomeTeam(context.homeTeam);
        setAwayTeam(context.awayTeam);
        setStats(context.stats);
    } catch (error) {
        console.error("Error al cargar datos del partido:", error);
        toast({ title: "Error de Carga", description: "No se pudieron cargar los datos.", variant: "destructive" });
        setIsOpen(false);
    } finally {
        setIsLoading(false);
    }
  }, [isOpen, matchId, homeTeamId, awayTeamId, toast]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsEditing(!isFinished);
    }
  }, [isOpen, isFinished, loadData]);

  const handleStatChange = (playerId: string, stat: keyof Omit<PlayerStatsInfo, 'mvp'>, value: number | boolean) => {
    setStats(prevStats => ({ ...prevStats, [playerId]: { ...prevStats[playerId], [stat]: value } }));
  };

  const handleMvpSelect = (selectedPlayerId: string) => {
    setStats(prevStats => {
        const isDeselecting = prevStats[selectedPlayerId]?.mvp;
        const newStats = { ...prevStats };
        for (const playerId in newStats) {
            newStats[playerId] = { ...newStats[playerId], mvp: (playerId === selectedPlayerId) && !isDeselecting };
        }
        return newStats;
    });
  };

  const handleConfirm = () => {
    // The dialog is now "dumb". It doesn't save anything.
    // It just passes the final state up to the parent component to handle orchestration.
    setIsSaving(true);
    try {
      onConfirm(stats);
      setIsOpen(false);
    } catch (error) {
      console.error("Error al confirmar los stats:", error);
      toast({ title: "Error", description: "Hubo un problema al procesar la acción.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  };

  const formIsDisabled = !isEditing || isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
            <BarChart className="mr-2 h-4 w-4" /> Cargar Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-[98vw] sm:w-[95vw] h-[90vh] sm:h-[85vh] flex flex-col">
        <DialogHeader className="p-2 sm:p-4">
          <DialogTitle className="text-lg sm:text-2xl">Planilla Digital del Partido</DialogTitle>
          <DialogDescription className="text-xs sm:text-base">Registra los eventos. Haz clic en el trofeo para elegir al MVP.</DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="home" className="flex-grow flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12">
              <TabsTrigger value="home" className="text-xs sm:text-base"><Shield className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />{homeTeam.name}</TabsTrigger>
              <TabsTrigger value="away" className="text-xs sm:text-base"><ShieldAlert className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />{awayTeam.name}</TabsTrigger>
            </TabsList>
            <div className="flex-grow overflow-y-auto mt-2 pr-1 space-y-1 sm:space-y-2">
                <TabsContent value="home" className="space-y-1 sm:space-y-2">
                    {homeTeam.players.length > 0 ? (
                        homeTeam.players.map(p => p && p.id && stats[p.id] ? <PlayerStatsRow key={p.id} player={p} stats={stats[p.id]} onStatChange={(stat, value) => handleStatChange(p.id, stat, value)} onMvpSelect={() => handleMvpSelect(p.id)} isMvp={!!stats[p.id]?.mvp} disabled={formIsDisabled} /> : null)
                    ) : (
                        <p className="text-center text-muted-foreground pt-10">No hay jugadores en el equipo local.</p>
                    )}
                </TabsContent>
                <TabsContent value="away" className="space-y-1 sm:space-y-2">
                     {awayTeam.players.length > 0 ? (
                        awayTeam.players.map(p => p && p.id && stats[p.id] ? <PlayerStatsRow key={p.id} player={p} stats={stats[p.id]} onStatChange={(stat, value) => handleStatChange(p.id, stat, value)} onMvpSelect={() => handleMvpSelect(p.id)} isMvp={!!stats[p.id]?.mvp} disabled={formIsDisabled} /> : null)
                    ) : (
                        <p className="text-center text-muted-foreground pt-10">No hay jugadores en el equipo visitante.</p>
                    )}
                </TabsContent>
            </div>
          </Tabs>
        )}
        
        <DialogFooter className="mt-2 pt-2 sm:mt-4 sm:pt-4 border-t gap-2">
          <DialogClose asChild><Button className="w-full sm:w-auto" size="lg" variant="ghost"><X className="mr-2 h-4 w-4" />Cancelar</Button></DialogClose>
          {isEditing && (
            <Button className="w-full sm:w-auto" size="lg" onClick={handleConfirm} disabled={formIsDisabled || isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
