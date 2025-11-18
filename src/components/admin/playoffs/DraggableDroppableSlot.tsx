
'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { TeamInfo } from '@/lib/types';
import { TeamDisplay } from './TeamDisplay';
import { cn } from '@/lib/utils';

interface DraggableDroppableSlotProps {
  id: string;
  team: TeamInfo | null;
  isDraggable: boolean;
  dragData?: Record<string, any>;
}

export const DraggableDroppableSlot = ({ id, team, isDraggable, dragData }: DraggableDroppableSlotProps) => {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id,
    data: dragData,
    disabled: !isDraggable || !team,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-md transition-all',
        isOver && 'ring-2 ring-accent-blue',
        isDraggable && team && 'cursor-grab'
      )}
    >
      <TeamDisplay 
        team={team} 
        isPlaceholder={!team} 
        isDragging={isDragging} 
      />
    </div>
  );
};
