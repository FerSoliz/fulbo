
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Card } from '@/lib/types';

// Define la estructura para los datos de cromos de un usuario en Realtime Database
export interface UserCollectiblesData {
  cardIds: number[];
  team: {
    name: string;
    formation: {
      starters: (Card | null)[];
      subs: (Card | null)[];
    };
    showcasedCard: Card | null;
  };
}

const initialTeamData = {
  name: 'Mi Equipo',
  formation: {
    starters: Array(5).fill(null),
    subs: Array(3).fill(null),
  },
  showcasedCard: null,
};

/**
 * Obtiene todos los datos de cromos (colección y equipo) de un usuario.
 * Esta función garantiza que siempre se devuelva una estructura de datos completa,
 * fusionando los datos del usuario con una estructura inicial por defecto.
 * @param userId - El ID del usuario.
 * @returns Los datos de cromos del usuario, con una estructura siempre completa.
 */
export const getUserCollectibles = async (userId: string): Promise<UserCollectiblesData> => {
  const collectiblesRef = ref(db, `users/${userId}/collectibles`);
  const snapshot = await get(collectiblesRef);

  if (snapshot.exists()) {
    const data = snapshot.val() || {};
    const teamData = data.team || {};

    // Fusiona los datos existentes con la estructura inicial para evitar errores
    const mergedTeam = {
      ...initialTeamData,
      ...teamData,
      formation: {
        ...initialTeamData.formation,
        ...(teamData.formation || {}),
      },
    };

    return {
      cardIds: data.cardIds || [],
      team: mergedTeam,
    };
  }

  // Si no existen datos de coleccionables para el usuario, devuelve la estructura inicial completa
  return {
    cardIds: [],
    team: initialTeamData,
  };
};

/**
 * Guarda la colección completa de IDs de cartas de un usuario.
 * Esta función sobreescribe la colección existente.
 * @param userId - El ID del usuario.
 * @param cardIds - Un array con los IDs de las cartas a guardar.
 */
export const saveUserCardCollection = async (userId: string, cardIds: number[]): Promise<void> => {
  const collectionRef = ref(db, `users/${userId}/collectibles/cardIds`);
  await set(collectionRef, cardIds);
};

/**
 * Guarda la formación del equipo de un usuario.
 * Esta función sobreescribe la formación del equipo existente.
 * @param userId - El ID del usuario.
 * @param team - El objeto del equipo a guardar.
 */
export const saveUserTeamFormation = async (userId: string, team: UserCollectiblesData['team']): Promise<void> => {
  const teamRef = ref(db, `users/${userId}/collectibles/team`);
  await set(teamRef, team);
};
