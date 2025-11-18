
'use client';

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getStageName } from "@/lib/playoffs-utils";
import { useMemo } from "react";

interface PlayoffControlsProps {
  playoffMode: 'automatic' | 'custom';
  setPlayoffMode: (mode: 'automatic' | 'custom') => void;
  isCreating: boolean;
  numTeams: string;
  setNumTeams: (value: string) => void;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  autoPlayoffOptions: { value: string; label: string }[];
  customStartPhase: string;
  setCustomStartPhase: (value: string) => void;
  customPlayoffOptions: { value: string; label: string }[];
}

export const PlayoffControls = ({
  playoffMode,
  setPlayoffMode,
  isCreating,
  numTeams,
  setNumTeams,
  isEditMode,
  setIsEditMode,
  autoPlayoffOptions,
  customStartPhase,
  setCustomStartPhase,
  customPlayoffOptions
}: PlayoffControlsProps) => {

  return (
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
    </div>
  );
};
