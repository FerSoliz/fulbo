'use client';

import { useState, useEffect, useMemo } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { getAllTeams } from '@/lib/firebase/db';
import type { TeamSummary } from '@/lib/firebase/db';
import { Loader2 } from 'lucide-react';

interface TeamSearchProps {
  onTeamSelected: (team: TeamSummary) => void;
  // Array de IDs de equipos ya en el torneo para excluirlos de los resultados.
  excludedTeamIds: string[];
  disabled?: boolean;
}

export function TeamSearch({ onTeamSelected, excludedTeamIds, disabled }: TeamSearchProps) {
  const [allTeams, setAllTeams] = useState<TeamSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      try {
        const teams = await getAllTeams();
        setAllTeams(teams);
      } catch (error) {
        console.error("Error al cargar la lista de equipos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    // Filtra los equipos para no mostrar los que ya están en el torneo.
    const availableTeams = allTeams.filter(team => !excludedTeamIds.includes(team.id));
    
    if (!searchQuery) {
      // Si no hay búsqueda, muestra los equipos disponibles.
      return availableTeams;
    }
    
    // Si hay búsqueda, filtra por nombre.
    return availableTeams.filter(team =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTeams, searchQuery, excludedTeamIds]);

  const handleSelect = (teamId: string) => {
    const team = allTeams.find(t => t.id === teamId);
    if (team) {
      onTeamSelected(team); // Llama a la función del padre con el equipo seleccionado.
      setSearchQuery(''); // Limpia la búsqueda.
    }
  };

  return (
    // Usamos el componente Command de shadcn/ui para crear un buscador potente.
    <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        placeholder="Buscar equipo por nombre..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        disabled={disabled || loading}
        aria-label="Buscar equipo existente para añadir al torneo"
      />
      <CommandList>
        {loading && (
          <div className="p-4 text-sm flex items-center justify-center" aria-live="polite">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando equipos...
          </div>
        )}
        {!loading && <CommandEmpty>No se encontraron equipos con ese nombre.</CommandEmpty>}
        <CommandGroup>
          {/* Mostramos solo los primeros 5 resultados para no saturar la UI */}
          {filteredTeams.slice(0, 5).map((team) => (
            <CommandItem
              key={team.id}
              onSelect={() => handleSelect(team.id)}
              value={team.name}
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
