
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Team } from '@/lib/types';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent
} from '@dnd-kit/core';

// --- Tipos y Estructuras de Datos ---
interface TeamInfo {
  id: string;
  name: string;
  logoUrl?: string;
}

interface PositionEntry {
  teamId: string;
  teamName: string;
}

interface Matchup {
  id: string;
  home: TeamInfo;
  away: TeamInfo;
}

interface Round {
  title: string;
  matchups: Matchup[];
}

interface CreatePlayoffsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  teams: Team[];
  positions: PositionEntry[];
}

// --- Funciones Generadoras de Árbol ---
const getStageName = (numMatches: number, isRoundTitle = false) => {
  if (isRoundTitle) {
    switch (numMatches) {
      case 1: return 'Final';
      case 2: return 'Semifinales';
      case 4: return 'Cuartos de Final';
      case 8: return 'Octavos de Final';
      case 16: return '16vos de Final';
      default: return `Ronda de ${numMatches * 2}`;
    }
  }
  switch (numMatches) {
      case 2: return 'Semis';
      case 4: return 'Cuartos';
      case 8: return 'Octavos';
      case 16: return '16vos';
      default: return `Ronda de ${numMatches * 2}`;
  }
};

const getStageAbbreviation = (numMatches: number) => {
    switch (numMatches) {
        case 2: return 'S';
        case 4: return 'C';
        case 8: return 'O';
        case 16: return '16';
        default: return `R${numMatches * 2}`;
    }
};

const generateBracket = (numTeams: number, positions: PositionEntry[], teams: Team[]): Round[] => {
    if (numTeams < 2 || positions.length < numTeams) return [];

    const getTeamLogo = (teamId: string) => teams.find(t => t.id === teamId)?.logoUrl || undefined;
    const rounds: Round[] = [];
    let currentTeams = positions.slice(0, numTeams).map(p => ({ id: p.teamId, name: p.teamName, logoUrl: getTeamLogo(p.teamId) }));
    let numMatches = numTeams / 2;
    let matchCounter = 1;
    let winnerCounter = 1;

    const initialRound: Round = { title: getStageName(numMatches, true), matchups: [] };
    for (let i = 0; i < numMatches; i++) {
        initialRound.matchups.push({
            id: `m-${matchCounter++}`,
            home: currentTeams[i],
            away: currentTeams[numTeams - 1 - i],
        });
    }
    rounds.push(initialRound);

    numMatches /= 2;
    while (numMatches >= 1) {
        const prevRoundAbbrev = getStageAbbreviation(numMatches * 2);
        const newRound: Round = { title: getStageName(numMatches, true), matchups: [] };
        for (let i = 0; i < numMatches; i++) {
            newRound.matchups.push({
                id: `m-${matchCounter++}`,
                home: { id: `winner-${winnerCounter}`, name: `G. ${prevRoundAbbrev}${i * 2 + 1}` },
                away: { id: `winner-${winnerCounter + 1}`, name: `G. ${prevRoundAbbrev}${i * 2 + 2}` },
            });
            winnerCounter += 2;
        }
        rounds.push(newRound);
        numMatches /= 2;
    }

    return rounds;
};

// --- Componentes Visuales Reutilizables ---
const TeamDisplay = ({ team, isDragging = false }: { team: TeamInfo, isDragging?: boolean }) => {
    const isPlaceholder = team.id.startsWith('winner-');
    const opacity = isDragging ? 'opacity-50' : '';

    if (isPlaceholder) {
        return (
            <div className={`flex items-center gap-1 sm:gap-2 w-full bg-secondary/50 p-1 sm:p-2 rounded-md h-8 sm:h-10 ${opacity}`}>
                <div className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/50 text-muted-foreground font-bold text-xs sm:text-sm">?</div>
                <span className="text-xs sm:text-sm font-medium truncate text-muted-foreground italic">{team.name}</span>
            </div>
        );
    }
    
    return (
        <div className={`flex items-center gap-1 sm:gap-2 w-full bg-secondary p-1 sm:p-2 rounded-md h-8 sm:h-10 ${opacity}`}>
            <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                {team.logoUrl && <AvatarImage src={team.logoUrl} alt={team.name} />}
                <AvatarFallback className="text-[10px] sm:text-xs">{team.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-xs sm:text-sm font-medium truncate">{team.name}</span>
        </div>
    );
};

// --- Componentes para Drag and Drop ---
const DraggableTeam = ({ team, isEditMode }: { team: TeamInfo; isEditMode: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: team.id,
    data: { team },
    disabled: !isEditMode || team.id.startsWith('winner-'),
  });

  const { setNodeRef: dropRef, isOver } = useDroppable({ 
    id: team.id,
    disabled: !isEditMode || team.id.startsWith('winner-'),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const combinedRef = (node: HTMLElement | null) => {
      setNodeRef(node);
      dropRef(node);
  };

  return (
    <div ref={combinedRef} style={style} {...attributes} {...(isEditMode && !team.id.startsWith('winner-') ? listeners : {})}>
        <div className={`rounded-md transition-all ${isOver && isEditMode ? 'ring-2 ring-accent-blue' : ''} ${isEditMode ? 'cursor-grab' : 'cursor-default'}`}>
            <TeamDisplay team={team} isDragging={isDragging} />
        </div>
    </div>
  );
};

const MatchupCard = ({ matchup, isEditMode }: { matchup: Matchup, isEditMode: boolean }) => (
    <div className="w-full space-y-0.5">
        <DraggableTeam team={matchup.home} isEditMode={isEditMode} />
        <div className="flex items-center justify-center py-0.5">
            <span className="text-[10px] font-bold text-muted-foreground/60">VS</span>
        </div>
        <DraggableTeam team={matchup.away} isEditMode={isEditMode} />
    </div>
);

// --- Componentes del Árbol ---
const MatchupPair = ({ pair, isEditMode }: { pair: Matchup[], isEditMode: boolean }) => {
    return (
        <div className="relative flex flex-col justify-center items-center">
            <MatchupCard matchup={pair[0]} isEditMode={isEditMode} />
            <div className="h-4 sm:h-8" />
            <MatchupCard matchup={pair[1]} isEditMode={isEditMode} />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-full h-[calc(50%+1rem)] sm:h-[calc(50%+2rem)] w-4 sm:w-8 border-r border-y border-border-soft rounded-r-md" />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 sm:translate-x-8 w-2 sm:w-4 h-px bg-border-soft" />
        </div>
    );
};

const RoundColumn = ({ round, isEditMode }: { round: Round, isEditMode: boolean }) => {
    const matchupPairs = useMemo(() => {
        const pairs: Matchup[][] = [];
        for (let i = 0; i < round.matchups.length; i += 2) {
            pairs.push(round.matchups.slice(i, i + 2));
        }
        return pairs;
    }, [round.matchups]);

    return (
        <div className="flex flex-col justify-around items-center w-32 sm:w-56 h-full min-h-full">
            <h4 className="text-xs sm:text-base font-semibold tracking-wider uppercase text-muted-foreground mb-4 sm:mb-6 text-center">{round.title}</h4>
            <div className="flex flex-col justify-around h-full w-full">
                {matchupPairs.map((pair, index) => {
                    if (pair.length === 1) {
                        return (
                            <div key={index} className="flex justify-center items-center h-full">
                                <MatchupCard matchup={pair[0]} isEditMode={isEditMode} />
                            </div>
                        );
                    }
                    return <MatchupPair key={index} pair={pair} isEditMode={isEditMode} />;
                })}
            </div>
        </div>
    );
};

// --- Componente Principal del Modal ---
export function CreatePlayoffsDialog({ open, onOpenChange, tournamentId, teams, positions }: CreatePlayoffsDialogProps) {
  const [numTeams, setNumTeams] = useState<string>('8');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableRounds, setEditableRounds] = useState<Round[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const generatedRounds = useMemo(() => {
      const count = parseInt(numTeams, 10);
      if (isNaN(count)) return [];
      return generateBracket(count, positions, teams);
  }, [numTeams, positions, teams]);

  useEffect(() => {
    setEditableRounds(generatedRounds);
  }, [generatedRounds]);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEditableRounds(prevRounds => {
        const newRounds = JSON.parse(JSON.stringify(prevRounds));
        const firstRound = newRounds[0];
        if (!firstRound) return prevRounds;

        let activeLocation: { matchupIndex: number, position: 'home' | 'away' } | null = null;
        let overLocation: { matchupIndex: number, position: 'home' | 'away' } | null = null;

        firstRound.matchups.forEach((matchup: Matchup, index: number) => {
            if (matchup.home.id === active.id) activeLocation = { matchupIndex: index, position: 'home' };
            if (matchup.away.id === active.id) activeLocation = { matchupIndex: index, position: 'away' };
            if (matchup.home.id === over.id) overLocation = { matchupIndex: index, position: 'home' };
            if (matchup.away.id === over.id) overLocation = { matchupIndex: index, position: 'away' };
        });

        if (activeLocation && overLocation) {
            const activeTeam = firstRound.matchups[activeLocation.matchupIndex][activeLocation.position];
            const overTeam = firstRound.matchups[overLocation.matchupIndex][overLocation.position];
            firstRound.matchups[activeLocation.matchupIndex][activeLocation.position] = overTeam;
            firstRound.matchups[overLocation.matchupIndex][overLocation.position] = activeTeam;
        }

        return newRounds;
    });
  };
  
  const handleCreatePlayoffs = () => {
    console.log(`Creando playoffs para ${numTeams} equipos en el torneo ${tournamentId}`);
    console.log('Estructura de partidos:', editableRounds[0]?.matchups);
    onOpenChange(false);
  };

  const activeTeam = useMemo(() => {
      if (!activeId) return null;
      for (const round of editableRounds) {
          for (const matchup of round.matchups) {
              if (matchup.home.id === activeId) return matchup.home;
              if (matchup.away.id === activeId) return matchup.away;
          }
      }
      return null;
  }, [activeId, editableRounds]);

  const playoffOptions = useMemo(() => {
    const possibleSizes = [2, 4, 8, 16];
    return possibleSizes
      .filter(size => size <= positions.length)
      .map(size => ({ value: size.toString(), label: `${getStageName(size / 2, true)} (${size} equipos)` }));
  }, [positions.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit">
        <DialogHeader>
          <DialogTitle>Crear Playoffs</DialogTitle>
          <DialogDescription>
            Selecciona el formato y, si es necesario, activa el modo edición para ajustar los cruces manualmente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className='flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between'>
                <Select value={numTeams} onValueChange={setNumTeams}>
                    <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Seleccionar formato..." />
                    </SelectTrigger>
                    <SelectContent>
                    {playoffOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                    <Switch id="edit-mode" checked={isEditMode} onCheckedChange={setIsEditMode} />
                    <Label htmlFor="edit-mode">Modo Edición</Label>
                </div>
            </div>

          {editableRounds.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-4 text-center">Vista Previa del Árbol de Playoffs</h4>
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="p-1 sm:p-6 rounded-lg flex items-stretch overflow-x-auto bg-primary/20">
                    {editableRounds.map((round, index) => (
                    <div key={round.title} className="flex items-center">
                        <RoundColumn round={round} isEditMode={isEditMode && index === 0} />
                        {index < editableRounds.length - 1 && <div className="w-4 sm:w-12 h-full" />} {/* Spacer */}
                    </div>
                    ))}
                </div>
                <DragOverlay>
                    {activeTeam ? <TeamDisplay team={activeTeam} /> : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreatePlayoffs}>Generar Partidos de Playoffs</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
