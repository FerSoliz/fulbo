'use client';
// Este archivo centraliza todas las interacciones con Firebase Realtime Database.

// ================================================
// CORRECCIÓN DE ARQUITECTURA: Unificamos la importación de la DB
// ================================================
import { db, storage } from '@/lib/firebase'; // USAMOS LA INSTANCIA CORRECTA
import {
  ref,
  get,
  set,
  push,
  remove,
  query,
  orderByChild,
  equalTo,
  update
} from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';

import { FoundPlayer } from '@/components/search/PlayerSearch';
import { RosterPlayer } from '@/components/team/RosterManager';
import type { Team } from '@/lib/types';

// --- TIPOS GLOBALES ---

export interface TeamSummary {
    id: string;
    name: string;
    logoUrl?: string;
}

// ================================================
// OPERACIONES CRUD PARA EQUIPOS (AHORA SÍ, CORRECTO)
// ================================================

/**
 * Elimina un equipo de la base de datos y su logo de Storage.
 * @param team - El objeto del equipo a eliminar.
 */
export async function deleteTeam(team: Team): Promise<void> {
  if (!team || !team.id) {
    throw new Error("Datos del equipo inválidos para la eliminación.");
  }

  const teamDbRef = ref(db, `teams/${team.id}`); // Usamos la instancia 'db' unificada

  if (team.logoUrl) {
    const logoStorage = storageRef(storage, `team-logos/${team.id}`);
    try {
      await deleteObject(logoStorage);
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.warn(`El logo para el equipo ${team.name} no se encontró en Storage.`);
      } else {
        throw error;
      }
    }
  }

  await remove(teamDbRef);
}

// ================================================
// FUNCIONES ORIGINALES (PRESERVADAS)
// ================================================

export async function findUserByDni(dni: string): Promise<FoundPlayer | null> {
  try {
    const usersRef = ref(db, 'users'); // Usamos la instancia 'db' unificada
    const userQuery = query(usersRef, orderByChild('dni'), equalTo(dni));
    const snapshot = await get(userQuery);

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const userId = Object.keys(usersData)[0];
      const userData = usersData[userId];

      return {
        id: userId,
        name: userData.name || 'Nombre no disponible',
        dni: userData.dni,
        username: userData.username || 'username_no_disponible',
        profilePicture: userData.profilePicture || undefined,
      };
    } else {
      console.log(`No se encontró ningún usuario con el DNI: ${dni}`);
      return null;
    }
  } catch (error) {
    console.error("Error al buscar usuario por DNI:", error);
    return null;
  }
}

export async function addRegisteredPlayerToTeam(userId: string, teamId: string): Promise<boolean> {
  const updates: { [key: string]: any } = {};
  updates[`/teams/${teamId}/roster/${userId}`] = { addedAt: new Date().toISOString() };
  updates[`/users/${userId}/teams/${teamId}`] = true;

  try {
    await update(ref(db), updates); // Usamos la instancia 'db' unificada
    return true;
  } catch (error) {
    console.error("Error al añadir jugador registrado al equipo:", error);
    return false;
  }
}

export async function addGuestPlayerToTeam(name: string, dni: string, teamId: string): Promise<RosterPlayer | null> {
  const guestKey = `guest_${dni}`;
  const guestPlayerRef = ref(db, `/teams/${teamId}/roster/${guestKey}`); // Usamos 'db'
  const guestData = {
    id: guestKey,
    name,
    dni,
    isGuest: true,
  };

  try {
    await set(guestPlayerRef, guestData);
    return guestData;
  } catch (error) {
    console.error("Error al añadir jugador invitado al equipo:", error);
    return null;
  }
}

export async function getTeamRoster(teamId: string): Promise<RosterPlayer[]> {
  const rosterRef = ref(db, `/teams/${teamId}/roster`); // Usamos 'db'
  const snapshot = await get(rosterRef);
  const finalRoster: RosterPlayer[] = [];

  if (!snapshot.exists()) {
    return [];
  }

  const rosterData = snapshot.val();
  const playerPromises: Promise<void>[] = [];

  for (const key in rosterData) {
    if (key.startsWith('guest_')) {
      finalRoster.push(rosterData[key]);
    } else {
      const userPromise = get(ref(db, `/users/${key}`)).then(userSnapshot => { // Usamos 'db'
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          finalRoster.push({
            id: key,
            name: userData.name || 'Nombre no disponible',
            dni: userData.dni || 'DNI no disponible',
            isGuest: false,
          });
        }
      });
      playerPromises.push(userPromise);
    }
  }

  await Promise.all(playerPromises);
  return finalRoster;
}

export async function removePlayerFromTeam(playerId: string, teamId: string): Promise<boolean> {
  const updates: { [key: string]: any } = {};
  updates[`/teams/${teamId}/roster/${playerId}`] = null;
  
  if (!playerId.startsWith('guest_')) {
    updates[`/users/${playerId}/teams/${teamId}`] = null;
  }

  try {
    await update(ref(db), updates); // Usamos 'db'
    return true;
  } catch (error) {
    console.error("Error al eliminar jugador del equipo:", error);
    return false;
  }
}

export async function getAllTeams(): Promise<TeamSummary[]> {
    const teamsRef = ref(db, 'teams'); // Usamos 'db'
    const snapshot = await get(teamsRef);
    const teams: TeamSummary[] = [];
    if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
            teams.push({ 
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
    }
    return teams;
}
