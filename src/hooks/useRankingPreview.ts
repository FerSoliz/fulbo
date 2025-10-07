'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';

// --- TIPOS DE DATOS ---
export type RankingPlayer = { 
  id: string; 
  rank: number; 
  name: string; 
  sudpoints: number 
};

interface UseRankingPreviewReturn {
  rankingData: RankingPlayer[];
  loading: boolean;
}

/**
 * Hook experto para obtener y procesar los datos del ranking de jugadores.
 * Su lógica de negocio incluye:
 * 1. Obtener el Top 25 de jugadores por `sudpoints`.
 * 2. Asegurarse de que el usuario del perfil actual (`profileUserId`) esté en la lista, buscándolo por separado si es necesario.
 * 3. Combinar, ordenar y asignar el rango final a cada jugador.
 * @param profileUserId El ID del usuario que se está viendo, para asegurar que aparezca en el ranking.
 * @returns Un objeto con `rankingData` (la lista procesada) y `loading` (el estado de carga).
 */
export function useRankingPreview(profileUserId: string | undefined | null): UseRankingPreviewReturn {
  const [rankingData, setRankingData] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Si no hay ID de perfil, no podemos hacer la lógica de asegurar su inclusión.
    if (!profileUserId) {
        setLoading(false);
        return;
    }

    const fetchRanking = async () => {
      setLoading(true);
      try {
        // 1. OBTENER EL TOP 25
        const usersRef = ref(db, 'users');
        const rankingQuery = query(usersRef, orderByChild('sudpoints'), limitToLast(25));
        const snapshot = await get(rankingQuery);

        let usersList: (UserProfile & { id: string })[] = [];
        let profileUserInTop25 = false;

        if (snapshot.exists()) {
          const usersData = snapshot.val();
          usersList = Object.entries(usersData).map(([id, data]) => ({ id, ...(data as Omit<UserProfile, 'id'>) }));
          profileUserInTop25 = usersList.some(user => user.id === profileUserId);
        }

        // 2. BUSCAR AL USUARIO DEL PERFIL SI NO ESTÁ EN EL TOP
        if (!profileUserInTop25) {
          const profileUserRef = ref(db, `users/${profileUserId}`);
          const profileUserSnapshot = await get(profileUserRef);
          if (profileUserSnapshot.exists()) {
            usersList.push({ id: profileUserSnapshot.key, ...profileUserSnapshot.val() });
          }
        }
        
        // 3. COMBINAR, ORDENAR Y ASIGNAR RANGO
        // Nos aseguramos de que no haya duplicados usando un Map
        const uniqueUsersMap = new Map<string, (UserProfile & { id: string })>();
        usersList.forEach(user => uniqueUsersMap.set(user.id, user));
        
        const finalUsers = Array.from(uniqueUsersMap.values());

        const sortedUsers = finalUsers
          .sort((a, b) => (b.sudpoints || 0) - (a.sudpoints || 0))
          .map((user, index) => ({
            id: user.id,
            rank: index + 1, // El rango se basa en el orden final
            name: user.name,
            sudpoints: user.sudpoints || 0,
          }));

        setRankingData(sortedUsers);

      } catch (error) {
        console.error("Error al obtener el ranking:", error);
        toast({ title: "Error al cargar el ranking", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [toast, profileUserId]); // Dependencias del efecto

  return { rankingData, loading };
}
