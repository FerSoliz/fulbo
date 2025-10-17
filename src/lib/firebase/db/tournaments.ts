import { ref, get, query } from 'firebase/database';
import { db } from '../../firebase';
import { FullTournament, Tournament, TournamentStats, Standing, Scorer, Sanction } from '../../types';

/**
 * Obtiene una lista de todos los torneos disponibles.
 * @returns Una promesa que se resuelve con un array de FullTournament.
 */
export const getAllTournaments = async (): Promise<FullTournament[]> => {
  try {
    const tournamentsRef = ref(db, 'tournaments');
    const snapshot = await get(tournamentsRef);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron torneos.");
      return [];
    }

    const tournamentsList: FullTournament[] = [];
    snapshot.forEach(childSnapshot => {
      tournamentsList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });

    return tournamentsList;
  } catch (error) {
    console.error("[DB Service] Error crítico al obtener todos los torneos:", error);
    return [];
  }
};

/**
 * Obtiene los detalles de múltiples torneos a la vez.
 * @param tournamentIds Un array de IDs de torneos.
 * @returns Un mapa (diccionario) donde las claves son los IDs y los valores son los datos del torneo.
 */
export const getMultipleTournaments = async (tournamentIds: string[]): Promise<Record<string, Tournament>> => {
    const tournamentPromises = tournamentIds.map(id => get(ref(db, `tournaments/${id}`)));
    const tournamentSnapshots = await Promise.all(tournamentPromises);
    const tournamentsMap: Record<string, Tournament> = {};
    tournamentSnapshots.forEach(snap => {
        if (snap.exists()) {
            tournamentsMap[snap.key!] = { id: snap.key!, ...snap.val() };
        }
    });
    return tournamentsMap;
};


/**
 * Obtiene los detalles completos de un torneo, incluyendo sus estadísticas (tabla de posiciones, goleadores, sanciones).
 * Enriquecimiento de datos: busca nombres de equipos asociados a las estadísticas.
 * @param tournamentId El ID del torneo.
 * @returns Una promesa que se resuelve con el objeto FullTournament o null si no se encuentra.
 */
export const getTournamentDetails = async (tournamentId: string): Promise<FullTournament | null> => {
  console.log(`[DB Service] Obteniendo detalles enriquecidos para el torneo: ${tournamentId}`);
  try {
    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const statsRef = ref(db, `tournament_stats/${tournamentId}`);

    const [tournamentSnapshot, statsSnapshot] = await Promise.all([
      get(tournamentRef),
      get(statsRef),
    ]);

    if (!tournamentSnapshot.exists()) {
      console.warn(`[DB Service] No se encontró el torneo con ID: ${tournamentId}`);
      return null;
    }

    const tournamentData = tournamentSnapshot.val();
    const statsData: TournamentStats | null = statsSnapshot.exists() ? statsSnapshot.val() : null;
    const teamIds = tournamentData.teams ? Object.keys(tournamentData.teams) : [];

    // Obtener detalles de todos los equipos del torneo en paralelo
    const teamsPromises = teamIds.map(id => get(ref(db, `teams/${id}`)));
    const teamsSnapshots = await Promise.all(teamsPromises);
    const teamsMap = teamsSnapshots.reduce((acc, snap) => {
      if (snap.exists()) {
        const team = snap.val();
        acc[snap.key!] = { name: team.name, logoUrl: team.logoUrl };
      }
      return acc;
    }, {} as { [id: string]: { name: string, logoUrl: string } });

    console.log("[DB Service] Mapa de equipos construido:", teamsMap);

    const standings: Standing[] = statsData?.positions?.map((pos, index) => ({
      rank: index + 1,
      team: teamsMap[pos.teamId]?.name || pos.teamName || 'Equipo Desconocido',
      played: pos.played,
      won: pos.won,
      drawn: pos.drawn,
      lost: pos.lost,
      points: pos.points,
      crestUrl: teamsMap[pos.teamId]?.logoUrl || ''
    })) || [];

    const scorers: Scorer[] = statsData?.scorers?.map((scorer, index) => ({
      rank: index + 1,
      player: `${scorer.playerInfo.name} ${scorer.playerInfo.lastName || ''}`.trim(),
      team: teamsMap[scorer.teamId]?.name || scorer.teamName || 'Equipo Desconocido',
      goals: scorer.goals,
    })) || [];
    
    const sanctions: Sanction[] = statsData?.sanctions?.map(sanc => ({
      player: `${sanc.playerInfo.name} ${sanc.playerInfo.lastName || ''}`.trim(),
      team: teamsMap[sanc.teamId]?.name || sanc.teamName || 'Equipo Desconocido',
      yellowCards: sanc.yellowCards,
      redCards: sanc.redCards,
    })) || [];

    const fullTournamentData: FullTournament = {
      id: tournamentSnapshot.key!,
      name: tournamentData.name,
      category: tournamentData.category,
      startDate: tournamentData.startDate,
      endDate: tournamentData.endDate,
      venue: tournamentData.venue,
      standings,
      scorers,
      sanctions,
    };

    console.log(`[DB Service] Datos combinados y enriquecidos para ${tournamentId}:`, fullTournamentData);
    return fullTournamentData;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener los detalles del torneo ${tournamentId}:`, error);
    return null;
  }
};

/**
 * Obtiene solo las estadísticas consolidadas de un torneo (posiciones, goleadores, sanciones).
 * @param tournamentId El ID del torneo.
 * @returns Una promesa que se resuelve con el objeto TournamentStats o null si no se encuentran.
 */
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
