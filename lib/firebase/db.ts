'use client';
// Este archivo centraliza todas las interacciones con Firebase Realtime Database.

import { rtdb } from '@/lib/firebase/config';
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

import { FoundPlayer } from '@/components/search/PlayerSearch';
import { RosterPlayer } from '@/components/team/RosterManager';

// --- TIPOS GLOBALES ---

export interface TeamSummary {
    id: string;
    name: string;
    logoUrl?: string;
}

// ================================================
// ANÁLISIS DE MENTORÍA: BÚSQUEDA EFICIENTE DE USUARIOS
// ================================================
// Esta función busca un usuario por su DNI.
// Requiere que se configure un ÍNDICE en las Reglas de Seguridad de Firebase
// en la ruta /users en la propiedad 'dni'.
// "rules": { "users": { ".indexOn": ["dni"] } }
export async function findUserByDni(dni: string): Promise<FoundPlayer | null> {
  try {
    const usersRef = ref(rtdb, 'users');
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

// ================================================
// ANÁLISIS DE MENTORÍA: ARQUITECTURA DE DATOS PARA PLANTILLAS
// ================================================

// 1. AÑADIR JUGADOR REGISTRADO (FAN-OUT WRITE)
// ================================================
// Se realiza una escritura en dos lugares distintos de forma atómica (fan-out):
// - Se añade el ID del usuario a la plantilla del equipo.
// - Se añade el ID del equipo al perfil del usuario (para referencias inversas).
export async function addRegisteredPlayerToTeam(userId: string, teamId: string): Promise<boolean> {
  console.log(`Intentando añadir jugador registrado ${userId} al equipo ${teamId}`);
  const updates: { [key: string]: any } = {};
  updates[`/teams/${teamId}/roster/${userId}`] = { addedAt: new Date().toISOString() };
  updates[`/users/${userId}/teams/${teamId}`] = true;

  try {
    await update(ref(rtdb), updates);
    console.log("Jugador registrado añadido con éxito.");
    return true;
  } catch (error) {
    console.error("Error al añadir jugador registrado al equipo:", error);
    return false;
  }
}

// 2. AÑADIR JUGADOR INVITADO
// ================================================
// Se guarda un objeto completo del jugador invitado bajo el nodo de la plantilla.
// La clave se prefija con "guest_" para distinguirlos de los usuarios registrados.
export async function addGuestPlayerToTeam(name: string, dni: string, teamId: string): Promise<RosterPlayer | null> {
  console.log(`Intentando añadir jugador invitado ${name} (${dni}) al equipo ${teamId}`);
  const guestKey = `guest_${dni}`;
  const guestPlayerRef = ref(rtdb, `/teams/${teamId}/roster/${guestKey}`);
  const guestData = {
    id: guestKey,
    name,
    dni,
    isGuest: true,
  };

  try {
    await set(guestPlayerRef, guestData);
    console.log("Jugador invitado añadido con éxito.");
    return guestData;
  } catch (error) {
    console.error("Error al añadir jugador invitado al equipo:", error);
    return null;
  }
}

// 3. OBTENER LA PLANTILLA DEL EQUIPO (LECTURA COMPUESTA)
// ================================================
// Esta es la función más compleja. Debe:
// a. Leer el nodo `/teams/${teamId}/roster`.
// b. Para cada clave, determinar si es un invitado o un usuario registrado.
// c. Si es un usuario, hacer una segunda lectura a `/users/{userId}` para obtener sus datos.
export async function getTeamRoster(teamId: string): Promise<RosterPlayer[]> {
  console.log(`Obteniendo plantilla para el equipo ${teamId}`);
  const rosterRef = ref(rtdb, `/teams/${teamId}/roster`);
  const snapshot = await get(rosterRef);
  const finalRoster: RosterPlayer[] = [];

  if (!snapshot.exists()) {
    console.log("El equipo no tiene plantilla o no existe.");
    return [];
  }

  const rosterData = snapshot.val();
  const playerPromises: Promise<void>[] = [];

  for (const key in rosterData) {
    const data = rosterData[key];
    if (key.startsWith('guest_')) {
      // Si es un invitado, los datos ya están completos.
      finalRoster.push({
        id: key,
        name: data.name,
        dni: data.dni,
        isGuest: true,
      });
    } else {
      // Si es un usuario registrado, necesitamos buscar sus datos.
      const userPromise = get(ref(rtdb, `/users/${key}`)).then(userSnapshot => {
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

  // Esperamos a que todas las búsquedas de usuarios registrados terminen.
  await Promise.all(playerPromises);
  console.log("Plantilla obtenida:", finalRoster);
  return finalRoster;
}

// 4. ELIMINAR JUGADOR DE LA PLANTILLA (FAN-OUT DELETE)
// ================================================
export async function removePlayerFromTeam(playerId: string, teamId: string): Promise<boolean> {
  console.log(`Intentando eliminar jugador ${playerId} del equipo ${teamId}`);
  const updates: { [key: string]: any } = {};
  // Se elimina tanto de la plantilla del equipo como del perfil del usuario.
  updates[`/teams/${teamId}/roster/${playerId}`] = null;
  
  // Solo intentamos borrar la referencia inversa si no es un invitado
  if (!playerId.startsWith('guest_')) {
    updates[`/users/${playerId}/teams/${teamId}`] = null;
  }

  try {
    await update(ref(rtdb), updates);
    console.log("Jugador eliminado con éxito.");
    return true;
  } catch (error) {
    console.error("Error al eliminar jugador del equipo:", error);
    return false;
  }
}

// OBTENER TODOS LOS EQUIPOS (PARA LA PÁGINA DE LISTADO)
// ================================================
export async function getAllTeams(): Promise<TeamSummary[]> {
    const teamsRef = ref(rtdb, 'teams');
    const snapshot = await get(teamsRef);
    const teams: TeamSummary[] = [];
    if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
            teams.push({ 
                id: childSnapshot.key, 
                name: childSnapshot.val().name, 
                logoUrl: childSnapshot.val().logoUrl
            });
        });
    }
    return teams;
}
