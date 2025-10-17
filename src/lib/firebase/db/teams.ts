import { ref, get, set, update, remove, query, orderByChild, equalTo, push, serverTimestamp, increment, onValue, Unsubscribe } from 'firebase/database';
import { db } from '../../firebase';
import { RosterPlayer, Team, TeamDetails, TeamSummary } from '../../types';
import { getUserProfile } from './users'; // Reutilizar la función de usuarios registrados
import { getGuestPlayerByDni } from './guestPlayers'; // Reutilizar la función de jugadores invitados

/**
 * Obtiene los detalles básicos de un equipo por su ID.
 * @param teamId El ID del equipo.
 * @returns Una promesa que se resuelve con el objeto TeamDetails o null si no se encuentra.
 */
export const getTeamDetails = async (teamId: string): Promise<TeamDetails | null> => {
  try {
    const teamRef = ref(db, `teams/${teamId}`);
    const snapshot = await get(teamRef);

    if (!snapshot.exists()) {
      return null;
    }

    const teamData = snapshot.val();
    return {
      id: snapshot.key!,
      name: teamData.name,
      logoUrl: teamData.logoUrl,
      captainId: teamData.captainId,
    };
  } catch (error) {
    console.error('Error al obtener los detalles del equipo:', error);
    return null;
  }
};

/**
 * Obtiene los detalles de múltiples equipos a la vez.
 * @param teamIds Un array de IDs de equipos.
 * @returns Un mapa (diccionario) donde las claves son los IDs de los equipos y los valores son los datos del equipo.
 */
export const getMultipleTeams = async (teamIds: string[]): Promise<Record<string, Team>> => {
    const teamPromises = teamIds.map(id => get(ref(db, `teams/${id}`)));
    const teamSnapshots = await Promise.all(teamPromises);
    const teamsMap: Record<string, Team> = {};
    teamSnapshots.forEach(snap => {
        if (snap.exists()) {
            teamsMap[snap.key!] = { id: snap.key!, ...snap.val() };
        }
    });
    return teamsMap;
};


/**
 * Obtiene la plantilla (roster) completa de un equipo, incluyendo detalles de jugadores registrados e invitados.
 * @param teamId El ID del equipo.
 * @returns Una promesa que se resuelve con un array de RosterPlayer.
 */
export const getTeamRoster = async (teamId: string): Promise<RosterPlayer[]> => {
  const rosterRef = ref(db, `teams/${teamId}/players`);
  const rosterSnapshot = await get(rosterRef);

  if (!rosterSnapshot.exists()) {
    return [];
  }

  const rosterData = rosterSnapshot.val();
  const playerPromises: Promise<RosterPlayer | null>[] = Object.keys(rosterData).map(async (playerId) => {
    const playerData = rosterData[playerId];
    const isGuest = playerData.isGuest === true;

    if (isGuest) {
      // Usar la función de guestPlayers para obtener detalles del invitado
      const guestPlayer = await getGuestPlayerByDni(playerId);
      if (guestPlayer) {
        return { id: playerId, name: guestPlayer.name, dni: guestPlayer.dni, isGuest: true };
      }
    } else {
      // Usar la función de users para obtener detalles del usuario registrado
      const user = await getUserProfile(playerId);
      if (user) {
        return { id: playerId, name: user.name, dni: user.dni, isGuest: false };
      }
    }
    return null;
  });

  const players = await Promise.all(playerPromises);
  return players.filter((player): player is RosterPlayer => player !== null);
};

/**
 * Añade un jugador registrado a un equipo y actualiza el equipo del jugador.
 * Si el jugador ya estaba en otro equipo, se elimina de ese equipo.
 * @param playerId El ID del jugador registrado.
 * @param teamId El ID del equipo al que se va a añadir.
 * @returns Una promesa que se resuelve en true si la operación fue exitosa, false en caso contrario.
 */
export const addRegisteredPlayerToTeam = async (playerId: string, teamId: string): Promise<boolean> => {
  try {
    const playerRef = ref(db, `users/${playerId}`);
    const playerSnapshot = await get(playerRef);
    if (!playerSnapshot.exists()) throw new Error("El jugador no existe.");

    const playerData = playerSnapshot.val();
    const oldTeamId = playerData.team?.id;

    const updates: { [key: string]: any } = {};
    const teamDetails = await getTeamDetails(teamId);
    if(!teamDetails) throw new Error("El equipo de destino no existe");

    // Añadir jugador al nuevo equipo
    updates[`/teams/${teamId}/players/${playerId}`] = { isGuest: false };
    // Actualizar el equipo en el perfil del jugador
    updates[`/users/${playerId}/team`] = { id: teamId, name: teamDetails.name, crestUrl: teamDetails.logoUrl };

    // Si el jugador estaba en otro equipo, removerlo de allí
    if (oldTeamId && oldTeamId !== teamId) {
      updates[`/teams/${oldTeamId}/players/${playerId}`] = null;
    }

    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error("Error al añadir jugador registrado:", error);
    return false;
  }
};

/**
 * Añade un jugador invitado a un equipo o actualiza su información si ya existe.
 * Si el jugador invitado ya estaba en otro equipo, se elimina de ese equipo.
 * @param name El nombre del jugador invitado.
 * @param dni El DNI del jugador invitado (usado como ID).
 * @param teamId El ID del equipo al que se va a añadir.
 * @returns Una promesa que se resuelve con el objeto RosterPlayer creado/actualizado o null en caso de error.
 */
export const addGuestPlayerToTeam = async (name: string, dni: string, teamId: string): Promise<RosterPlayer | null> => {
  try {
    const guestPlayerId = dni;
    const guestPlayerRef = ref(db, `guestPlayers/${guestPlayerId}`);
    const guestSnapshot = await get(guestPlayerRef);

    const updates: { [key: string]: any } = {};

    if (guestSnapshot.exists()) {
      const guestData = guestSnapshot.val();
      const oldTeamId = guestData.team?.id;
      if (oldTeamId && oldTeamId !== teamId) {
        // Si el invitado estaba en otro equipo, se remueve de ese equipo
        updates[`/teams/${oldTeamId}/players/${guestPlayerId}`] = null;
      }
    }

    const teamDetails = await getTeamDetails(teamId);
    if (!teamDetails) throw new Error("El equipo de destino no fue encontrado.");

    const newGuestData = {
      name,
      dni,
      team: { id: teamId, name: teamDetails.name, crestUrl: teamDetails.logoUrl },
      ...(!guestSnapshot.exists() && { createdAt: serverTimestamp() }), // Solo si es un nuevo invitado
      updatedAt: serverTimestamp(),
    };

    // Actualizar o crear perfil del invitado
    updates[`/guestPlayers/${guestPlayerId}`] = newGuestData;
    // Añadir invitado al equipo
    updates[`/teams/${teamId}/players/${guestPlayerId}`] = { isGuest: true };

    await update(ref(db), updates);

    return { id: guestPlayerId, name, dni, isGuest: true };
  } catch (error) {
    console.error("Error al añadir jugador invitado:", error);
    return null;
  }
};

/**
 * Elimina un jugador (registrado o invitado) de un equipo.
 * También remueve la referencia del equipo en el perfil del jugador.
 * @param playerId El ID del jugador a eliminar.
 * @param teamId El ID del equipo del que se eliminará al jugador.
 * @param isGuest Indica si el jugador es invitado.
 * @returns Una promesa que se resuelve en true si la operación fue exitosa, false en caso contrario.
 */
export const removePlayerFromTeam = async (playerId: string, teamId: string, isGuest: boolean): Promise<boolean> => {
  try {
    const updates: { [key: string]: any } = {};
    // Eliminar la referencia del jugador del equipo
    updates[`/teams/${teamId}/players/${playerId}`] = null;

    // Eliminar la referencia del equipo del perfil del jugador
    if (isGuest) {
      updates[`/guestPlayers/${playerId}/team`] = null;
    } else {
      updates[`/users/${playerId}/team`] = null;
    }

    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error("Error al eliminar jugador:", error);
    return false;
  }
};

/**
 * Obtiene una lista de todos los equipos con un resumen de su información.
 * @returns Una promesa que se resuelve con un array de TeamSummary.
 */
export const getAllTeams = async (): Promise<TeamSummary[]> => {
    try {
        const teamsRef = ref(db, 'teams');
        const snapshot = await get(query(teamsRef, orderByChild('name')));
        if (!snapshot.exists()) return [];
        const allTeams: TeamSummary[] = [];
        snapshot.forEach(childSnapshot => {
            const teamData = childSnapshot.val();
            allTeams.push({ id: childSnapshot.key!, name: teamData.name, logoUrl: teamData.logoUrl });
        });
        return allTeams;
    } catch (error) {
        console.error("Error fetching all teams:", error);
        return [];
    }
};

/**
 * Busca equipos por un texto de búsqueda en su nombre, excluyendo ciertos IDs.
 * @param searchText El texto a buscar en el nombre del equipo.
 * @param excludedTeamIds IDs de equipos a excluir de los resultados.
 * @returns Una promesa que se resuelve con un array de TeamSummary.
 */
export const searchTeams = async (searchText: string, excludedTeamIds: string[] = []): Promise<TeamSummary[]> => {
    if (!searchText || searchText.trim() === '') return [];
    try {
        const teamsRef = ref(db, 'teams');
        const q = query(teamsRef, orderByChild('name'));
        const snapshot = await get(q);
        if (!snapshot.exists()) return [];
        const results: TeamSummary[] = [];
        snapshot.forEach(childSnapshot => {
            const team = childSnapshot.val();
            const teamId = childSnapshot.key;
            const nameMatches = team.name.toLowerCase().includes(searchText.toLowerCase());
            const isExcluded = teamId ? excludedTeamIds.includes(teamId) : false; // Cambiado a false, si no está en la lista no es excluido.
            if (nameMatches && !isExcluded) {
                results.push({ id: teamId!, name: team.name, logoUrl: team.logoUrl });
            }
        });
        return results;
    } catch (error) {
        console.error("Error al buscar equipos:", error);
        return [];
    }
}

/**
 * Asigna un equipo a un torneo, creando referencias bidireccionales y actualizando el contador de equipos.
 * @param teamId El ID del equipo a asignar.
 * @param tournamentId El ID del torneo.
 * @returns Una promesa que se resuelve en true si la operación fue exitosa, false en caso contrario.
 */
export const assignTeamToTournament = async (teamId: string, tournamentId: string): Promise<boolean> => {
    try {
        const updates: { [key: string]: any } = {};
        updates[`/teams/${teamId}/tournaments/${tournamentId}`] = true;
        updates[`/tournaments/${tournamentId}/teams/${teamId}`] = true;
        updates[`/tournaments/${tournamentId}/teamCount`] = increment(1);
        await update(ref(db), updates);
        return true;
    } catch (error) {
        console.error("Error assigning team to tournament:", error);
        return false;
    }
};

/**
 * Busca el equipo al que pertenece un jugador específico.
 * @param userId El ID del jugador.
 * @returns Una promesa que se resuelve con el objeto del equipo o null si no se encuentra.
 */
export const findTeamByPlayer = async (userId: string): Promise<TeamDetails | null> => {
  if (!userId) return null;

  try {
    const teamsRef = ref(db, 'teams');
    const teamsSnapshot = await get(teamsRef);

    if (!teamsSnapshot.exists()) {
      return null;
    }

    let foundTeam: TeamDetails | null = null;
    const teamsData = teamsSnapshot.val();
    
    for (const teamId of Object.keys(teamsData)) {
      const team = teamsData[teamId];
      if (team.players && team.players[userId]) {
        foundTeam = { id: teamId, name: team.name, logoUrl: team.logoUrl, captainId: team.captainId };
        break; 
      }
    }

    return foundTeam;

  } catch (error) {
    console.error(`Error al buscar el equipo para el jugador ${userId}:`, error);
    return null;
  }
};

/**
 * Escucha los cambios en todos los equipos en tiempo real.
 * @param callback La función a ejecutar cada vez que los datos cambian.
 * @returns Una función para cancelar la suscripción.
 */
export const listenToAllTeams = (callback: (teams: Team[]) => void): Unsubscribe => {
    const teamsRef = ref(db, 'teams');
    const unsubscribe = onValue(teamsRef, (snapshot) => {
        if (snapshot.exists()) {
            const teamsData = snapshot.val();
            const teamsList: Team[] = Object.keys(teamsData).map(key => ({ id: key, ...teamsData[key] }));
            callback(teamsList);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error("Error al escuchar los equipos:", error);
        callback([]);
    });

    return unsubscribe;
};
