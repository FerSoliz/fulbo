'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { useToast } from './use-toast';

interface UseUserProfileReturn {
  profileUser: UserProfile | null;
  loading: boolean;
}

/**
 * Un hook personalizado para obtener y escuchar los datos de un perfil de usuario en tiempo real.
 * Encapsula la lógica de fetching, el estado de carga y el manejo de errores.
 * 
 * @param userId - El ID del usuario a obtener.
 * @returns Un objeto con `profileUser` y el estado `loading`.
 */
export function useUserProfile(userId: string): UseUserProfileReturn {
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Si no hay userId, no hacemos nada y dejamos de cargar.
    if (!userId) {
      setLoading(false);
      setProfileUser(null);
      return;
    }

    setLoading(true);
    const userRef = ref(db, `users/${userId}`);

    // Función que se ejecuta cuando llegan los datos.
    const handleData = (snapshot: any) => {
      if (snapshot.exists()) {
        setProfileUser({ id: snapshot.key, ...snapshot.val() });
      } else {
        setProfileUser(null);
        toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
      }
      setLoading(false);
    };

    // Función para manejar errores de la base de datos.
    const handleError = (error: any) => {
      console.error("Error al obtener el perfil de usuario:", error);
      toast({ title: "Error de Red", description: "No se pudieron cargar los datos del perfil.", variant: "destructive" });
      setLoading(false);
    };

    // Suscribimos el listener de Firebase.
    onValue(userRef, handleData, handleError);

    // La función de limpieza que se ejecuta cuando el componente se desmonta.
    // Esto es CRUCIAL para evitar fugas de memoria.
    return () => {
      off(userRef, 'value', handleData);
    };
  }, [userId, toast]); // El efecto se re-ejecuta si el userId cambia.

  return { profileUser, loading };
}
