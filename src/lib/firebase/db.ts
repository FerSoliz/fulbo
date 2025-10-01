
import { get, ref, query, orderByChild, equalTo, push, update, remove, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { FoundPlayer } from '@/components/search/PlayerSearch';
import type { RosterPlayer } from '@/components/team/RosterManager';

export interface TeamSummary {
    id: string;
    name: string;
    logoUrl?: string;
}

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
      };
    }
    
    // Si no se encuentra en usuarios, buscar en jugadores invitados
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);
    if (guestSnapshot.exists()) {
        const guestData = guestSnapshot.val();
        return {
            id: dni, // Para un invitado, el ID es su DNI
            name: guestData.name,
            dni: guestData.dni,
            username: 'invitado', // Los invitados no tienen usuario
            avatar: `https://avatar.vercel.sh/${guestData.dni}.png`, // Avatar genérico para invitados
            isGuest: true
        };
    }

    return null;
  } catch (error) {
    console.error('Error buscando usuario por DNI:', error);
    return null;
  }
}

/**
 * Añade un nuevo jugador "invitado" a la base de datos usando su DNI como ID.
 */
export async function addGuestPlayerToTeam(name: string, dni: string, teamId: string): Promise<RosterPlayer | null> {
    try {
        // La ID del jugador invitado es su propio DNI.
        const guestId = dni;

        const guestPlayerData = {
            name,
            dni,
            createdAt: new Date().toISOString(),
        };

        // Preparamos una actualización atómica para garantizar la consistencia de los datos.
        const updates: { [key: string]: any } = {};
        updates[`/guestPlayers/${guestId}`] = guestPlayerData; // Crea o actualiza al jugador invitado en la tabla global.
        updates[`/teams/${teamId}/players/${guestId}`] = { isGuest: true }; // Añade la referencia del invitado al equipo.

        await update(ref(db), updates);

        // Devolvemos el objeto RosterPlayer para que la UI se actualice al instante.
        return {
            id: guestId, // El ID ahora es el DNI.
            name: name,
            dni: dni,
            isGuest: true,
        };
    } catch (error) {
        console.error("Error añadiendo jugador invitado al equipo:", error);
        return null;
    }
}


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

            // Si el ID del jugador es un DNI (para invitados), la referencia es a guestPlayers.
            // Si no, es un UID de Firebase, y la referencia es a users.
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


export async function getAllTeams(): Promise<TeamSummary[]> {
    try {
        const teamsRef = ref(db, 'teams');
        const snapshot = await get(teamsRef);

        if (!snapshot.exists()) return [];

        const teamsData = snapshot.val();

        return Object.keys(teamsData).map(teamId => ({
            id: teamId,
            name: teamsData[teamId].name || 'Nombre no definido',
            logoUrl: teamsData[teamId].logoUrl
        }));

    } catch (error) {
        console.error("Error obteniendo todos los equipos:", error);
        return [];
    }
}
