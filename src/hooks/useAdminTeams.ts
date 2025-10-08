
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { Team } from '@/lib/types';

export type PageState = 'LOADING' | 'ACCESS_DENIED' | 'EMPTY' | 'READY' | 'ERROR';

export const useAdminTeams = () => {
  const { user, loading: userLoading } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [pageState, setPageState] = useState<PageState>('LOADING');

  useEffect(() => {
    if (userLoading) {
      setPageState('LOADING');
      return;
    }

    // Solo los admins pueden ver esta información.
    // Podríamos agregar más roles en el futuro, como 'editor'.
    if (!user || user.role !== 'admin') {
      setPageState('ACCESS_DENIED');
      return;
    }

    const teamsRef = ref(db, 'teams');
    const unsubscribe = onValue(
      teamsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const teamsData = snapshot.val();
          // Convertimos el objeto de Firebase a un array para poder mapearlo.
          const teamsList: Team[] = Object.keys(teamsData).map((key) => ({
            id: key,
            ...teamsData[key],
          }));
          setTeams(teamsList);
          setPageState('READY');
        } else {
          // Si no hay datos, la colección está vacía.
          setTeams([]);
          setPageState('EMPTY');
        }
      },
      (error) => {
        console.error("Firebase read failed: ", error);
        setPageState('ERROR');
      }
    );

    // La función de limpieza de useEffect se ejecuta cuando el componente se desmonta.
    // Esto es crucial para evitar fugas de memoria y suscripciones fantasma.
    return () => unsubscribe();
  }, [user, userLoading]); // El efecto se re-ejecutará si el usuario o su estado de carga cambian.

  return { teams, pageState };
};
