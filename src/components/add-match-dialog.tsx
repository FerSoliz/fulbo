'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Team } from '@/lib/types';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AddMatchDialogProps {
  tournamentId: string;
  teams: Team[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMatchDialog({ tournamentId, teams, open, onOpenChange }: AddMatchDialogProps) {
  const [round, setRound] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const isFormValid = round && homeTeamId && awayTeamId && homeTeamId !== awayTeamId;

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsSaving(true);
    try {
      const matchId = `match_${tournamentId}_r${round}_${homeTeamId.substring(0, 4)}_${awayTeamId.substring(0, 4)}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newMatch = {
        id: matchId,
        tournamentId,
        round: parseInt(round, 10),
        homeTeamId,
        awayTeamId,
        status: 'pending',
        result: { home: null, away: null },
        details: { date: '', time: '', referee: '' }
      };

      const updates: { [key: string]: any } = {};
      updates[`/matches/${matchId}`] = newMatch;

      await update(ref(db), updates);

      toast({ title: '¡Partido añadido!', description: 'El nuevo partido ha sido agregado al fixture.' });
      handleClose();
    } catch (error) {
      console.error('Error adding match:', error);
      toast({ title: 'Error', description: 'No se pudo añadir el partido.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleClose = () => {
    setRound('');
    setHomeTeamId('');
    setAwayTeamId('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Partido Manualmente</DialogTitle>
          <DialogDescription>
            Configura un nuevo partido. Se añadirá a la fecha indicada o creará una nueva si no existe.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="round" className="text-right">
              Fecha
            </Label>
            <Input
              id="round"
              type="number"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="col-span-3"
              placeholder="Ej: 1, 2, 10..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="home-team" className="text-right">
              Equipo Local
            </Label>
            <Select onValueChange={setHomeTeamId} value={homeTeamId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="away-team" className="text-right">
              Equipo Visit.
            </Label>
             <Select onValueChange={setAwayTeamId} value={awayTeamId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {homeTeamId && awayTeamId && homeTeamId === awayTeamId && (
            <p className="text-center text-sm text-destructive col-span-4">
              Un equipo no puede jugar contra sí mismo.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Partido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}