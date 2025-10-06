'use client';

import { useState, useEffect } from 'react';
import { searchTeams } from '@/lib/firebase/db';
import type { TeamSummary } from '@/lib/firebase/db';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Loader2 } from 'lucide-react';

interface TeamSearchProps {
  onTeamSelected: (team: TeamSummary) => void;
  excludedTeamIds: string[];
  disabled?: boolean;
}

export function TeamSearch({ onTeamSelected, excludedTeamIds, disabled }: TeamSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const teams = await searchTeams(searchQuery, excludedTeamIds);
        setSearchResults(teams);
      } catch (error) {
        console.error("Error al buscar equipos:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, excludedTeamIds]);

  // Esta función ahora se pasará directamente al `onSelect` del CommandItem.
  // El `value` que le pasemos al CommandItem será el que reciba esta función.
  const handleSelect = (teamId: string) => {
    const team = searchResults.find(t => t.id === teamId);
    if (team) {
      onTeamSelected(team);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        placeholder="Buscar equipo por nombre..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        disabled={disabled}
        aria-label="Buscar equipo existente para añadir al torneo"
      />
      <CommandList>
        {loading && (
          <div className="p-4 text-sm flex items-center justify-center" aria-live="polite">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Buscando...
          </div>
        )}
        {!loading && searchResults.length === 0 && searchQuery.length > 1 && (
            <CommandEmpty>No se encontraron equipos disponibles con ese nombre.</CommandEmpty>
        )}
        <CommandGroup>
          {searchResults.map((team) => (
            <CommandItem
              key={team.id}
              // ---- ¡LA CORRECCIÓN ESTÁ AQUÍ! ----
              // 1. Pasamos la referencia a la función `handleSelect`.
              onSelect={handleSelect}
              // 2. Le decimos al componente que el valor a pasar es el `team.id`.
              value={team.id}
              className="cursor-pointer"
            >
              {team.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
