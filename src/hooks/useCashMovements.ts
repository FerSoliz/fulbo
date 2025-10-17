import { useState, useEffect } from 'react';
import { Unsubscribe } from 'firebase/database';
import { db } from '@/lib/firebase';
import { CashMovement, ManualCashEntry } from '@/lib/types';
import { getFinishedMatches, listenToManualCashEntries } from '@/lib/firebase/db';

export function useCashMovements() {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const fetchAndCombineData = async () => {
      try {
        setLoading(true);
        const finishedMatches = await getFinishedMatches();
        const matchMovements: CashMovement[] = finishedMatches.map(match => ({
          id: match.id,
          type: 'match',
          date: match.details?.date || match.date,
          data: match,
        }));

        unsubscribe = listenToManualCashEntries(
          (manualEntries) => {
            const manualMovements: CashMovement[] = manualEntries.map(entry => ({
              id: entry.id,
              type: 'manual',
              date: entry.date,
              data: entry,
            }));

            const allMovements = [...matchMovements, ...manualMovements];
            allMovements.sort((a, b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return (dateB || 0) - (dateA || 0);
            });
            
            setMovements(allMovements);
            setLoading(false);
          }
        );

      } catch (err) {
        console.error("[useCashMovements] Error crítico al obtener datos:", err);
        setError('Error crítico al cargar los movimientos.');
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
