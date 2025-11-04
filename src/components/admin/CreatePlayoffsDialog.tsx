
'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Team } from '@/lib/types';

interface PositionEntry {
  teamId: string;
  teamName: string;
  points: number;
}

interface CreatePlayoffsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  teams: Team[];
  positions: PositionEntry[];
}

const getStageName = (numTeams: number) => {
  switch (numTeams) {
    case 2: return 'Final';
    case 4: return 'Semifinales';
    case 8: return 'Cuartos de Final';
    case 16: return 'Octavos de Final';
    default: return `Playoffs de ${numTeams}`;
  }
};

export function CreatePlayoffsDialog({ open, onOpenChange, tournamentId, teams, positions }: CreatePlayoffsDialogProps) {
  const [numTeams, setNumTeams] = useState<string>('4');

  const playoffOptions = useMemo(() => {
    const possibleSizes = [2, 4, 8, 16, 32];
    return possibleSizes
      .filter(size => size <= teams.length)
      .map(size => ({
        value: size.toString(),
        label: `${getStageName(size)} (${size} equipos)`,
      }));
  }, [teams.length]);

  const playoffPairs = useMemo(() => {
    const count = parseInt(numTeams, 10);
    if (isNaN(count) || !positions || positions.length < count) {
      return [];
    }

    const topTeams = positions.slice(0, count);
    const pairs: { home: PositionEntry; away: PositionEntry }[] = [];

    for (let i = 0; i < count / 2; i++) {
      pairs.push({
        home: topTeams[i],
        away: topTeams[count - 1 - i],
      });
    }
    return pairs;
  }, [numTeams, positions]);

  const getTeamLogo = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.logoUrl || '';
  };
  
  const handleCreatePlayoffs = () => {
    // Lógica para crear los partidos de playoffs (se implementará en el futuro)
    console.log(`Creando playoffs para ${numTeams} equipos en el torneo ${tournamentId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Playoffs</DialogTitle>
          <DialogDescription>
            Selecciona el formato de los playoffs. Los equipos se tomarán de los primeros puestos de la tabla de posiciones.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Select value={numTeams} onValueChange={setNumTeams}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar formato..." />
            </SelectTrigger>
            <SelectContent>
              {playoffOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {playoffPairs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Vista Previa de Enfrentamientos</h4>
              <div className="space-y-2 rounded-lg border p-3">
                {playoffPairs.map((pair, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={getTeamLogo(pair.home.teamId)} alt={pair.home.teamName} />
                        <AvatarFallback>{pair.home.teamName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{pair.home.teamName}</span>
                    </div>
                    <span className="text-muted-foreground">vs</span>
                    <div className="flex items-center gap-2">
                      <span>{pair.away.teamName}</span>
                       <Avatar className="h-5 w-5">
                        <AvatarImage src={getTeamLogo(pair.away.teamId)} alt={pair.away.teamName} />
                        <AvatarFallback>{pair.away.teamName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreatePlayoffs}>Crear Playoffs</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

