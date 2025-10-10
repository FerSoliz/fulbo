'use client';

import { useState, useEffect } from 'react';

/**
 * Un hook personalizado para detectar si la pantalla coincide con una media query de CSS.
 * 
 * @param query - La media query de CSS a evaluar (e.j., '(max-width: 768px)').
 * @returns `true` si la media query coincide, `false` en caso contrario.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Es importante asegurarse de que window.matchMedia está disponible (no en SSR).
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Función para actualizar el estado cuando cambie la coincidencia.
      const listener = () => {
        setMatches(media.matches);
      };

      // Establece el estado inicial.
      listener();

      // Añade el listener para cambios futuros.
      media.addEventListener('change', listener);

      // Limpieza: elimina el listener cuando el componente se desmonta.
      return () => media.removeEventListener('change', listener);
    }
  }, [query]); // Vuelve a ejecutar el efecto si la query cambia.

  return matches;
}
