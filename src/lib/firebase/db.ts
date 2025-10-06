
import { ref, get, set, update, onValue, off, query, orderByChild, equalTo, remove, push, serverTimestamp, increment } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, Post, RosterPlayer, FoundPlayer, TeamDetails, Match } from '../types'; 

// --- TIPOS ---

export interface TeamSummary {
  id: string;
  name: string;
  logoUrl: string;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; 
  gc: number; 
  dg: number; 
  points: number;
  crestUrl?: string; 
}

export interface PlayerStats {
  playerInfo: { id: string, name: string, lastName?: string };
  teamId: string;
  teamName: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

export interface TournamentStats {
  positions: TeamStats[];
  scorers: PlayerStats[];
  sanctions: PlayerStats[];
}

// --- FUNCIONES DE DATOS ESPECÍFICAS ---

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

export const findUserByDni = async (dni: string): Promise<FoundPlayer | null> => {
  try {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('dni'), equalTo(dni));
    const snapshot = await get(q);

    if (snapshot.exists()) {
        let foundUser: FoundPlayer | null = null;
        snapshot.forEach((childSnapshot) => {
        const userData: UserProfile = childSnapshot.val();
        if (!foundUser) {
            foundUser = {
            id: childSnapshot.key!,
            name: userData.name,
            dni: userData.dni,
            username: userData.username,
            avatar: userData.avatar,
            isGuest: false,
            team: userData.team || null, 
            };
        }
        });
        return foundUser;
    }
    
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);
    if (guestSnapshot.exists()) {
        const guestData = guestSnapshot.val();
        return {
            id: guestSnapshot.key!,
            name: guestData.name,
            dni: guestData.dni,
            username: 'invitado', // LÓGICA CORREGIDA: Devolvemos un placeholder simple.
            isGuest: true,
            team: guestData.team || null,
        };
    }

    return null;
  } catch (error) {
    console.error('Error al buscar usuario por DNI:', error);
    return null;
  }
};


// --- FUNCIONES PARA GESTIÓN DE PLANTILLA (ROSTER) ---

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
      const guestPlayerRef = ref(db, `guestPlayers/${playerId}`);
      const guestSnapshot = await get(guestPlayerRef);
      if (guestSnapshot.exists()) {
        const guestData = guestSnapshot.val();
        return { id: playerId, name: guestData.name, dni: guestData.dni, isGuest: true };
      }
    } else {
      const userRef = ref(db, `users/${playerId}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        return { id: playerId, name: userData.name, dni: userData.dni, isGuest: false };
      }
    }
    return null;
  });

  const players = await Promise.all(playerPromises);
  return players.filter((player): player is RosterPlayer => player !== null);
};

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

    updates[`/teams/${teamId}/players/${playerId}`] = { isGuest: false };
    updates[`/users/${playerId}/team`] = { id: teamId, name: teamDetails.name, crestUrl: teamDetails.logoUrl };

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
        updates[`/teams/${oldTeamId}/players/${guestPlayerId}`] = null;
      }
    }

    const teamDetails = await getTeamDetails(teamId);
    if (!teamDetails) throw new Error("El equipo de destino no fue encontrado.");

    const newGuestData = {
      name,
      dni,
      team: { id: teamId, name: teamDetails.name, crestUrl: teamDetails.logoUrl },
      ...(!guestSnapshot.exists() && { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    };

    updates[`/guestPlayers/${guestPlayerId}`] = newGuestData;
    updates[`/teams/${teamId}/players/${guestPlayerId}`] = { isGuest: true };

    await update(ref(db), updates);

    return { id: guestPlayerId, name, dni, isGuest: true };
  } catch (error) {
    console.error("Error al añadir jugador invitado:", error);
    return null;
  }
};

export const removePlayerFromTeam = async (playerId: string, teamId: string, isGuest: boolean): Promise<boolean> => {
  try {
    const updates: { [key: string]: any } = {};
    updates[`/teams/${teamId}/players/${playerId}`] = null;

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
            const isExcluded = teamId ? excludedTeamIds.includes(teamId) : true;
            if (nameMatches && !isExcluded) {
                results.push({ id: teamId!, name: team.name, logoUrl: team.logoUrl });
            }
        });
        return results;
    } catch (error) {
        console.error("Error al buscar equipos:", error);
        return [];
    }
};

export const assignTeamToTournament = async (teamId: string, tournamentId: string): Promise<boolean> => {
    try {
        const updates: { [key: string]: any } = {};
        // --- BUGFIX: Usar la nueva estructura `tournaments` en lugar de `tournamentId` ---
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

export const getTournamentStats = async (tournamentId: string): Promise<TournamentStats | null> => {
  try {
    const statsRef = ref(db, `tournament_stats/${tournamentId}`);
    const snapshot = await get(statsRef);
    if (snapshot.exists()) return snapshot.val() as TournamentStats;
    return null; 
  } catch (error) {
    console.error(`Error al obtener estadísticas para el torneo ${tournamentId}:`, error);
    throw new Error('No se pudieron cargar las estadísticas del torneo.');
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if(snapshot.exists()) return { id: snapshot.key, ...snapshot.val() } as UserProfile;
    return null;
};

export const getPosts = async (): Promise<Post[]> => {
    const postsRef = ref(db, 'posts');
    const snapshot = await get(query(postsRef, orderByChild('createdAt')));
    if(snapshot.exists()) {
        const postsData = snapshot.val();
        return Object.keys(postsData)
            .map(key => ({ id: key, ...postsData[key] }))
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
};


// --- IMPLEMENTACIÓN PROFESIONAL Y CORRECTA PARA HISTORIAL DE PARTIDOS ---

/**
 * Obtiene el historial de partidos completo para un equipo específico.
 * Sigue la lógica de la aplicación: Equipo -> Torneos en los que participa -> Partidos de esos torneos.
 * @param teamId El ID del equipo.
 * @returns Una promesa que se resuelve con un array de todos los partidos del equipo.
 */
export const getMatchHistoryForTeam = async (teamId: string): Promise<Match[]> => {
  console.log(`[DB Service] Iniciando búsqueda de historial para teamId: ${teamId}`);
  
  try {
    // 1. Obtener la lista de IDs de torneos en los que el equipo está inscrito.
    const teamTournamentsRef = ref(db, `teams/${teamId}/tournaments`);
    const teamTournamentsSnap = await get(teamTournamentsRef);

    if (!teamTournamentsSnap.exists()) {
      console.log(`[DB Service] El equipo ${teamId} no está inscrito en ningún torneo.`);
      return []; // Si no juega torneos, no tiene partidos.
    }

    const tournamentIds = Object.keys(teamTournamentsSnap.val());
    if (tournamentIds.length === 0) {
      console.log(`[DB Service] La lista de torneos para el equipo ${teamId} está vacía.`);
      return [];
    }
    console.log(`[DB Service] Equipo ${teamId} participa en los torneos:`, tournamentIds);

    // 2. Para cada torneo, buscar todos sus partidos y luego filtrar.
    const matchesPromises = tournamentIds.map(async (tournamentId) => {
      const matchesRef = ref(db, 'matches');
      // Buscamos todos los partidos que pertenecen a este torneo.
      const q = query(matchesRef, orderByChild('tournamentId'), equalTo(tournamentId));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        const matchesInTournament = snapshot.val();
        // ¡CORRECCIÓN FINAL! Usamos los nombres de campo correctos de tus datos.
        const teamMatches = Object.values(matchesInTournament)
          .map((matchData: any) => ({ id: matchData.id, ...matchData }))
          .filter(match => match.homeTeamId === teamId || match.awayTeamId === teamId);
        
        return teamMatches;
      } 
      return []; // No se encontraron partidos para este torneo.
    });

    // 3. Ejecutar todas las promesas y aplanar el resultado.
    const matchesPerTournament = await Promise.all(matchesPromises);
    const allMatches = matchesPerTournament.flat(); // Aplanamos el array de arrays.

    console.log(`[DB Service] Se encontraron un total de ${allMatches.length} partidos para el equipo ${teamId} en todos sus torneos.`);

    return allMatches;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener el historial de partidos para ${teamId}:`, error);
    return []; // Devolvemos un array vacío en caso de un error inesperado.
  }
};

/**
 * Encuentra el próximo partido programado para un equipo, previendo datos incompletos.
 * @param teamId El ID del equipo.
 * @returns Una promesa que se resuelve con el próximo partido (Match) o null si no hay ninguno.
 */
export const getNextMatchForTeam = async (teamId: string): Promise<Match | null> => {
  console.log(`[DB Service] Buscando próximo partido para teamId: ${teamId}`);
  try {
    // 1. Reutilizamos la lógica robusta para obtener TODOS los partidos del equipo.
    const allMatches = await getMatchHistoryForTeam(teamId);

    // 2. Filtramos en el cliente solo los partidos que están pendientes.
    const pendingMatches = allMatches.filter(match => match.status === 'pending');

    if (pendingMatches.length === 0) {
      console.log(`[DB Service] No se encontraron partidos con estado 'pending' para el equipo ${teamId}.`);
      return null;
    }

    // 3. Ordenamiento inteligente: los partidos con fecha tienen prioridad.
    pendingMatches.sort((a, b) => {
      const aHasDate = !!a.details?.date;
      const bHasDate = !!b.details?.date;

      if (aHasDate && !bHasDate) return -1; // a (con fecha) va antes que b (sin fecha).
      if (!aHasDate && bHasDate) return 1;  // b (con fecha) va antes que a (sin fecha).

      // Si ambos tienen fecha, se ordena por la más próxima.
      if (aHasDate && bHasDate) {
        return new Date(a.details!.date).getTime() - new Date(b.details!.date).getTime();
      }

      // Si ninguno tiene fecha, su orden relativo no importa.
      return 0;
    });

    // 4. El próximo partido es el primero en la lista ordenada.
    const nextMatch = pendingMatches[0];
    console.log(`[DB Service] Próximo partido encontrado para ${teamId}: ${nextMatch.id}. ¿Tiene fecha?: ${!!nextMatch.details?.date}`);
    
    return nextMatch;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener el próximo partido para ${teamId}:`, error);
    return null;
  }
};
