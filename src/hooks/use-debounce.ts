'use client';

import { useState, useEffect } from 'react';

/**
 * Un custom hook que retrasa la actualización de un valor (debounce).
 * Es útil para evitar ejecuciones excesivas de efectos o llamadas a API
 * mientras el usuario está escribiendo.
 * 
 * @param value El valor que se quiere "retrasar".
 * @param delay El tiempo en milisegundos que se debe esperar sin cambios.
 * @returns El valor "retrasado".
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para guardar el valor retrasado.
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Se activa un temporizador para actualizar el valor 
    // solo después de que haya pasado el tiempo de 'delay'.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Función de limpieza: si el valor cambia antes de que se cumpla el delay,
    // el temporizador anterior se cancela y se inicia uno nuevo.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se vuelve a ejecutar si el valor o el delay cambian.

  return debouncedValue;
}
