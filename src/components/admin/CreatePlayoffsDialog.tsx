
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Team, PositionEntry } from '@/lib/types';
import { usePlayoffs } from '@/hooks/usePlayoffs';
import { AutomaticModeView } from './playoffs/AutomaticModeView';
import { CustomModeView } from './playoffs/CustomModeView';
import { TeamDisplay } from './playoffs/TeamDisplay';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createPlayoffMatches } from '@/lib/firebase/db/matches'; // Importamos la función actualizada

interface CreatePlayoffsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  teams: Team[];
  positions: PositionEntry[];
}

export function CreatePlayoffsDialog({ open, onOpenChange, tournamentId, teams, positions }: CreatePlayoffsDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const {
    playoffMode, setPlayoffMode,
    numTeams, setNumTeams,
    isEditMode, setIsEditMode,
    autoRounds,
    customStartPhase, setCustomStartPhase,
    unassignedTeams,
    customRounds, // Este contiene la estructura completa del bracket
    activeTeam,
    handleDragStart, handleDragEnd,
    autoPlayoffOptions,
    customPlayoffOptions,
  } = usePlayoffs(teams, positions);

  const handleCreatePlayoffs = async () => {
    setIsCreating(true);
    try {
      let roundsToCreate = [];
      
      if (playoffMode === 'automatic') {
        if (autoRounds.length === 0 || autoRounds[0].matchups.length === 0) {
          toast({ title: "Error", description: "No hay partidos generados. Asegúrate de seleccionar un número de equipos válido.", variant: "destructive" });
          return;
        }
        roundsToCreate = autoRounds;
      } else { // Modo Personalizado
        if (customRounds.length === 0) {
          toast({ title: "Error", description: "No hay rondas definidas en el modo personalizado. Selecciona una fase de inicio.", variant: "destructive" });
          return;
        }
        roundsToCreate = customRounds;
      }

      await createPlayoffMatches(tournamentId, roundsToCreate);
      toast({
        title: "¡Playoffs Creados!",
        description: `Se generó el fixture para ${playoffMode === 'automatic' ? 'el modo automático' : 'el modo personalizado'}.`,
      });
      onOpenChange(false); // Cierra el modal al finalizar

    } catch (error) {
      console.error("Error al crear partidos de playoffs:", error);
      toast({
        title: "Error Inesperado",
        description: "Hubo un error al generar los partidos. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl xl:max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Playoffs</DialogTitle>
          <DialogDescription>
            Selecciona el modo de generación y configura los cruces.
          </DialogDescription>
        </DialogHeader>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-4 flex-grow min-h-0">
            {/* --- CONTROLS --- */}
            <div className='flex-shrink-0'>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className='w-full sm:w-auto'>
                  <Label className='text-sm font-semibold mb-2 block'>Modo de Generación</Label>
                  <ToggleGroup
                    type="single"
                    value={playoffMode}
                    onValueChange={(value: 'automatic' | 'custom') => value && setPlayoffMode(value)}
                    className="grid grid-cols2"
                    disabled={isCreating}
                  >
                    <ToggleGroupItem value="automatic">Automático</ToggleGroupItem>
                    <ToggleGroupItem value="custom">Personalizado</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                {playoffMode === 'automatic' && (
                  <div className="space-y-2 p-3 border rounded-lg bg-secondary/30 flex-grow">
                    <Label className='text-sm font-semibold'>Fase de Inicio</Label>
                    <div className='flex items-center gap-4'>
                      <Select value={numTeams} onValueChange={setNumTeams} disabled={isCreating || autoPlayoffOptions.length === 0}>
                        <SelectTrigger className='w-full sm:w-[200px]'>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {autoPlayoffOptions.length > 0 ? (
                            autoPlayoffOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)
                          ) : (
                            <SelectItem value="" disabled>No hay equipos suficientes</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                        <Switch id="edit-mode" checked={isEditMode} onCheckedChange={setIsEditMode} disabled={isCreating} />
                        <Label htmlFor="edit-mode" className='text-sm'>Modo Edición</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- PLAYOFFS TREE / VIEW --- */}
            <div className="flex-grow p-1 sm:p-4 rounded-lg bg-primary/20 overflow-auto">
              {playoffMode === 'automatic' ? (
                <AutomaticModeView autoRounds={autoRounds} isEditMode={isEditMode} />
              ) : (
                  <CustomModeView 
                    unassignedTeams={unassignedTeams} 
                    customRounds={customRounds} 
                    customStartPhase={customStartPhase}
                    setCustomStartPhase={setCustomStartPhase}
                    customPlayoffOptions={customPlayoffOptions}
                    isCreating={isCreating}
                  />
              )}
            </div>
          </div>

          <DragOverlay modifiers={[snapCenterToCursor]}>
            {activeTeam ? (
              <div className="w-48 sm:w-56">
                <TeamDisplay team={activeTeam} isPlaceholder={activeTeam.id.startsWith('winner-')}/>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <DialogFooter className='mt-4 flex-shrink-0'>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancelar</Button>
          <Button onClick={handleCreatePlayoffs} disabled={isCreating}>
            {isCreating ? 'Generando...' : 'Generar Fixture de Playoffs'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
