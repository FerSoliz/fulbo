
import { useState, useMemo, useEffect } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { TeamInfo, Round, PositionEntry, Team } from '@/lib/types';
import { generateBracket, generateEmptyBracket, getStageName } from '@/lib/playoffs-utils';

export const usePlayoffs = (teams: Team[], positions: PositionEntry[]) => {
  const dataSource = useMemo(() => {
    if (positions && positions.length > 0) return positions;
    return teams.map(team => ({ teamId: team.id, teamName: team.name }));
  }, [positions, teams]);

  const [playoffMode, setPlayoffMode] = useState<'automatic' | 'custom'>('automatic');
  const [numTeams, setNumTeams] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [autoRounds, setAutoRounds] = useState<Round[]>([]);
  const [customStartPhase, setCustomStartPhase] = useState<string>('');
  const [unassignedTeams, setUnassignedTeams] = useState<TeamInfo[]>([]);
  const [customRounds, setCustomRounds] = useState<Round[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<TeamInfo | null>(null);

  const allTournamentTeams = useMemo(() => 
    teams.map(t => ({ id: t.id, name: t.name, logoUrl: t.logoUrl })), [teams]);

  const autoPlayoffOptions = useMemo(() => {
    const possibleSizes = [2, 4, 8, 16, 32];
    return possibleSizes
      .filter(size => size <= dataSource.length)
      .map(size => ({ value: size.toString(), label: `${getStageName(size / 2, true)} (${size} equipos)` }));
  }, [dataSource]);

  const customPlayoffOptions = useMemo(() => {
      const possibleMatches = [1, 2, 4, 8, 16];
      return possibleMatches.map(matches => ({ value: matches.toString(), label: getStageName(matches, true) }));
  }, []);


  useEffect(() => {
    if (playoffMode === 'custom') {
      setUnassignedTeams(allTournamentTeams);
      setCustomRounds([]);
      setCustomStartPhase('');
    } else {
        const count = parseInt(numTeams, 10);
        if (!isNaN(count) && count > 0) {
            const newBracket = generateBracket(count, dataSource, teams);
            setAutoRounds(newBracket);
        }
    }
  }, [playoffMode, teams, dataSource, allTournamentTeams, numTeams]); 

  useEffect(() => {
    if (playoffMode === 'custom' && customStartPhase) {
      const numMatches = parseInt(customStartPhase, 10);
      const newBracket = generateEmptyBracket(numMatches);
      setCustomRounds(newBracket);
      setUnassignedTeams(allTournamentTeams);
    }
  }, [customStartPhase, playoffMode, allTournamentTeams]);

  useEffect(() => {
    if (playoffMode === 'automatic' && autoPlayoffOptions.length > 0) {
        if (!numTeams) {
            setNumTeams(autoPlayoffOptions[autoPlayoffOptions.length - 1].value);
        }
    } else {
        setNumTeams('');
    }
  }, [playoffMode, autoPlayoffOptions, numTeams]);

  useEffect(() => {
      if (playoffMode !== 'automatic') return;
      const count = parseInt(numTeams, 10);
      if (isNaN(count) || count === 0) {
        setAutoRounds([]);
        return;
      };
      const newBracket = generateBracket(count, dataSource, teams);
      setAutoRounds(newBracket)
  }, [playoffMode, numTeams, dataSource, teams]);


  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const team = active.data.current?.team;
    if (team) {
      setActiveTeam(team);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveTeam(null);
    const { active, over } = event;

    if (!over || !active.data.current || active.id === over.id) return;

    if (playoffMode === 'automatic' && isEditMode) {
        const sourceData = active.data.current.from;
        if (sourceData.roundIndex !== 0) return; 

        let targetData: { roundIndex: number, matchupIndex: number, position: 'home' | 'away' } | null = null;

        for (let j = 0; j < autoRounds[0].matchups.length; j++) {
          if (`match-${autoRounds[0].matchups[j].id}-home` === over.id) {
            targetData = { roundIndex: 0, matchupIndex: j, position: 'home' };
            break;
          }
          if (`match-${autoRounds[0].matchups[j].id}-away` === over.id) {
            targetData = { roundIndex: 0, matchupIndex: j, position: 'away' };
            break;
          }
        }

        if (!targetData) return;

        const newRounds = JSON.parse(JSON.stringify(autoRounds));
        const sourceTeam = newRounds[sourceData.roundIndex].matchups[sourceData.matchupIndex][sourceData.position];
        const targetTeam = newRounds[targetData.roundIndex].matchups[targetData.matchupIndex][targetData.position];

        newRounds[sourceData.roundIndex].matchups[sourceData.matchupIndex][sourceData.position] = targetTeam;
        newRounds[targetData.roundIndex].matchups[targetData.matchupIndex][targetData.position] = sourceTeam;
        
        setAutoRounds(newRounds);

    } else if (playoffMode === 'custom') {
        const sourceTeam = active.data.current.team as TeamInfo;
        let newUnassigned = [...unassignedTeams];
        let newRounds = JSON.parse(JSON.stringify(customRounds));

        const sourceIsUnassigned = unassignedTeams.some(t => t.id === sourceTeam.id);

        if (sourceIsUnassigned) {
            newUnassigned = newUnassigned.filter(t => t.id !== sourceTeam.id);
        } else {
            let found = false;
            for (const round of newRounds) {
                for (const match of round.matchups) {
                    if (match.home?.id === sourceTeam.id) {
                        match.home = null;
                        found = true; break;
                    }
                    if (match.away?.id === sourceTeam.id) {
                        match.away = null;
                        found = true; break;
                    }
                }
                if(found) break;
            }
        }

        if (over.id === 'unassigned-list') {
            if (!newUnassigned.some(t => t.id === sourceTeam.id)) {
                newUnassigned.push(sourceTeam);
            }
        } else {
            let found = false;
            for (const round of newRounds) {
                for (const match of round.matchups) {
                    const handleDrop = (position: 'home' | 'away') => {
                        const displacedTeam = match[position];
                        if (displacedTeam) {
                            if (!newUnassigned.some(t => t.id === displacedTeam.id)) {
                                newUnassigned.push(displacedTeam);
                            }
                        }
                        match[position] = sourceTeam;
                        found = true;
                    }

                    if (`match-${match.id}-home` === over.id) {
                        handleDrop('home'); break;
                    }
                    if (`match-${match.id}-away` === over.id) {
                        handleDrop('away'); break;
                    }
                }
                if(found) break;
            }
        }

        setCustomRounds(newRounds);
        setUnassignedTeams(newUnassigned.sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  return {
    playoffMode, setPlayoffMode,
    numTeams, setNumTeams,
    isEditMode, setIsEditMode,
    autoRounds,
    customStartPhase, setCustomStartPhase,
    unassignedTeams,
    customRounds,
    activeId, activeTeam,
    handleDragStart, handleDragEnd,
    autoPlayoffOptions,
    customPlayoffOptions,
  };
};
