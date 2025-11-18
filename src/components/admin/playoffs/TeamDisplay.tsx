
'use client';

import Image from 'next/image';
import { TeamInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TeamDisplayProps {
  team: TeamInfo | null;
  isPlaceholder?: boolean;
  isDragging?: boolean;
}

export const TeamDisplay = ({ team, isPlaceholder = false, isDragging = false }: TeamDisplayProps) => {
  const content = team ? (
    <>
      <Image 
        src={team.logoUrl || '/images/team-placeholder.png'} 
        alt={team.name} 
        width={20}
        height={20}
        className="h-5 w-5 object-contain"
      />
      <span className="flex-1 truncate text-xs font-medium">{team.name}</span>
    </>
  ) : (
    <span className="text-xs text-muted-foreground/50">- Vacío -</span>
  );

  return (
    <div
      className={cn(
        'flex items-center w-full bg-secondary/50 rounded-md p-1 gap-2',
        'border border-transparent',
        isPlaceholder && !team && 'border-dashed border-border-soft',
        isDragging && 'opacity-50 ring-2 ring-accent-red',
      )}
    >
      {content}
    </div>
  );
};
