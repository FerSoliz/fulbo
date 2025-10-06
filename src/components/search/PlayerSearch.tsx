'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { findUserByDni } from '@/lib/firebase/db';
import { FoundPlayer } from '@/lib/types'; // <-- IMPORTADO DESDE TYPES

// La interfaz local ha sido eliminada.

interface PlayerSearchProps {
  onPlayerFound: (player: FoundPlayer) => void;
  onPlayerNotFound: (dni: string) => void;
  disabled?: boolean; 
}

export function PlayerSearch({ onPlayerFound, onPlayerNotFound, disabled = false }: PlayerSearchProps) {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);

  const isDniValid = dni.length === 8;

  const handleSearch = async () => {
    if (!isDniValid) return;
    
    setLoading(true);

    // La lógica de búsqueda no cambia, pero ahora devuelve el tipo correcto.
    const player = await findUserByDni(dni);

    if (player) {
      onPlayerFound(player);
    } else {
      onPlayerNotFound(dni);
    }
    
    setLoading(false);
    setDni('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setDni(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="dni-search" className="text-sm font-medium">Buscar por DNI</label>
        <div className="flex items-center gap-2">
          <Input
            id="dni-search"
            type="text"
            inputMode="numeric"
            placeholder="Ingresa 8 dígitos..."
            value={dni}
            onChange={handleInputChange}
            maxLength={8}
            disabled={loading || disabled}
          />
          <Button onClick={handleSearch} disabled={loading || disabled || !isDniValid}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="sr-only">Buscar</span>
          </Button>
        </div>
        {dni.length > 0 && !isDniValid && (
            <p className="text-xs text-muted-foreground">El DNI debe tener 8 dígitos.</p>
        )}
      </div>
    </div>
  );
}
