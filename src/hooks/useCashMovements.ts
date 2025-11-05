import { useState, useEffect } from 'react';
import { Unsubscribe } from 'firebase/database';
import { CashMovement } from '@/lib/types';
import { listenToManualCashEntries } from '@/lib/firebase/db';

export function useCashMovements() {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const fetchAndCombineData = async () => {
      try {
        setLoading(true);
        
        // Cambio temporal: Ocultamos los partidos finalizados para simplificar la vista.
        // La llamada a `getFinishedMatches` se omite y se usa un array vacío.
        const matchMovements: CashMovement[] = [];

        unsubscribe = listenToManualCashEntries(
          (manualEntries) => {
            const manualMovements: CashMovement[] = manualEntries.map(entry => ({
              id: entry.id,
              type: 'manual',
              date: entry.date,
              data: entry,
            }));

            // La lista ahora solo contiene los asientos manuales.
            const allMovements = [...manualMovements];
            allMovements.sort((a, b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return (dateB || 0) - (dateA || 0);
            });
            
            setMovements(allMovements);
            setLoading(false);
          }
        );

      } catch (err: any) {
        console.error("[useCashMovements] Error crítico al obtener datos:", err);
        setError(`Error crítico al cargar los movimientos: ${err.message}`);
        setLoading(false);
      }
    };

    fetchAndCombineData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { movements, loading, error };
}
