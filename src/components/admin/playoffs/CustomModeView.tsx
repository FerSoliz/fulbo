
'use client';

import { useDroppable } from '@dnd-kit/core';
import { TeamInfo, Round } from '@/lib/types';
import { RoundColumn } from './RoundColumn';
import { DraggableTeam } from './DraggableTeam';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomModeViewProps {
  unassignedTeams: TeamInfo[];
  customRounds: Round[];
  customStartPhase: string;
  setCustomStartPhase: (value: string) => void;
  customPlayoffOptions: { value: string; label: string }[];
  isCreating: boolean;
}

export const CustomModeView = ({
  unassignedTeams,
  customRounds,
  customStartPhase,
  setCustomStartPhase,
  customPlayoffOptions,
  isCreating
}: CustomModeViewProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-list',
  });

  return (
    <div className="flex h-full w-full gap-4">
      {/* Sidebar for controls and unassigned teams */}
      <div className="w-48 flex-shrink-0 flex flex-col gap-4">
        <div>
            <Label>Arrancar desde</Label>
            <Select 
                value={customStartPhase} 
                onValueChange={setCustomStartPhase} 
                disabled={isCreating || customPlayoffOptions.length === 0}
            >
                <SelectTrigger><SelectValue placeholder="Seleccionar fase..." /></SelectTrigger>
                <SelectContent>
                {customPlayoffOptions.length > 0 ? (
                    customPlayoffOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)
                ) : (
                    <SelectItem value="" disabled>No hay fases</SelectItem>
                )}
                </SelectContent>
            </Select>
        </div>

        <div className='flex-grow flex flex-col min-h-0'>
            <h3 className="text-sm font-semibold mb-2 text-center">Equipos Disponibles</h3>
            <ScrollArea
                ref={setNodeRef}
                className={cn(
                    "h-full bg-background/50 rounded-md p-2",
                    isOver && "outline-2 outline-dashed outline-accent-red"
                )}
            >
                <div className="grid grid-cols-1 gap-1.5">
                    {unassignedTeams.length > 0 ? (
                        unassignedTeams.map(team => <DraggableTeam key={team.id} team={team} />)
                    ) : (
                        <p className="text-xs text-muted-foreground p-4 text-center">No hay equipos disponibles.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
      </div>

      {/* Main area for the playoff bracket */}
      <div className="flex-grow overflow-auto min-w-0">
        {customRounds.length > 0 ? (
          <div className="flex items-stretch p-2">
            {customRounds.map((round, index) => (
              <div key={round.title} className="flex items-center">
                <RoundColumn round={round} roundIndex={index} isDraggable={false} />
                {index < customRounds.length - 1 && <div className="w-4 sm:w-8 h-full" />} 
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full bg-black/10 rounded-md">
            <p className='text-muted-foreground'>Selecciona una fase para empezar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
