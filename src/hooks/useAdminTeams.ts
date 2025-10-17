
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { listenToAllTeams } from '@/lib/firebase/db';
import type { Team } from '@/lib/types';
import type { Unsubscribe } from 'firebase/database';

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

    if (!user || user.role !== 'admin') {
      setPageState('ACCESS_DENIED');
      return;
    }

    let unsubscribe: Unsubscribe | null = null;

    try {
      unsubscribe = listenToAllTeams((teamsData) => {
        if (teamsData.length > 0) {
          setTeams(teamsData);
          setPageState('READY');
        } else {
          setTeams([]);
          setPageState('EMPTY');
        }
      });
    } catch (error) {
      console.error("Error al suscribirse a los equipos:", error);
      setPageState('ERROR');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, userLoading]);

  return { teams, pageState };
};
