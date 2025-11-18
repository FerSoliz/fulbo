
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Team } from '@/lib/types';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

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
  home: TeamInfo | null;
  away: TeamInfo | null;
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

// --- Constantes y Placeholders ---
const PLACEHOLDER_TEAM: TeamInfo = { id: 'placeholder', name: 'Equipo a definir' };

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
        case 1: return 'F';
        case 2: return 'SF';
        case 4: return 'CF';
        case 8: return 'OF';
        case 16: return '16';
        default: return `R${numMatches * 2}`
    }
};

// Genera un árbol con equipos reales (Modo Automático)
const generateBracket = (numTeams: number, dataSource: PositionEntry[], teams: Team[]): Round[] => {
    if (numTeams < 2 || dataSource.length < numTeams) return [];

    const getTeamLogo = (teamId: string) => teams.find(t => t.id === teamId)?.logoUrl || undefined;
    const rounds: Round[] = [];
    let currentTeams = dataSource.slice(0, numTeams).map(p => ({ id: p.teamId, name: p.teamName, logoUrl: getTeamLogo(p.teamId) }));
    let numMatches = numTeams / 2;
    let matchCounter = 1;
    
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
                home: { id: `winner-${prevRoundAbbrev}${i * 2 + 1}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 1}` },
                away: { id: `winner-${prevRoundAbbrev}${i * 2 + 2}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 2}` },
            });
        }
        rounds.push(newRound);
        numMatches /= 2;
    }

    return rounds;
};

// Genera un árbol vacío con placeholders (Modo Personalizado)
const generateEmptyBracket = (startPhaseMatches: number): Round[] => {
    if (!startPhaseMatches) return [];
    const rounds: Round[] = [];
    let numMatches = startPhaseMatches;
    let matchCounter = 1;

    // Primera ronda con placeholders
    const initialRound: Round = { title: getStageName(numMatches, true), matchups: [] };
    for (let i = 0; i < numMatches; i++) {
        initialRound.matchups.push({
            id: `m-${matchCounter++}`,
            home: null, // Vacío
            away: null, // Vacío
        });
    }
    rounds.push(initialRound);

    // Rondas siguientes con ganadores
    numMatches /= 2;
    while (numMatches >= 1) {
        const prevRoundAbbrev = getStageAbbreviation(numMatches * 2);
        const newRound: Round = { title: getStageName(numMatches, true), matchups: [] };
        for (let i = 0; i < numMatches; i++) {
            newRound.matchups.push({
                id: `m-${matchCounter++}`,
                home: { id: `winner-ph-${prevRoundAbbrev}${i * 2 + 1}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 1}` },
                away: { id: `winner-ph-${prevRoundAbbrev}${i * 2 + 2}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 2}` },
            });
        }
        rounds.push(newRound);
        numMatches /= 2;
    }
    return rounds;
}


// --- Componentes de UI ---

const TeamDisplay = ({ team, isPlaceholder, isDragging = false }: { team: TeamInfo | null, isPlaceholder?: boolean, isDragging?: boolean }) => {
    const isWinnerPlaceholder = team && (isPlaceholder || team.id.startsWith('winner-'));
    const opacity = isDragging ? 'opacity-30' : 'opacity-100';

    if (!team || isWinnerPlaceholder) {
        return (
            <div className={`flex items-center gap-1 sm:gap-2 w-full bg-secondary/50 p-1 sm:p-2 rounded-md h-8 sm:h-10 ${opacity}`}>
                <div className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/50 text-muted-foreground font-bold text-xs sm:text-sm">?</div>
                <span className="text-xs sm:text-sm font-medium truncate text-muted-foreground italic">{team?.name || 'A definir'}</span>
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


const DraggableTeam = ({ team, slotId, isDraggable }: { team: TeamInfo; slotId: string; isDraggable: boolean; }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: slotId, // Usamos el ID del slot para identificar el origen
        data: { team, from: 'list' },
        disabled: !isDraggable,
    });
    
    const style = { transform: CSS.Transform.toString(transform) };

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            <div 
              {...attributes} 
              {...(isDraggable ? listeners : {})}
              className="flex items-center gap-2 p-2 rounded-md bg-container hover:bg-container/80 transition-colors cursor-grab"
            >
                <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                <TeamDisplay team={team} isDragging={isDragging} />
            </div>
        </div>
    );
};


const DroppableSlot = ({ team, slotId, children }: { team: TeamInfo | null; slotId: string; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id: slotId });

    return (
        <div ref={setNodeRef} className={`rounded-md transition-all ${isOver ? 'ring-2 ring-accent-blue' : ''}`}>
            {children}
        </div>
    );
};

const MatchupCard = ({ matchup, roundIndex }: { matchup: Matchup, roundIndex: number }) => {
    return (
        <div className="w-full space-y-0.5">
            <DroppableSlot slotId={`match-${matchup.id}-home`} team={matchup.home}>
                <TeamDisplay team={matchup.home} isPlaceholder={!matchup.home} />
            </DroppableSlot>
            <div className="flex items-center justify-center py-0.5">
                <span className="text-[10px] font-bold text-muted-foreground/60">VS</span>
            </div>
            <DroppableSlot slotId={`match-${matchup.id}-away`} team={matchup.away}>
                <TeamDisplay team={matchup.away} isPlaceholder={!matchup.away} />
            </DroppableSlot>
        </div>
    );
};


const MatchupPair = ({ pair }: { pair: Matchup[] }) => {
    return (
        <div className="relative flex flex-col justify-center items-center">
            <MatchupCard matchup={pair[0]} roundIndex={0} />
            <div className="h-4 sm:h-8" />
            <MatchupCard matchup={pair[1]} roundIndex={0} />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-full h-[calc(50%+1rem)] sm:h-[calc(50%+2rem)] w-4 sm:w-8 border-r border-y border-border-soft rounded-r-md" />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 sm:translate-x-8 w-2 sm:w-4 h-px bg-border-soft" />
        </div>
    );
};

const RoundColumn = ({ round, roundIndex }: { round: Round, roundIndex: number }) => {
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
                                <MatchupCard matchup={pair[0]} roundIndex={roundIndex} />
                            </div>
                        );
                    }
                    return <MatchupPair key={index} pair={pair} />;
                })}
            </div>
        </div>
    );
};

// --- Componente Principal del Dialog ---

export function CreatePlayoffsDialog({ open, onOpenChange, tournamentId, teams, positions }: CreatePlayoffsDialogProps) {
  // --- Estados Generales ---
  const [playoffMode, setPlayoffMode] = useState<'automatic' | 'custom'>('automatic');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  // --- Estados Modo Automático ---
  const [numTeams, setNumTeams] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [autoRounds, setAutoRounds] = useState<Round[]>([]);

  // --- Estados Modo Personalizado ---
  const [customStartPhase, setCustomStartPhase] = useState<string>('');
  const [unassignedTeams, setUnassignedTeams] = useState<TeamInfo[]>([]);
  const [customRounds, setCustomRounds] = useState<Round[]>([]);
  
  // --- Estados Drag and Drop ---
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<TeamInfo | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // --- Memos y Efectos para Lógica de Datos ---

  const allTournamentTeams = useMemo(() => 
    teams.map(t => ({ id: t.id, name: t.name, logoUrl: t.logoUrl })), [teams]);

  // Inicializa los equipos sin asignar para el modo personalizado
  useEffect(() => {
    if (playoffMode === 'custom') {
      setUnassignedTeams(allTournamentTeams);
      setCustomRounds([]); // Limpia el árbol al cambiar de modo
      setCustomStartPhase('');
    }
  }, [playoffMode, allTournamentTeams]);

  // Genera el árbol vacío para el modo personalizado
  useEffect(() => {
    if (playoffMode === 'custom' && customStartPhase) {
      const numMatches = parseInt(customStartPhase, 10);
      const newBracket = generateEmptyBracket(numMatches);
      setCustomRounds(newBracket);
      // Resetea los equipos, ya que el arbol cambió
      setUnassignedTeams(allTournamentTeams);
    }
  }, [customStartPhase, playoffMode, allTournamentTeams]);
  
  const dataSource = useMemo(() => {
    if (positions && positions.length > 0) return positions;
    return teams.map(team => ({ teamId: team.id, teamName: team.name }));
  }, [positions, teams]);

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
      if (playoffMode === 'automatic' && autoPlayoffOptions.length > 0) {
          setNumTeams(autoPlayoffOptions[autoPlayoffOptions.length - 1].value);
      } else {
          setNumTeams('');
      }
  }, [playoffMode, autoPlayoffOptions]);

  const generatedAutoRounds = useMemo(() => {
      if (playoffMode !== 'automatic') return [];
      const count = parseInt(numTeams, 10);
      if (isNaN(count) || count === 0) return [];
      return generateBracket(count, dataSource, teams);
  }, [playoffMode, numTeams, dataSource, teams]);

  useEffect(() => {
    setAutoRounds(generatedAutoRounds);
  }, [generatedAutoRounds]);

  // --- Lógica de Drag and Drop (dnd-kit) ---

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const dragSource = active.data.current?.from;
    const team = active.data.current?.team;
    
    if (team) {
      setActiveTeam(team);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveTeam(null);
    const { active, over } = event;

    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;

    // Lógica para modo Personalizado
    if (playoffMode === 'custom') {
        const newRounds = JSON.parse(JSON.stringify(customRounds));
        let newUnassigned = [...unassignedTeams];
        
        const sourceTeam = active.data.current?.team as TeamInfo;
        
        // Encuentra la ubicación de origen y destino
        let sourceLocation: 'list' | { round: number; match: number; pos: 'home' | 'away' } = 'list';
        
        customRounds.forEach((r, ri) => r.matchups.forEach((m, mi) => {
          if (`match-${m.id}-home` === activeId) sourceLocation = { round: ri, match: mi, pos: 'home' };
          if (`match-${m.id}-away` === activeId) sourceLocation = { round: ri, match: mi, pos: 'away' };
        }));

        let targetLocation: 'list' | { round: number; match: number; pos: 'home' | 'away' } | null = null;
        if (overId === 'unassigned-list') {
            targetLocation = 'list';
        } else {
            customRounds.forEach((r, ri) => r.matchups.forEach((m, mi) => {
              if (`match-${m.id}-home` === overId) targetLocation = { round: ri, match: mi, pos: 'home' };
              if (`match-${m.id}-away` === overId) targetLocation = { round: ri, match: mi, pos: 'away' };
            }));
        }

        if (!targetLocation) return;
        
        // Realizar el intercambio
        const targetTeam = over.data.current?.team as TeamInfo | null;
        
        // 1. Quitar el equipo de su lugar de origen
        if (sourceLocation === 'list') {
            newUnassigned = newUnassigned.filter(t => t.id !== sourceTeam.id);
        } else {
            newRounds[sourceLocation.round].matchups[sourceLocation.match].home = null;
        }

        // 2. Poner el equipo en su nuevo lugar
        if (targetLocation === 'list') {
            if (!newUnassigned.find(t => t.id === sourceTeam.id)) {
                newUnassigned.push(sourceTeam);
            }
        } else {
            // Si había un equipo en el destino, moverlo a la lista de no asignados
            const displacedTeam = newRounds[targetLocation.round].matchups[targetLocation.match][targetLocation.pos];
            if (displacedTeam && !newUnassigned.find(t => t.id === displacedTeam.id)) {
                newUnassigned.push(displacedTeam);
            }
            newRounds[targetLocation.round].matchups[targetLocation.match][targetLocation.pos] = sourceTeam;
        }

        setCustomRounds(newRounds);
        setUnassignedTeams(newUnassigned);
    }
  };
  
  const handleCreatePlayoffs = async () => {
    // Lógica para generar partidos (se adaptará más adelante)
    alert("Funcionalidad de 'Generar Partidos' pendiente de implementación para el modo personalizado.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl xl:max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crear Playoffs</DialogTitle>
          <DialogDescription>
            Selecciona el modo de generación y arrastra los equipos para configurar los cruces.
          </DialogDescription>
        </DialogHeader>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col sm:flex-row gap-4 h-full pt-4">

                {/* --- Panel de Controles y Equipos --- */}
                <div className="w-full sm:w-64 flex-shrink-0 space-y-4">
                    <h3 className="text-lg font-semibold">Configuración</h3>
                    <ToggleGroup
                        type="single"
                        value={playoffMode}
                        onValueChange={(value: 'automatic' | 'custom') => value && setPlayoffMode(value)}
                        className="grid grid-cols-2"
                        disabled={isCreating}
                    >
                        <ToggleGroupItem value="automatic">Automático</ToggleGroupItem>
                        <ToggleGroupItem value="custom">Personalizado</ToggleGroupItem>
                    </ToggleGroup>

                    {playoffMode === 'automatic' && (
                        <div className="space-y-4 p-4 border rounded-lg">
                           <Label>Fase de Inicio</Label>
                           <Select value={numTeams} onValueChange={setNumTeams} disabled={isCreating || autoPlayoffOptions.length === 0}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar formato..." /></SelectTrigger>
                                <SelectContent>
                                    {autoPlayoffOptions.length > 0 ? (
                                        autoPlayoffOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)
                                    ) : (
                                        <SelectItem value="" disabled>No hay equipos suficientes</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center space-x-2">
                                <Switch id="edit-mode" checked={isEditMode} onCheckedChange={setIsEditMode} disabled={isCreating} />
                                <Label htmlFor="edit-mode">Modo Edición</Label>
                            </div>
                        </div>
                    )}

                    {playoffMode === 'custom' && (
                        <div className="space-y-4 p-4 border rounded-lg">
                            <Label>Arrancar Playoffs desde</Label>
                            <Select value={customStartPhase} onValueChange={setCustomStartPhase} disabled={isCreating || customPlayoffOptions.length === 0}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar fase..." /></SelectTrigger>
                                <SelectContent>
                                    {customPlayoffOptions.length > 0 ? (
                                        customPlayoffOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)
                                    ) : (
                                        <SelectItem value="" disabled>No hay fases disponibles</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    {playoffMode === 'custom' && (
                        <div className="space-y-2 pt-4">
                            <h3 className="text-lg font-semibold">Equipos Disponibles</h3>
                            <DroppableSlot slotId="unassigned-list" team={null}>
                                <ScrollArea className="h-96 w-full rounded-md border p-2 bg-primary/20">
                                  <div className="space-y-2">
                                    {unassignedTeams.length > 0 ? unassignedTeams.map(team => (
                                        <DraggableTeam key={team.id} team={team} slotId={team.id} isDraggable={true} />
                                    )) : (
                                        <p className="p-4 text-sm text-center text-muted-foreground">No hay equipos para asignar.</p>
                                    )}
                                  </div>
                                </ScrollArea>
                            </DroppableSlot>
                        </div>
                    )}
                </div>

                {/* --- Área del Árbol de Playoffs --- */}
                <div className="flex-grow p-1 sm:p-6 rounded-lg bg-primary/20 overflow-auto">
                    {playoffMode === 'automatic' && autoRounds.length > 0 && (
                        <div className="flex items-stretch">
                            {autoRounds.map((round, index) => (
                                <div key={round.title} className="flex items-center">
                                    <RoundColumn round={round} roundIndex={index} />
                                    {index < autoRounds.length - 1 && <div className="w-4 sm:w-12 h-full" />}
                                </div>
                            ))}
                        </div>
                    )}
                     {playoffMode === 'custom' && customRounds.length > 0 && (
                        <div className="flex items-stretch">
                            {customRounds.map((round, index) => (
                                <div key={round.title} className="flex items-center">
                                    <RoundColumn round={round} roundIndex={index} />
                                    {index < customRounds.length - 1 && <div className="w-4 sm:w-12 h-full" />}
                                </div>
                            ))}
                        </div>
                    )}

                    {(playoffMode === 'automatic' && autoRounds.length === 0) && <div className="flex justify-center items-center h-full"><p>Selecciona un formato para ver el árbol.</p></div>}
                    {(playoffMode === 'custom' && customRounds.length === 0) && <div className="flex justify-center items-center h-full"><p>Selecciona una fase para comenzar a armar el árbol.</p></div>}
                    
                </div>
            </div>
            
             <DragOverlay modifiers={[snapCenterToCursor]}>
                {activeTeam ? (
                    <div className="w-48 sm:w-56">
                        <TeamDisplay team={activeTeam} isPlaceholder={activeTeam.id.startsWith('winner-')} />
                    </div>
                ) : null}
            </DragOverlay>

        </DndContext>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancelar</Button>
          <Button onClick={handleCreatePlayoffs} disabled={isCreating}>
            {isCreating ? 'Generando...' : 'Generar Partidos de Playoffs'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
