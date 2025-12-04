
import { useState, useMemo, useEffect } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { TeamInfo, Round, PositionEntry, Team, Matchup } from '@/lib/types';
import { generateBracket, generateEmptyBracket, getStageName } from '@/lib/playoffs-utils';

/**
 * Recorre un bracket de playoffs y añade las referencias al siguiente partido.
 * Esta función es clave para permitir el avance automático de los ganadores.
 * @param rounds Las rondas generadas que se van a interconectar.
 * @returns Un nuevo array de rondas con los matchups actualizados.
 */
const linkBracket = (rounds: Round[]): Round[] => {
  // Creamos una copia profunda para no mutar el estado original, una buena práctica en React.
  const newRounds = JSON.parse(JSON.stringify(rounds));

  // Iteramos sobre las rondas, excepto la última (la final no avanza a ningún lado).
  for (let i = 0; i < newRounds.length - 1; i++) {
    const currentRound = newRounds[i];
    const nextRound = newRounds[i + 1];

    // Iteramos sobre los partidos de la ronda actual de 2 en 2.
    for (let j = 0; j < currentRound.matchups.length; j += 2) {
      const match1 = currentRound.matchups[j];
      const match2 = currentRound.matchups[j + 1];
      // El partido destino en la siguiente ronda es el índice j dividido por 2.
      const nextMatchup = nextRound.matchups[Math.floor(j / 2)];

      if (match1 && nextMatchup) {
        (match1 as Matchup).nextMatchupId = nextMatchup.id;
        (match1 as Matchup).nextMatchupPosition = 'home';
      }
      if (match2 && nextMatchup) {
        (match2 as Matchup).nextMatchupId = nextMatchup.id;
        (match2 as Matchup).nextMatchupPosition = 'away';
      }
    }
  }

  return newRounds;
};

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
    }
  }, [playoffMode, allTournamentTeams]); 

  useEffect(() => {
    if (playoffMode === 'custom' && customStartPhase) {
      const numMatches = parseInt(customStartPhase, 10);
      if (isNaN(numMatches) || numMatches <= 0) {
        setCustomRounds([]);
        return;
      }
      const newBracket = generateEmptyBracket(numMatches);
      const linkedBracket = linkBracket(newBracket); // Se aplica la lógica de interconexión
      setCustomRounds(linkedBracket);
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
      const linkedBracket = linkBracket(newBracket); // Se aplica la lógica de interconexión
      setAutoRounds(linkedBracket)
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
