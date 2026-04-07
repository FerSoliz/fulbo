import { ref, get, set, update, remove, query, orderByChild, equalTo, push, serverTimestamp, increment, onValue, Unsubscribe } from 'firebase/database';
import { db } from '../../firebase';
import { RosterPlayer, Team, TeamDetails, TeamSummary } from '../../types';
import { getUserProfile } from './users';
import { getGuestPlayerByDni } from './guestPlayers';

export const getTeamDetails = async (teamId: string): Promise<TeamDetails | null> => {
  try {
    const teamRef = ref(db, `teams/${teamId}`);
    const snapshot = await get(teamRef);
    if (!snapshot.exists()) return null;
    const teamData = snapshot.val();
    return { id: snapshot.key!, name: teamData.name, logoUrl: teamData.logoUrl, captainId: teamData.captainId };
  } catch (error) {
    console.error('Error al obtener los detalles del equipo:', error);
    return null;
  }
};

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

export const getTeamRoster = async (teamId: string): Promise<RosterPlayer[]> => {
  const rosterRef = ref(db, `teams/${teamId}/players`);
  const rosterSnapshot = await get(rosterRef);
  if (!rosterSnapshot.exists()) return [];
  const rosterData = rosterSnapshot.val();
  const playerPromises: Promise<RosterPlayer | null>[] = Object.keys(rosterData).map(async (playerId) => {
    const playerData = rosterData[playerId];
    if (playerData.isGuest) {
      const guestPlayer = await getGuestPlayerByDni(playerId);
      return guestPlayer ? { id: playerId, name: guestPlayer.name, dni: guestPlayer.dni, isGuest: true } : null;
    } else {
      const user = await getUserProfile(playerId);
      return user ? { id: playerId, name: user.name, dni: user.dni, isGuest: false } : null;
    }
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
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);
    const updates: { [key: string]: any } = {};
    if (guestSnapshot.exists()) {
      const guestData = guestSnapshot.val();
      const oldTeamId = guestData.team?.id;
      if (oldTeamId && oldTeamId !== teamId) {
        updates[`/teams/${oldTeamId}/players/${dni}`] = null;
      }
    }
    const teamDetails = await getTeamDetails(teamId);
    if (!teamDetails) throw new Error("El equipo de destino no fue encontrado.");
    const newGuestData = {
      name, dni, team: { id: teamId, name: teamDetails.name, crestUrl: teamDetails.logoUrl },
      ...(!guestSnapshot.exists() && { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    };
    updates[`/guestPlayers/${dni}`] = newGuestData;
    updates[`/teams/${teamId}/players/${dni}`] = { isGuest: true };
    await update(ref(db), updates);
    return { id: dni, name, dni, isGuest: true };
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
        const q = query(ref(db, 'teams'), orderByChild('name'));
        const snapshot = await get(q);
        if (!snapshot.exists()) return [];
        const results: TeamSummary[] = [];
        snapshot.forEach(childSnapshot => {
            const team = childSnapshot.val();
            const teamId = childSnapshot.key;
            if (team.name.toLowerCase().includes(searchText.toLowerCase()) && !excludedTeamIds.includes(teamId!)) {
                results.push({ id: teamId!, name: team.name, logoUrl: team.logoUrl });
            }
        });
        return results;
    } catch (error) {
        console.error("Error al buscar equipos:", error);
        return [];
    }
}

export const assignTeamToTournament = async (teamId: string, tournamentId: string): Promise<boolean> => {
    try {
        const updates: { [key: string]: any } = {};
        updates[`/teams/${teamId}/tournaments/${tournamentId}`] = true;
        updates[`/tournaments/${tournamentId}/teams/${teamId}`] = true;
        updates[`/tournaments/${tournamentId}/teamCount`] = increment(1);
        await update(ref(db), updates);
        return true;
    } catch (error) { console.error("Error assigning team to tournament:", error); return false; }
};

export const findTeamByPlayer = async (userId: string): Promise<TeamDetails | null> => {
  if (!userId) return null;
  try {
    const teamsSnapshot = await get(ref(db, 'teams'));
    if (!teamsSnapshot.exists()) return null;
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

export const listenToAllTeams = (callback: (teams: Team[]) => void): Unsubscribe => {
    const teamsRef = ref(db, 'teams');
    const unsubscribe = onValue(teamsRef, (snapshot) => {
        const teamsList: Team[] = [];
        if (snapshot.exists()) {
            const teamsData = snapshot.val();
            Object.keys(teamsData).forEach(key => teamsList.push({ id: key, ...teamsData[key] }));
        }
        callback(teamsList);
    }, (error) => {
        console.error("Error al escuchar los equipos:", error);
        callback([]);
    });
    return unsubscribe;
};

export const updateTeamWithFanOut = async (teamId: string, teamData: { name: string; logoUrl?: string }) => {
  try {
    const teamRef = ref(db, `teams/${teamId}`);
    const teamSnapshot = await get(teamRef);
    if (!teamSnapshot.exists()) throw new Error(`El equipo con ID ${teamId} no existe.`);
    const currentTeamData = teamSnapshot.val();
    const updates: { [key: string]: any } = {};
    updates[`/teams/${teamId}/name`] = teamData.name;
    if (teamData.logoUrl) updates[`/teams/${teamId}/logoUrl`] = teamData.logoUrl;
    if (currentTeamData.players) {
      const updatedTeamInfo = { id: teamId, name: teamData.name, crestUrl: teamData.logoUrl || currentTeamData.logoUrl || null };
      for (const playerId in currentTeamData.players) {
        if (currentTeamData.players[playerId].isGuest) {
          updates[`/guestPlayers/${playerId}/team`] = updatedTeamInfo;
        } else {
          updates[`/users/${playerId}/team`] = updatedTeamInfo;
        }
      }
    }
    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error("Error al actualizar el equipo y propagar los cambios:", error);
    return false;
  }
};

export const deleteTeam = async (team: Pick<Team, 'id'>): Promise<void> => {
  if (!team?.id) {
    throw new Error('Datos del equipo invalidos para eliminar.');
  }

  await remove(ref(db, `teams/${team.id}`));
};

