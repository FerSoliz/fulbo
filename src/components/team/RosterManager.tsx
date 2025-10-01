'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, UserX } from 'lucide-react';
import { PlayerSearch, FoundPlayer } from '@/components/search/PlayerSearch';
import { AddGuestPlayerForm } from '@/components/team/AddGuestPlayerForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getTeamRoster, addGuestPlayerToTeam, addRegisteredPlayerToTeam, removePlayerFromTeam } from '@/lib/firebase/db';

export interface RosterPlayer {
  id: string;
  name: string;
  dni: string;
  isGuest: boolean;
}

interface RosterManagerProps {
  teamId: string;
}

type RightPanelState = 'SEARCH' | 'ADD_GUEST' | 'PLAYER_FOUND';

export function RosterManager({ teamId }: RosterManagerProps) {
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanelState>('SEARCH');
  const [dniToRegister, setDniToRegister] = useState<string | null>(null);
  const [foundPlayer, setFoundPlayer] = useState<FoundPlayer | null>(null);
  const { toast } = useToast();

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const teamRoster = await getTeamRoster(teamId);
      setRoster(teamRoster);
    } catch (error) {
      console.error("Error al cargar la plantilla:", error);
      toast({ title: "Error", description: "No se pudo cargar la plantilla del equipo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [teamId, toast]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handlePlayerFound = (player: FoundPlayer) => {
    setFoundPlayer(player);
    setRightPanel('PLAYER_FOUND');
  };

  const handlePlayerNotFound = (dni: string) => {
    setDniToRegister(dni);
    setRightPanel('ADD_GUEST');
  };

  const resetRightPanel = () => {
    setRightPanel('SEARCH');
    setDniToRegister(null);
    setFoundPlayer(null);
  };

  const handleAddRegisteredPlayer = async (player: FoundPlayer) => {
    setIsSubmitting(true);
    const success = await addRegisteredPlayerToTeam(player.id, teamId);
    if (success) {
      toast({ title: "¡Éxito!", description: `${player.name} fue añadido al equipo.` });
      await fetchRoster();
      resetRightPanel();
    } else {
      toast({ title: "Error", description: `No se pudo añadir a ${player.name}. Puede que ya esté en el equipo.`, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleAddGuestPlayer = async (name: string, dni: string) => {
    setIsSubmitting(true);
    const newRosterPlayer = await addGuestPlayerToTeam(name, dni, teamId);
    if (newRosterPlayer) {
      toast({ title: "¡Éxito!", description: `Jugador invitado ${name} fue añadido al equipo.` });
      await fetchRoster();
      resetRightPanel();
    } else {
      toast({ title: "Error", description: "No se pudo añadir al jugador invitado.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    setIsSubmitting(true);
    const success = await removePlayerFromTeam(playerId, teamId);
    if (success) {
      toast({ title: "Jugador Eliminado", description: `${playerName} fue eliminado de la plantilla.` });
      await fetchRoster();
    } else {
      toast({ title: "Error", description: "No se pudo eliminar al jugador.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" aria-live="polite" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando plantilla del equipo...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Plantilla Actual ({roster.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {roster.length === 0 ? (
              <p className="text-center text-muted-foreground italic py-4">Tu plantilla está vacía. Usa el buscador para añadir jugadores.</p>
            ) : (
              <ul className="space-y-3">
                {roster.map(player => (
                  <li key={player.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-muted-foreground">DNI: {player.dni} {player.isGuest && <span className='text-xs font-bold text-accent-foreground'>(Invitado)</span>}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePlayer(player.id, player.name)} disabled={isSubmitting}>
                      <UserX className="h-4 w-4 text-destructive"/>
                      <span className="sr-only">Quitar jugador {player.name}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="sticky top-24 space-y-4">
          {rightPanel === 'SEARCH' && (
            <Card>
              <CardHeader>
                  <CardTitle>Añadir Jugador</CardTitle>
                  <CardDescription>Busca por DNI para añadir un jugador existente.</CardDescription>
              </CardHeader>
              <CardContent>
                  <PlayerSearch onPlayerFound={handlePlayerFound} onPlayerNotFound={handlePlayerNotFound} disabled={isSubmitting} />
              </CardContent>
            </Card>
          )}

          {rightPanel === 'ADD_GUEST' && dniToRegister && (
            <AddGuestPlayerForm 
              dni={dniToRegister} 
              onAddGuest={handleAddGuestPlayer} 
              onCancel={resetRightPanel} 
              isSubmitting={isSubmitting}
            />
          )}

          {rightPanel === 'PLAYER_FOUND' && foundPlayer && (
             <Card>
                <CardHeader>
                    <CardTitle>Jugador Encontrado</CardTitle>
                    <CardDescription>
                        Hemos encontrado un jugador con este DNI. Confirma que es la persona correcta antes de añadirla a tu equipo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={foundPlayer.avatar} alt={`Avatar de ${foundPlayer.name}`} />
                            <AvatarFallback>{foundPlayer.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-xl font-bold">{foundPlayer.name}</p>
                            <p className="text-sm text-muted-foreground">@{foundPlayer.username}</p>
                            <p className="text-sm text-muted-foreground">DNI: {foundPlayer.dni}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={resetRightPanel} disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={() => handleAddRegisteredPlayer(foundPlayer)} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Añadir al Equipo'}
                    </Button>
                </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
