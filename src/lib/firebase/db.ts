// src/lib/firebase/db.ts
import { get, ref, query, orderByChild, equalTo, push, update, remove, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { FoundPlayer } from '@/components/search/PlayerSearch';
import type { RosterPlayer } from '@/components/team/RosterManager';

// --- Interfaces para el perfil de usuario (UserProfile) ---
// Esta interfaz refleja la estructura que esperamos para los usuarios en Realtime Database
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  role?: 'player' | 'captain' | 'admin';
  dni?: string;
  profileBackground?: string;
  isVerified?: boolean;
  sudpoints?: number;
  league?: string;
  division?: string;
  sudonepassLevel?: number;
  sudonepassExp?: number;
  transferStatus?: 'libre' | 'traspaso' | 'blindado';
  team?: {
    id: string;
    name: string;
    crestUrl?: string;
  };
  stats?: {
    partidosJugados: number;
    victorias: number;
    empates: number;
    derrotas: number;
    goles: number;
    asistencias: number;
    amarillas: number;
    rojas: number;
    mvps: number;
  };
  // Añade otros campos si son necesarios y están en tu DB
}

export interface TeamSummary {
    id: string;
    name: string;
    logoUrl?: string;
}

export interface TeamDetails {
  id: string;
  name: string;
  logoUrl?: string;
}

// --- Funciones para UserProfile --- //

/**
 * Obtiene el perfil completo de un usuario por su ID desde Realtime Database.
 * @param userId El ID del usuario.
 * @returns Una promesa que resuelve con el perfil del usuario o null si no se encuentra.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return { id: userId, ...snapshot.val() } as UserProfile;
    } else {
      console.warn(`[getUserProfile] No se encontró el usuario con ID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`[getUserProfile] Error obteniendo perfil del usuario ${userId}:`, error);
    return null;
  }
}

/**
 * Actualiza campos específicos de un perfil de usuario en Realtime Database.
 * @param userId El ID del usuario a actualizar.
 * @param updates Un objeto con los campos a actualizar (Partial<UserProfile>).
 * @returns Una promesa que resuelve a true si la actualización fue exitosa, false en caso contrario.
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, updates);
    return true;
  } catch (error) {
    console.error(`[updateUserProfile] Error actualizando perfil del usuario ${userId}:`, error);
    return false;
  }
}

// --- Funciones existentes (sin cambios) ---

export async function findUserByDni(dni: string): Promise<FoundPlayer | null> {
  try {
    const usersRef = ref(db, 'users');
    const userQuery = query(usersRef, orderByChild('dni'), equalTo(dni));
    const snapshot = await get(userQuery);

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const userId = Object.keys(usersData)[0];
      const userData = usersData[userId];
      return {
        id: userId,
        name: userData.name,
        dni: userData.dni,
        username: userData.username,
        avatar: userData.avatar || `https://avatar.vercel.sh/${userData.username}.png`,
        isGuest: false,
        team: userData.team || null,
      };
    }
    
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);

    if (guestSnapshot.exists()) {
        const guestData = guestSnapshot.val();
        return {
            id: dni, 
            name: guestData.name,
            dni: guestData.dni,
            username: 'invitado', 
            avatar: `https://avatar.vercel.sh/${guestData.dni}.png`, 
            isGuest: true,
            team: guestData.team || null,
        };
    }

    return null;
  } catch (error) {
    console.error('Error buscando usuario por DNI:', error);
    return null;
  }
}

export async function addGuestPlayerToTeam(name: string, dni: string, teamId: string): Promise<RosterPlayer | null> {
    try {
        const guestId = dni;

        // Primero, obtenemos los detalles del equipo para tener su nombre y logo.
        const teamDetails = await getTeamDetails(teamId);
        if (!teamDetails) {
            throw new Error(`No se pudieron obtener los detalles del equipo ${teamId}.`);
        }

        // Creamos un objeto resumido del equipo para guardarlo en el perfil del invitado.
        const teamSummaryForProfile = {
            id: teamId,
            name: teamDetails.name,
            crestUrl: teamDetails.logoUrl || null,
        };

        // El objeto completo del jugador invitado, ahora incluyendo la información del equipo.
        const guestPlayerData = {
            name,
            dni,
            createdAt: new Date().toISOString(),
            team: teamSummaryForProfile,
        };

        const updates: { [key: string]: any } = {};
        // 1. Crea/actualiza al jugador invitado con sus datos Y la info del equipo.
        updates[`/guestPlayers/${guestId}`] = guestPlayerData;
        // 2. Añade al jugador invitado a la plantilla del equipo.
        updates[`/teams/${teamId}/players/${guestId}`] = { isGuest: true };

        await update(ref(db), updates);

        return {
            id: guestId,
            name: name,
            dni: dni,
            isGuest: true,
        };
    } catch (error) {
        console.error("Error añadiendo jugador invitado al equipo:", error);
        return null;
    }
}

export async function addRegisteredPlayerToTeam(playerId: string, teamId: string): Promise<boolean> {
    try {
        const teamDetails = await getTeamDetails(teamId);
        if (!teamDetails) {
            throw new Error(`No se pudieron obtener los detalles del equipo ${teamId}.`);
        }

        const teamSummaryForProfile = {
            id: teamId,
            name: teamDetails.name,
            crestUrl: teamDetails.logoUrl || null,
        };

        const updates: { [key: string]: any } = {};
        updates[`/teams/${teamId}/players/${playerId}`] = { isGuest: false };
        updates[`/users/${playerId}/team`] = teamSummaryForProfile;
        
        await update(ref(db), updates);
        return true;
    } catch (error) {
        console.error("Error añadiendo jugador registrado al equipo:", error);
        return false;
    }
}

export async function getTeamRoster(teamId: string): Promise<RosterPlayer[]> {
    try {
        const teamPlayersRef = ref(db, `teams/${teamId}/players`);
        const snapshot = await get(teamPlayersRef);

        if (!snapshot.exists()) return [];

        const playersData = snapshot.val();
        const playerIds = Object.keys(playersData);

        const playerPromises = playerIds.map(async (id) => {
            const playerInfo = playersData[id];
            const isGuest = playerInfo.isGuest;

            const playerRef = isGuest ? ref(db, `guestPlayers/${id}`) : ref(db, `users/${id}`);
            const playerDataSnapshot = await get(playerRef);

            if (playerDataSnapshot.exists()) {
                const data = playerDataSnapshot.val();
                return {
                    id,
                    name: data.name,
                    dni: data.dni,
                    isGuest: isGuest,
                };
            }
            return null;
        });

        const players = await Promise.all(playerPromises);
        return players.filter((player): player is RosterPlayer => player !== null);

    } catch (error) {
        console.error("Error obteniendo la plantilla del equipo:", error);
        return [];
    }
}

/**
 * Obtiene los detalles de un equipo específico (nombre, logo).
 */
export async function getTeamDetails(teamId: string): Promise<TeamDetails | null> {
    try {
        const teamRef = ref(db, `teams/${teamId}`);
        const snapshot = await get(teamRef);

        if (!snapshot.exists()) {
            console.warn(`No se encontró el equipo con ID: ${teamId}`);
            return null;
        }

        const teamData = snapshot.val();
        return {
            id: teamId,
            name: teamData.name || 'Equipo sin nombre',
            logoUrl: teamData.logoUrl,
        };
    } catch (error) {
        console.error(`Error obteniendo los detalles del equipo ${teamId}:`, error);
        return null;
    }
}

export async function removePlayerFromTeam(playerId: string, teamId: string, isGuest: boolean): Promise<boolean> {
    try {
        const updates: { [key: string]: any } = {};
        // 1. Quita al jugador de la plantilla del equipo.
        updates[`/teams/${teamId}/players/${playerId}`] = null; 

        // 2. Desvincula al equipo del perfil del jugador.
        if (isGuest) {
            // Si es un invitado, limpia la info del equipo en su nodo de guestPlayers.
            updates[`/guestPlayers/${playerId}/team`] = null;
        } else {
            // Si es un usuario registrado, limpia la info del equipo en su perfil de usuario.
            updates[`/users/${playerId}/team`] = null;
        }

        await update(ref(db), updates);
        return true;
    } catch (error) {
        console.error("Error eliminando jugador del equipo:", error);
        return false;
    }
}

export async function getAllTeams(): Promise<TeamSummary[]> {
    try {
        const teamsRef = ref(db, 'teams');
        const snapshot = await get(teamsRef);

        if (!snapshot.exists()) return [];

        const teamsData = snapshot.val();

        return Object.keys(teamsData).map(teamId => ({
            id: teamId,
            name: teamsData[teamId].name || 'Nombre no definido',
            logoUrl: teamsData[teamId].logoUrl,
            // Aseguramos que el objeto tenga el id que es la clave
            ...teamsData[teamId],
            id: teamId,
        }));

    } catch (error) {
        console.error("Error obteniendo todos los equipos:", error);
        return [];
    }
}

/**
 * Asigna un equipo ya existente a un torneo.
 * @param teamId El ID del equipo a asignar.
 * @param tournamentId El ID del torneo al que se va a unir.
 * @returns Una promesa que resuelve a true si la asignación fue exitosa, false en caso contrario.
 */
export async function assignTeamToTournament(teamId: string, tournamentId: string): Promise<boolean> {
    try {
        // Primero, obtenemos los datos actuales del torneo para saber el contador de equipos.
        const tournamentRef = ref(db, `tournaments/${tournamentId}`);
        const tournamentSnapshot = await get(tournamentRef);

        if (!tournamentSnapshot.exists()) {
            throw new Error("El torneo especificado no existe.");
        }

        const tournamentData = tournamentSnapshot.val();
        const currentTeamCount = tournamentData.teamCount || 0;

        // Preparamos la operación atómica de actualización.
        const updates: { [key: string]: any } = {};

        // 1. Añade el equipo a la lista de equipos del torneo.
        updates[`/tournaments/${tournamentId}/teams/${teamId}`] = true;
        // 2. Incrementa el contador de equipos del torneo.
        updates[`/tournaments/${tournamentId}/teamCount`] = currentTeamCount + 1;
        // 3. Actualiza el perfil del equipo para indicar a qué torneo pertenece.
        updates[`/teams/${teamId}/tournamentId`] = tournamentId;

        // Ejecutamos todas las actualizaciones a la vez.
        await update(ref(db), updates);

        return true;
    } catch (error) {
        console.error(`Error al asignar el equipo ${teamId} al torneo ${tournamentId}:`, error);
        return false;
    }
}
