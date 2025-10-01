'use client';

import { useState, useEffect, useCallback } from 'react';
import { rtdb, ref, get, set } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart, Shield, Sword, Plus, Minus, Edit, Save, X, ShieldAlert } from 'lucide-react';

// --- TIPOS DE DATOS ---
// Para mayor claridad y mantenibilidad, definimos las interfaces que usará el componente.
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

// Stats del partido, organizadas por ID de jugador.
type MatchStats = { [playerId: string]: PlayerStats };

interface MatchStatsDialogProps {
  matchId: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  isFinished: boolean;
}

// --- SUB-COMPONENTE: Fila de un Jugador ---
// Dividir en componentes más pequeños mejora la legibilidad y el rendimiento.
const PlayerStatsRow = ({ player, stats, onStatChange, disabled }: {
    player: Player;
    stats: PlayerStats;
    onStatChange: (stat: keyof PlayerStats, value: number | boolean) => void;
    disabled: boolean;
}) => {
    // Componente para los contadores, evitando duplicación de código.
    const StatCounter = ({ icon, stat, value, onStatChange, disabled }: any) => (
        <div className="flex items-center justify-center gap-2">
            {icon}
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onStatChange(stat, Math.max(0, value - 1))} disabled={disabled}>
                <Minus className="h-4 w-4" />
            </Button>
            <span className="font-bold w-5 text-center text-lg">{value}</span>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => onStatChange(stat, value + 1)} disabled={disabled}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );

    return (
        <div className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-muted/50">
            <p className="font-medium text-sm sm:text-base">{player.name} {player.lastName}</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
                <StatCounter icon={<Sword className="h-5 w-5 text-muted-foreground" />} stat="goals" value={stats.goals} onStatChange={onStatChange} disabled={disabled} />
                <StatCounter icon={<div className="w-4 h-5 bg-yellow-400 border border-black rounded-sm" />} stat="yellowCards" value={stats.yellowCards} onStatChange={onStatChange} disabled={disabled} />
                <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-5 bg-red-600 border border-black rounded-sm" />
                    <Checkbox id={`redCard-${player.id}`} checked={stats.redCard} onCheckedChange={(checked) => onStatChange('redCard', !!checked)} className="w-6 h-6" disabled={disabled} />
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export function MatchStatsDialog({ matchId, tournamentId, homeTeamId, awayTeamId, isFinished }: MatchStatsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Para habilitar edición en partidos finalizados
  const [homeTeam, setHomeTeam] = useState<{ name: string; roster: Player[] }>({ name: 'Local', roster: [] });
  const [awayTeam, setAwayTeam] = useState<{ name: string; roster: Player[] }>({ name: 'Visitante', roster: [] });
  const [stats, setStats] = useState<MatchStats>({});
  const { toast } = useToast();
  
  // Usamos useCallback para memorizar la función y evitar re-renders innecesarios.
  const fetchMatchData = useCallback(async () => {
    setIsLoading(true);
    try {
        // Ejecutamos todas las peticiones a la base de datos en paralelo para mayor eficiencia.
        const [homeTeamSnap, awayTeamSnap, homeRosterSnap, awayRosterSnap, statsSnap] = await Promise.all([
            get(ref(rtdb, `teams/${homeTeamId}/name`)),
            get(ref(rtdb, `teams/${awayTeamId}/name`)),
            get(ref(rtdb, `tournaments/${tournamentId}/teams/${homeTeamId}/roster`)),
            get(ref(rtdb, `tournaments/${tournamentId}/teams/${awayTeamId}/roster`)),
            get(ref(rtdb, `match_stats/${matchId}`))
        ]);

        setHomeTeam({ name: homeTeamSnap.val() || 'Local', roster: homeRosterSnap.exists() ? Object.values(homeRosterSnap.val()) : [] });
        setAwayTeam({ name: awayTeamSnap.val() || 'Visitante', roster: awayRosterSnap.exists() ? Object.values(awayRosterSnap.val()) : [] });
        
        // Inicializamos las estadísticas para todos los jugadores, incluso si no tienen eventos.
        const initialStats: MatchStats = {};
        const allPlayers = [...(homeRosterSnap.val() ? Object.values(homeRosterSnap.val()) : []), ...(awayRosterSnap.val() ? Object.values(awayRosterSnap.val()) : [])] as Player[];
        
        allPlayers.forEach(player => {
            initialStats[player.id] = { goals: 0, yellowCards: 0, redCard: false };
        });

        // Fusionamos las estadísticas guardadas con las iniciales.
        setStats(statsSnap.exists() ? { ...initialStats, ...statsSnap.val() } : initialStats);

    } catch (error) {
        console.error("Error al cargar datos del partido:", error);
        toast({ title: "Error de Carga", description: "No se pudieron cargar los datos. Inténtalo de nuevo.", variant: "destructive" });
        setIsOpen(false);
    } finally {
        setIsLoading(false);
    }
  }, [matchId, tournamentId, homeTeamId, awayTeamId, toast]);

  // Efecto que se ejecuta solo cuando se abre el modal.
  useEffect(() => {
    if (isOpen) {
      fetchMatchData();
      // Si el partido está finalizado, por defecto no se puede editar.
      setIsEditing(!isFinished);
    }
  }, [isOpen, isFinished, fetchMatchData]);

  const handleStatChange = (playerId: string, stat: keyof PlayerStats, value: number | boolean) => {
    setStats(prevStats => ({
      ...prevStats,
      [playerId]: {
        ...prevStats[playerId],
        [stat]: value
      }
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await set(ref(rtdb, `match_stats/${matchId}`), stats);
      toast({ title: "¡Éxito!", description: "Las estadísticas del partido se guardaron correctamente.", className: "bg-green-500 text-white" });
      setIsOpen(false);
    } catch (error) {
      console.error("Error al guardar estadísticas:", error);
      toast({ title: "Error al Guardar", description: "No se pudieron guardar los cambios. Revisa tu conexión.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const formIsDisabled = !isEditing;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><BarChart className="mr-2 h-4 w-4" /> Cargar Stats</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-[95vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Planilla Digital del Partido</DialogTitle>
          <DialogDescription>
            Registra los eventos (goles, tarjetas) de cada jugador. Los cambios se guardan al final.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="home" className="flex-grow flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="home"><Shield className="mr-2 h-4 w-4" />{homeTeam.name}</TabsTrigger>
              <TabsTrigger value="away"><ShieldAlert className="mr-2 h-4 w-4" />{awayTeam.name}</TabsTrigger>
            </TabsList>
            <div className="flex-grow overflow-y-auto mt-4 pr-2">
                <TabsContent value="home">
                    {homeTeam.roster.map(player => (
                        <PlayerStatsRow key={player.id} player={player} stats={stats[player.id]} onStatChange={(stat, value) => handleStatChange(player.id, stat, value)} disabled={formIsDisabled} />
                    ))}
                </TabsContent>
                <TabsContent value="away">
                    {awayTeam.roster.map(player => (
                        <PlayerStatsRow key={player.id} player={player} stats={stats[player.id]} onStatChange={(stat, value) => handleStatChange(player.id, stat, value)} disabled={formIsDisabled} />
                    ))}
                </TabsContent>
            </div>
          </Tabs>
        )}
        
        <DialogFooter className="mt-4 pt-4 border-t">
          {isFinished && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Habilitar Edición
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="ghost"><X className="mr-2 h-4 w-4" />Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveChanges} disabled={formIsDisabled || isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
