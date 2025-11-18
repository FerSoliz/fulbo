
'use client';

import { useDroppable } from '@dnd-kit/core';
import { TeamInfo, Round } from '@/lib/types';
import { RoundColumn } from './RoundColumn';
import { DraggableTeam } from './DraggableTeam';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CustomModeViewProps {
  unassignedTeams: TeamInfo[];
  customRounds: Round[];
}

export const CustomModeView = ({ unassignedTeams, customRounds }: CustomModeViewProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-list',
  });

  return (
    <div className="flex h-full w-full gap-4">
      <div className="w-48 flex-shrink-0">
        <h3 className="text-sm font-semibold mb-2 text-center">Equipos Disponibles</h3>
        <ScrollArea 
            ref={setNodeRef} 
            className={cn(
                "h-[calc(100%-2rem)] bg-background/50 rounded-md p-2",
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

      <div className="flex-grow overflow-auto min-w-0"> {/* <--- LA SOLUCIÓN ESTÁ AQUÍ */}
          {customRounds.length > 0 ? (
            <div className="flex items-stretch p-2">
              {customRounds.map((round, index) => (
                <div key={round.title} className="flex items-center">
                  <RoundColumn 
                    round={round} 
                    roundIndex={index} 
                    isDraggable={false}
                  />
                  {index < customRounds.length - 1 && <div className="w-4 sm:w-8 h-full" />} 
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p>Selecciona una fase para empezar a construir el cuadro.</p>
            </div>
          )}
      </div>
    </div>
  );
};
