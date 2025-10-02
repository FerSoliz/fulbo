'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { findUserByDni } from '@/lib/firebase/db';

// --- Interfaces (Tipos de datos) ---
export interface FoundPlayer {
  id: string;
  name: string;
  dni: string;
  username: string;
  avatar?: string;
  isGuest?: boolean;
  team?: {
    id: string;
    name: string;
    crestUrl?: string | null;
  } | null;
}

interface PlayerSearchProps {
  onPlayerFound: (player: FoundPlayer) => void;
  onPlayerNotFound: (dni: string) => void;
  disabled?: boolean; 
}

export function PlayerSearch({ onPlayerFound, onPlayerNotFound, disabled = false }: PlayerSearchProps) {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ANÁLISIS DE MENTORÍA: VALIDACIÓN EXPLÍCITA ---
  // Creamos una constante que determina si el DNI es válido.
  // La regla es estricta: debe tener exactamente 8 caracteres.
  const isDniValid = dni.length === 8;

  const handleSearch = async () => {
    // Doble chequeo de seguridad. No debería ejecutarse si el botón está deshabilitado.
    if (!isDniValid) return;
    
    setLoading(true);

    const player = await findUserByDni(dni);

    if (player) {
      onPlayerFound(player);
    } else {
      onPlayerNotFound(dni);
    }
    
    setLoading(false);
    setDni(''); // Limpiamos el input después de la búsqueda
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limpiamos cualquier caracter que no sea un dígito.
    const value = e.target.value.replace(/\D/g, '');
    // Actualizamos el estado. El componente se re-renderizará y recalculará `isDniValid`.
    setDni(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="dni-search" className="text-sm font-medium">Buscar por DNI</label>
        <div className="flex items-center gap-2">
          <Input
            id="dni-search"
            type="text" // Usamos text para controlar el `inputMode` y la validación nosotros mismos
            inputMode="numeric" // Esto muestra el teclado numérico en móviles
            placeholder="Ingresa 8 dígitos..."
            value={dni}
            onChange={handleInputChange}
            maxLength={8} // El input no permitirá más de 8 caracteres
            disabled={loading || disabled}
          />
          {/* El botón se deshabilita si está cargando, si el componente padre lo indica, o si el DNI no es válido */}
          <Button onClick={handleSearch} disabled={loading || disabled || !isDniValid}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="sr-only">Buscar</span>
          </Button>
        </div>
        {/* ANÁLISIS DE MENTORÍA: FEEDBACK PARA EL USUARIO */}
        {/* Damos una pista visual si el DNI está parcialmente ingresado pero aún no es válido */}
        {dni.length > 0 && !isDniValid && (
            <p className="text-xs text-muted-foreground">El DNI debe tener 8 dígitos.</p>
        )}
      </div>
    </div>
  );
}
