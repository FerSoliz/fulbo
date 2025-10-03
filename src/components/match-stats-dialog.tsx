'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart, Shield, Plus, Minus, Edit, Save, X, ShieldAlert, Volleyball, Square } from 'lucide-react';

// --- TIPOS DE DATOS ---
interface Player { id: string; name: string; }
interface PlayerStats { goals: number; yellowCards: number; redCard: boolean; }
type MatchStats = { [playerId: string]: PlayerStats };

interface MatchStatsDialogProps {
  matchId: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  isFinished: boolean;
}

// --- SUB-COMPONENTE: Fila de un Jugador (Refinamiento final v2) ---
const PlayerStatsRow = ({ player, stats, onStatChange, disabled }: {
    player: Player;
    stats: PlayerStats;
    onStatChange: (stat: keyof PlayerStats, value: number | boolean) => void;
    disabled: boolean;
}) => {
    const StatCounter = ({ icon: Icon, iconClassName, stat, value, onStatChange, disabled }: any) => (
        <div className="flex items-center justify-center gap-3">
            <Icon className={`h-6 w-6 ${iconClassName || 'text-muted-foreground'}`} />
            
            {/* MEJORA UX: El botón de restar solo aparece si !disabled y value > 0 */}
            <div className="w-9 h-9"> {/* Contenedor para mantener el espacio */}
              {(!disabled && value > 0) && (
                <Button size="icon" variant="outline" className="h-9 w-9 rounded-full" onClick={() => onStatChange(stat, Math.max(0, value - 1))}>
                    <Minus className="h-5 w-5" />
                </Button>
              )}
            </div>

            <span className="font-bold w-6 text-center text-xl tabular-nums">{value}</span>
            
            <div className="w-9 h-9"> {/* Contenedor para mantener el espacio */}
              {!disabled && (
                <Button size="icon" variant="outline" className="h-9 w-9 rounded-full" onClick={() => onStatChange(stat, value + 1)}>
                    <Plus className="h-5 w-5" />
                </Button>
              )}
            </div>
        </div>
    );

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${disabled ? 'bg-muted/50 text-muted-foreground' : 'hover:bg-muted/50'}`}>
            <p className="font-semibold text-base sm:text-lg truncate pr-2">{player.name}</p>
            <div className="flex items-center gap-4 sm:gap-6">
                <StatCounter icon={Volleyball} stat="goals" value={stats.goals} onStatChange={onStatChange} disabled={disabled} />
                <StatCounter icon={Square} iconClassName="text-yellow-400 fill-current" stat="yellowCards" value={stats.yellowCards} onStatChange={onStatChange} disabled={disabled} />
                
                <div className="flex items-center justify-center gap-3">
                    <Square className="h-6 w-6 text-red-600 fill-current" />
                    <div className="w-9 h-9 flex items-center justify-center"> {/* Contenedor para el checkbox */}
                      {!disabled && (
                        <Checkbox id={`redCard-${player.id}`} checked={stats.redCard} onCheckedChange={(checked) => onStatChange('redCard', !!checked)} className="w-7 h-7" />
                      )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- LÓGICA DE CARGA DE DATOS (YA CORREGIDA Y ROBUSTA) ---
const fetchPlayersData = async (playerIds: string[]): Promise<Player[]> => {
    if (!playerIds || playerIds.length === 0) return [];
    const playerPromises = playerIds.map(id => {
        const isDni = id.length === 8 && /^\d+$/.test(id);
        const path = isDni ? `guestPlayers/${id}` : `users/${id}`;
        return get(ref(db, path)).then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                return { id, name: data.name || 'Nombre no encontrado' };
            }
            return null;
        });
    });
    const results = await Promise.all(playerPromises);
    return results.filter((player): player is Player => player !== null);
};


// --- COMPONENTE PRINCIPAL ---
export function MatchStatsDialog({ matchId, tournamentId, homeTeamId, awayTeamId, isFinished }: MatchStatsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [homeTeam, setHomeTeam] = useState<{ name: string; players: Player[] }>({ name: 'Local', players: [] });
  const [awayTeam, setAwayTeam] = useState<{ name: string; players: Player[] }>({ name: 'Visitante', players: [] });
  const [stats, setStats] = useState<MatchStats>({});
  const { toast } = useToast();
  
  const fetchMatchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [homeTeamSnap, awayTeamSnap, homePlayerIdsSnap, awayPlayerIdsSnap, statsSnap] = await Promise.all([
            get(ref(db, `teams/${homeTeamId}/name`)),
            get(ref(db, `teams/${awayTeamId}/name`)),
            get(ref(db, `teams/${homeTeamId}/players`)),
            get(ref(db, `teams/${awayTeamId}/players`)),
            get(ref(db, `match_stats/${matchId}`))
        ]);

        const homePlayerIds = homePlayerIdsSnap.exists() ? Object.keys(homePlayerIdsSnap.val()) : [];
        const awayPlayerIds = awayPlayerIdsSnap.exists() ? Object.keys(awayPlayerIdsSnap.val()) : [];

        const [homePlayers, awayPlayers] = await Promise.all([ fetchPlayersData(homePlayerIds), fetchPlayersData(awayPlayerIds) ]);

        setHomeTeam({ name: homeTeamSnap.val() || 'Local', players: homePlayers });
        setAwayTeam({ name: awayTeamSnap.val() || 'Visitante', players: awayPlayers });
        
        const initialStats: MatchStats = {};
        const allPlayers = [...homePlayers, ...awayPlayers];
        const savedStats = statsSnap.exists() ? statsSnap.val() : {};

        allPlayers.forEach(player => {
            if (player && player.id) {
                const playerSavedStats = savedStats[player.id] || {};
                initialStats[player.id] = { goals: 0, yellowCards: 0, redCard: false, ...playerSavedStats };
            }
        });
        
        setStats(initialStats);

    } catch (error) {
        console.error("Error al cargar datos del partido:", error);
        toast({ title: "Error de Carga", description: "No se pudieron cargar los datos.", variant: "destructive" });
        setIsOpen(false);
    } finally {
        setIsLoading(false);
    }
  }, [matchId, homeTeamId, awayTeamId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchMatchData();
      setIsEditing(!isFinished);
    }
  }, [isOpen, isFinished, fetchMatchData]);

  const handleStatChange = (playerId: string, stat: keyof PlayerStats, value: number | boolean) => {
    setStats(prevStats => ({ ...prevStats, [playerId]: { ...prevStats[playerId], [stat]: value } }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await set(ref(db, `match_stats/${matchId}`), stats);
      toast({ title: "¡Éxito!", description: "Las estadísticas se guardaron correctamente.", className: "bg-green-500 text-white" });
      setIsOpen(false);
    } catch (error) {
      toast({ title: "Error al Guardar", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const formIsDisabled = !isEditing;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild><Button variant="outline"><BarChart className="mr-2 h-4 w-4" /> Cargar Stats</Button></DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Planilla Digital del Partido</DialogTitle>
          <DialogDescription>Registra los eventos de cada jugador. Los cambios se guardan al presionar el botón de Guardar.</DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="home" className="flex-grow flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="home" className="text-base"><Shield className="mr-2 h-5 w-5" />{homeTeam.name}</TabsTrigger>
              <TabsTrigger value="away" className="text-base"><ShieldAlert className="mr-2 h-5 w-5" />{awayTeam.name}</TabsTrigger>
            </TabsList>
            <div className="flex-grow overflow-y-auto mt-4 pr-2 space-y-3">
                <TabsContent value="home" className="space-y-2">
                    {homeTeam.players.length > 0 ? (
                        homeTeam.players.map(p => p && p.id && stats[p.id] ? <PlayerStatsRow key={p.id} player={p} stats={stats[p.id]} onStatChange={(stat, value) => handleStatChange(p.id, stat, value)} disabled={formIsDisabled} /> : null)
                    ) : (
                        <p className="text-center text-muted-foreground pt-10">No hay jugadores en el equipo local.</p>
                    )}
                </TabsContent>
                <TabsContent value="away" className="space-y-2">
                     {awayTeam.players.length > 0 ? (
                        awayTeam.players.map(p => p && p.id && stats[p.id] ? <PlayerStatsRow key={p.id} player={p} stats={stats[p.id]} onStatChange={(stat, value) => handleStatChange(p.id, stat, value)} disabled={formIsDisabled} /> : null)
                    ) : (
                        <p className="text-center text-muted-foreground pt-10">No hay jugadores en el equipo visitante.</p>
                    )}
                </TabsContent>
            </div>
          </Tabs>
        )}
        
        <DialogFooter className="mt-4 pt-4 border-t gap-2">
          {isFinished && !isEditing && (<Button size="lg" variant="outline" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Habilitar Edición</Button>)}
          <DialogClose asChild><Button size="lg" variant="ghost"><X className="mr-2 h-4 w-4" />Cancelar</Button></DialogClose>
          <Button size="lg" onClick={handleSaveChanges} disabled={formIsDisabled || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
