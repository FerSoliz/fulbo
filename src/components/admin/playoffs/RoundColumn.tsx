
'use client';

import { useMemo } from 'react';
import { Round, Matchup } from '@/lib/types';
import { MatchupCard } from './MatchupCard';

interface MatchupPairProps {
  pair: Matchup[];
  isDraggable: boolean;
  roundIndex: number;
  baseMatchupIndex: number;
}

const MatchupPair = ({ pair, isDraggable, roundIndex, baseMatchupIndex }: MatchupPairProps) => {
    return (
        <div className="relative flex flex-col justify-center items-center">
            <MatchupCard 
                matchup={pair[0]} 
                isDraggable={isDraggable} 
                roundIndex={roundIndex}
                matchupIndex={baseMatchupIndex}
            />
            <div className="h-2 sm:h-4" />
            <MatchupCard 
                matchup={pair[1]} 
                isDraggable={isDraggable} 
                roundIndex={roundIndex}
                matchupIndex={baseMatchupIndex + 1}
            />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-full h-[calc(50%+0.5rem)] sm:h-[calc(50%+1rem)] w-2 sm:w-4 border-r border-y border-border-soft rounded-r-md" />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-2 sm:translate-x-4 w-1 sm:w-2 h-px bg-border-soft" />
        </div>
    );
};

interface RoundColumnProps {
  round: Round;
  roundIndex: number;
  isDraggable: boolean;
}

export const RoundColumn = ({ round, roundIndex, isDraggable }: RoundColumnProps) => {
    const matchupPairs = useMemo(() => {
        const pairs: Matchup[][] = [];
        for (let i = 0; i < round.matchups.length; i += 2) {
            pairs.push(round.matchups.slice(i, i + 2));
        }
        return pairs;
    }, [round.matchups]);

    return (
        <div className="flex flex-col justify-around items-center w-28 sm:w-40 h-full min-h-full">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4 text-center">{round.title}</h4>
            <div className="flex flex-col justify-around h-full w-full">
                {matchupPairs.map((pair, index) => {
                    if (pair.length === 1) {
                        return (
                            <div key={index} className="flex justify-center items-center h-full">
                                <MatchupCard 
                                    matchup={pair[0]} 
                                    isDraggable={isDraggable} 
                                    roundIndex={roundIndex}
                                    matchupIndex={index * 2}
                                />
                            </div>
                        );
                    }
                    return (
                      <MatchupPair 
                        key={index} 
                        pair={pair} 
                        isDraggable={isDraggable} 
                        roundIndex={roundIndex}
                        baseMatchupIndex={index * 2}
                      />
                    );
                })}
            </div>
        </div>
    );
};
