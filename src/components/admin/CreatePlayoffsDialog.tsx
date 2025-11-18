
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Team, PositionEntry } from '@/lib/types';
import { usePlayoffs } from '@/hooks/usePlayoffs';
import { PlayoffControls } from './playoffs/PlayoffControls';
import { AutomaticModeView } from './playoffs/AutomaticModeView';
import { CustomModeView } from './playoffs/CustomModeView';
import { TeamDisplay } from './playoffs/TeamDisplay';

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
    customRounds,
    activeTeam,
    handleDragStart, handleDragEnd,
    autoPlayoffOptions,
    customPlayoffOptions,
  } = usePlayoffs(teams, positions);

  const handleCreatePlayoffs = async () => {
    alert("Funcionalidad de 'Generar Partidos' pendiente de implementación.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl xl:max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crear Playoffs</DialogTitle>
          <DialogDescription>
            Selecciona el modo de generación y arrastra los equipos para configurar los cruces.
          </DialogDescription>
        </DialogHeader>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-col sm:flex-row gap-4 h-full pt-4">
            <PlayoffControls
              playoffMode={playoffMode}
              setPlayoffMode={setPlayoffMode}
              isCreating={isCreating}
              numTeams={numTeams}
              setNumTeams={setNumTeams}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              autoPlayoffOptions={autoPlayoffOptions}
              customStartPhase={customStartPhase}
              setCustomStartPhase={setCustomStartPhase}
              customPlayoffOptions={customPlayoffOptions}
            />

            <div className="flex-grow p-1 sm:p-6 rounded-lg bg-primary/20 overflow-auto">
              {playoffMode === 'automatic' ? (
                <AutomaticModeView autoRounds={autoRounds} isEditMode={isEditMode} />
              ) : (
                <CustomModeView unassignedTeams={unassignedTeams} customRounds={customRounds} />
              )}
            </div>
          </div>

          <DragOverlay modifiers={[snapCenterToCursor]}>
            {activeTeam ? (
              <div className="w-48 sm:w-56">
                <TeamDisplay team={activeTeam} isPlaceholder={activeTeam.id.startsWith('winner-')} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancelar</Button>
          <Button onClick={handleCreatePlayoffs} disabled={isCreating}>
            {isCreating ? 'Generando...' : 'Generar Partidos de Playoffs'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
