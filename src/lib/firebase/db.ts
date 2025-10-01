
import { get, ref, query, orderByChild, equalTo, push, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { FoundPlayer } from '@/components/search/PlayerSearch';
import { RosterPlayer } from '@/components/team/RosterManager';

// Definimos una interfaz para la estructura básica de un equipo
export interface TeamSummary {
    id: string;
    name: string;
    logoUrl?: string;
}

/**
 * Busca un usuario en la base de datos por su DNI.
 */
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
        profilePicture: userData.profilePicture || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Error buscando usuario por DNI:', error);
    return null;
  }
}

/**
 * Añade un nuevo jugador "invitado" a la base de datos y lo asigna a un equipo.
 */
export async function addGuestPlayerToTeam(name: string, dni: string, teamId: string): Promise<RosterPlayer | null> {
    try {
        const guestPlayersRef = ref(db, 'guestPlayers');
        const newGuestPlayerRef = push(guestPlayersRef);
        const guestId = newGuestPlayerRef.key;

        if (!guestId) throw new Error("No se pudo generar una ID para el jugador invitado.");

        const guestPlayerData = {
            name,
            dni,
            teamId,
            createdAt: new Date().toISOString(),
        };

        const updates: { [key: string]: any } = {};
        updates[`/guestPlayers/${guestId}`] = guestPlayerData;
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

/**
 * Asigna un jugador ya registrado en la plataforma a un equipo.
 */
export async function addRegisteredPlayerToTeam(playerId: string, teamId:string): Promise<boolean> {
    try {
        const updates: { [key: string]: any } = {};
        updates[`/teams/${teamId}/players/${playerId}`] = { isGuest: false };
        
        await update(ref(db), updates);
        return true;
    } catch (error) {
        console.error("Error añadiendo jugador registrado al equipo:", error);
        return false;
    }
}

/**
 * Obtiene la plantilla completa de un equipo, combinando jugadores registrados e invitados.
 */
export async function getTeamRoster(teamId: string): Promise<RosterPlayer[]> {
    try {
        const teamPlayersRef = ref(db, `teams/${teamId}/players`);
        const snapshot = await get(teamPlayersRef);

        if (!snapshot.exists()) return [];

        const playersData = snapshot.val();
        const playerIds = Object.keys(playersData);

        const playerPromises = playerIds.map(async (id) => {
            const isGuest = playersData[id].isGuest;

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
 * Elimina un jugador (registrado o invitado) de la plantilla de un equipo.
 */
export async function removePlayerFromTeam(playerId: string, teamId: string): Promise<boolean> {
    try {
        const playerInTeamRef = ref(db, `teams/${teamId}/players/${playerId}`);
        await remove(playerInTeamRef);
        return true;
    } catch (error) {
        console.error("Error eliminando jugador del equipo:", error);
        return false;
    }
}

/**
 * Obtiene una lista de todos los equipos del sistema.
 */
export async function getAllTeams(): Promise<TeamSummary[]> {
    try {
        const teamsRef = ref(db, 'teams');
        const snapshot = await get(teamsRef);

        if (!snapshot.exists()) return [];

        const teamsData = snapshot.val();

        return Object.keys(teamsData).map(teamId => ({
            id: teamId,
            name: teamsData[teamId].name || 'Nombre no definido', // Fallback por si el equipo no tiene nombre
            logoUrl: teamsData[teamId].logoUrl
        }));

    } catch (error) {
        console.error("Error obteniendo todos los equipos:", error);
        return [];
    }
}
