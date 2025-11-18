
'use client';

import { Matchup } from "@/lib/types";
import { DraggableDroppableSlot } from "./DraggableDroppableSlot";

interface MatchupCardProps {
  matchup: Matchup;
  isDraggable: boolean;
  roundIndex: number;
  matchupIndex: number;
}

export const MatchupCard = ({ matchup, isDraggable, roundIndex, matchupIndex }: MatchupCardProps) => {
    const homeId = `match-${matchup.id}-home`;
    const awayId = `match-${matchup.id}-away`;

    return (
        <div className="w-full space-y-0.5">
            <DraggableDroppableSlot
                id={homeId}
                team={matchup.home}
                isDraggable={isDraggable}
                dragData={{ team: matchup.home, from: { roundIndex, matchupIndex, position: 'home' } }}
            />
            <div className="flex items-center justify-center py-0.5">
                <span className="text-[9px] font-bold text-muted-foreground/50">VS</span>
            </div>
            <DraggableDroppableSlot
                id={awayId}
                team={matchup.away}
                isDraggable={isDraggable}
                dragData={{ team: matchup.away, from: { roundIndex, matchupIndex, position: 'away' } }}
            />
        </div>
    );
};


