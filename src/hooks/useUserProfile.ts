'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { useToast } from './use-toast';

interface UseUserProfileReturn {
  profileUser: UserProfile | null;
  loading: boolean;
}

/**
 * Hook para obtener los datos de un perfil de usuario en tiempo real.
 * Este hook enriquece el perfil del usuario con los datos completos y actualizados
 * de su equipo, asegurando que la información del equipo sea consistente y completa
 * para todos los componentes consumidores.
 * 
 * @param userId El ID del usuario a obtener.
 * @returns Un objeto con `profileUser` enriquecido y el estado `loading`.
 */
export function useUserProfile(userId: string): UseUserProfileReturn {
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setProfileUser(null);
      return;
    }

    setLoading(true);
    const userRef = ref(db, `users/${userId}`);

    const handleData = async (snapshot: any) => {
      if (snapshot.exists()) {
        const userData = { id: snapshot.key, ...snapshot.val() };

        // Lógica de enriquecimiento de equipo (Versión Definitiva con Mapeo)
        if (userData.team && userData.team.id) {
          try {
            const teamRef = ref(db, `teams/${userData.team.id}`);
            const teamSnapshot = await get(teamRef);

            if (teamSnapshot.exists()) {
              const fullTeamData = teamSnapshot.val();

              // Creamos un objeto `team` consistente y completo
              const consistentTeamObject = {
                id: userData.team.id, // Mantenemos el ID original
                name: fullTeamData.name, // Usamos el nombre del equipo completo
                crestUrl: fullTeamData.logoUrl, // Mapeamos `logoUrl` a `crestUrl`
                tournaments: fullTeamData.tournaments || null // Adjuntamos los torneos
              };

              // Reemplazamos el atajo con nuestro objeto consistente
              userData.team = consistentTeamObject;
            }
          } catch (error) {
            console.error(`Error al enriquecer los datos del equipo ${userData.team.id}:`, error);
          }
        }

        setProfileUser(userData);

      } else {
        setProfileUser(null);
        toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
      }
      setLoading(false);
    };

    const handleError = (error: any) => {
      console.error("Error al obtener el perfil de usuario:", error);
      toast({ title: "Error de Red", description: "No se pudieron cargar los datos del perfil.", variant: "destructive" });
      setLoading(false);
    };

    onValue(userRef, handleData, handleError);

    return () => {
      off(userRef, 'value', handleData);
    };
  }, [userId, toast]);

  return { profileUser, loading };
}
