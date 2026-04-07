'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile, GuestPlayer } from '@/lib/types';
import { useToast } from './use-toast';

interface UseUserProfileReturn {
  profileUser: UserProfile | null;
  loading: boolean;
}

// --- Funciones de Adaptación ---

/**
 * Adapta un objeto de usuario registrado al formato UserProfile unificado.
 */
const adaptUserToProfile = (userData: any, id: string): UserProfile => ({
  ...userData,
  id,
  isGuest: false,
});

/**
 * Adapta un objeto de jugador invitado al formato UserProfile unificado.
 */
const adaptGuestToProfile = (guestData: GuestPlayer, dni: string): UserProfile => ({
  ...guestData,
  id: dni,
  isGuest: true,
  // Proporcionamos valores por defecto para campos de usuario que no existen en invitados
  username: guestData.name.replace(/\s+/g, '.').toLowerCase(), // generamos un username temporal
  role: 'player',
  avatar: '/assets/images/default-avatar.png', // avatar por defecto
  profileBackground: '/assets/images/default-background.jpg', // fondo por defecto
  isVerified: false,
  transferStatus: undefined
});

/**
 * Hook para obtener los datos de un perfil (registrado o invitado) en tiempo real.
 * Este hook busca primero en /users y si no encuentra, busca en /guestPlayers.
 * Enriquece el perfil con datos actualizados del equipo.
 * 
 * @param entityId El ID del usuario (UID) o del invitado (DNI).
 * @returns Un objeto con `profileUser` unificado y el estado `loading`.
 */
export function useUserProfile(entityId: string): UseUserProfileReturn {
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!entityId) {
      setLoading(false);
      setProfileUser(null);
      return;
    }

    setLoading(true);

    const userRef = ref(db, `users/${entityId}`);
    const guestRef = ref(db, `guestPlayers/${entityId}`);

    // Función de enriquecimiento del equipo reutilizable
    const enrichTeamData = async (userData: UserProfile) => {
      if (userData.team && userData.team.id) {
        try {
          const teamRef = ref(db, `teams/${userData.team.id}`);
          const teamSnapshot = await get(teamRef);

          if (teamSnapshot.exists()) {
            const fullTeamData = teamSnapshot.val();
            userData.team = {
              id: userData.team.id,
              name: fullTeamData.name || userData.team.name,
              crestUrl: fullTeamData.logoUrl || userData.team.crestUrl,
            };
          }
        } catch (error) {
          console.error(`Error al enriquecer datos del equipo ${userData.team.id}:`, error);
        }
      }
      return userData;
    };


    const handleUserSnapshot = (snapshot: any) => {
      if (snapshot.exists()) {
        const rawUser = snapshot.val();
        const adaptedUser = adaptUserToProfile(rawUser, snapshot.key);
        enrichTeamData(adaptedUser).then(enrichedUser => {
          setProfileUser(enrichedUser);
          setLoading(false);
        });
      } else {
        // Si no se encontró en /users, buscar en /guestPlayers
        onValue(guestRef, handleGuestSnapshot, handleError);
      }
    };

    const handleGuestSnapshot = (snapshot: any) => {
      if (snapshot.exists()) {
        const rawGuest = snapshot.val();
        const adaptedGuest = adaptGuestToProfile(rawGuest, snapshot.key);
        enrichTeamData(adaptedGuest).then(enrichedGuest => {
          setProfileUser(enrichedGuest);
          setLoading(false);
        });
      } else {
        // No se encontró en ninguna de las dos colecciones
        setProfileUser(null);
        toast({ title: "Error", description: "Jugador no encontrado.", variant: "destructive" });
        setLoading(false);
      }
    };

    const handleError = (error: any) => {
      console.error("Error al obtener perfil:", error);
      toast({ title: "Error de Red", description: "No se pudieron cargar los datos del perfil.", variant: "destructive" });
      setLoading(false);
    };

    // Iniciar la cadena de búsqueda
    onValue(userRef, handleUserSnapshot, handleError);

    // Limpieza de listeners
    return () => {
      off(userRef, 'value', handleUserSnapshot);
      off(guestRef, 'value', handleGuestSnapshot);
    };
  }, [entityId, toast]);

  return { profileUser, loading };
}
