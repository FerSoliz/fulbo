
'use client';

import { useDraggable } from '@dnd-kit/core';
import { TeamInfo } from '@/lib/types';
import { TeamDisplay } from './TeamDisplay';
import { cn } from '@/lib/utils';

interface DraggableTeamProps {
  team: TeamInfo;
}

export const DraggableTeam = ({ team }: DraggableTeamProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: team.id,
    data: { team, type: 'team' },
  });

  return (
    <div 
      ref={setNodeRef} 
      {...attributes} 
      {...listeners}
      className={cn(
        'cursor-grab rounded-md transition-shadow',
        isDragging && 'shadow-lg'
      )}
    >
        <TeamDisplay team={team} isDragging={isDragging} />
    </div>
  );
};
