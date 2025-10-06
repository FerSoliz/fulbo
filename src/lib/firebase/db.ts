
import { ref, get, set, update, onValue, off, query, orderByChild, equalTo, remove, push, serverTimestamp, increment } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, Post } from '../types'; 

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

// --- FUNCIONES DE SERVICIO --- 

export const getAllTeams = async (): Promise<TeamSummary[]> => {
    try {
        const teamsRef = ref(db, 'teams');
        const snapshot = await get(query(teamsRef, orderByChild('name')));
        
        if (!snapshot.exists()) return [];

        const allTeams: TeamSummary[] = [];
        snapshot.forEach(childSnapshot => {
            const teamData = childSnapshot.val();
            allTeams.push({
                id: childSnapshot.key!,
                name: teamData.name,
                logoUrl: teamData.logoUrl
            });
        });
        
        return allTeams;

    } catch (error) {
        console.error("Error fetching all teams:", error);
        return [];
    }
};

/**
 * CORRECCIÓN DEFINITIVA: Busca equipos por nombre, excluyendo únicamente a los que ya están en el torneo actual.
 * @param searchText El texto a buscar.
 * @param excludedTeamIds IDs de equipos a excluir de la búsqueda (los que ya están en el torneo que se está editando).
 * @returns Una lista de equipos que coinciden con la búsqueda y están disponibles.
 */
export const searchTeams = async (searchText: string, excludedTeamIds: string[] = []): Promise<TeamSummary[]> => {
    if (!searchText || searchText.trim() === '') {
        return [];
    }

    try {
        const teamsRef = ref(db, 'teams');
        const q = query(teamsRef, orderByChild('name'));
        const snapshot = await get(q);
        
        if (!snapshot.exists()) {
            return [];
        }

        const results: TeamSummary[] = [];
        snapshot.forEach(childSnapshot => {
            const team = childSnapshot.val();
            const teamId = childSnapshot.key;

            // LÓGICA CORREGIDA:
            // 1. El nombre del equipo debe incluir el texto de búsqueda (más flexible que `startsWith`)
            const nameMatches = team.name.toLowerCase().includes(searchText.toLowerCase());
            // 2. El equipo NO debe estar en la lista de exclusión que nos pasa el componente.
            const isExcluded = teamId ? excludedTeamIds.includes(teamId) : true;

            // Se elimina por completo la condición errónea `!team.tournamentId`
            if (nameMatches && !isExcluded) {
                results.push({
                    id: teamId!,
                    name: team.name,
                    logoUrl: team.logoUrl,
                });
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
        updates[`/teams/${teamId}/tournamentId`] = tournamentId;
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

    if (snapshot.exists()) {
      return snapshot.val() as TournamentStats;
    }
    
    return null; 

  } catch (error) {
    console.error(`Error al obtener estadísticas para el torneo ${tournamentId}:`, error);
    throw new Error('No se pudieron cargar las estadísticas del torneo.');
  }
};


export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if(snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() } as UserProfile;
    }
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
