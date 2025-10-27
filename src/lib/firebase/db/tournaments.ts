import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import { FullTournament, Tournament, Team, Match, Standing, Scorer, Sanction, TournamentStats } from '@/lib/types';

/**
 * Obtiene una lista de todos los torneos disponibles.
 * @returns Una promesa que se resuelve con un array de FullTournament.
 */
export const getAllTournaments = async (): Promise<FullTournament[]> => {
  try {
    const tournamentsRef = ref(db, 'tournaments');
    const snapshot = await get(tournamentsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const tournamentsList: FullTournament[] = [];
    snapshot.forEach(childSnapshot => {
      tournamentsList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });

    return tournamentsList;
  } catch (error) {
    console.error("[DB Service] Error al obtener torneos:", error);
    return [];
  }
};

/**
 * Obtiene los detalles completos de un torneo, incluyendo estadísticas, partidos y equipos.
 * @param tournamentId El ID del torneo.
 * @returns Una promesa que se resuelve con el objeto FullTournament o null si no se encuentra.
 */
export const getTournamentDetails = async (tournamentId: string): Promise<FullTournament | null> => {
  console.log(`[DB Service] Obteniendo detalles completos para el torneo: ${tournamentId}`);
  try {
    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const statsRef = ref(db, `tournament_stats/${tournamentId}`);
    const matchesQuery = query(ref(db, 'matches'), orderByChild('tournamentId'), equalTo(tournamentId));

    const [tournamentSnapshot, statsSnapshot, matchesSnapshot] = await Promise.all([
      get(tournamentRef),
      get(statsRef),
      get(matchesQuery)
    ]);

    if (!tournamentSnapshot.exists()) {
      console.warn(`[DB Service] No se encontró el torneo con ID: ${tournamentId}`);
      return null;
    }

    const tournamentData: Tournament = tournamentSnapshot.val();
    const statsData = statsSnapshot.exists() ? statsSnapshot.val() : null;
    const teamIds = tournamentData.teams ? Object.keys(tournamentData.teams) : [];

    const teamsPromises = teamIds.map(id => get(ref(db, `teams/${id}`)));
    const teamsSnapshots = await Promise.all(teamsPromises);
    
    const teamsList: Team[] = [];
    const teamsMap: { [id: string]: { name: string, logoUrl: string } } = {};
    teamsSnapshots.forEach(snap => {
      if (snap.exists()) {
        const team = { id: snap.key!, ...snap.val() };
        teamsList.push(team);
        teamsMap[team.id] = { name: team.name, logoUrl: team.logoUrl || '' };
      }
    });

    const matches: Match[] = [];
    if (matchesSnapshot.exists()) {
      matchesSnapshot.forEach(matchSnap => {
        const matchData = matchSnap.val();
        matches.push({
          id: matchSnap.key!,
          ...matchData,
          homeTeamName: teamsMap[matchData.homeTeamId]?.name,
          awayTeamName: teamsMap[matchData.awayTeamId]?.name,
          homeTeamCrest: teamsMap[matchData.homeTeamId]?.logoUrl,
          awayTeamCrest: teamsMap[matchData.awayTeamId]?.logoUrl,
        });
      });
    }
    matches.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    const standings: Standing[] = statsData?.positions?.map((pos, index) => ({
      rank: index + 1,
      team: teamsMap[pos.teamId]?.name || 'Equipo Desconocido',
      played: pos.played, won: pos.won, drawn: pos.drawn, lost: pos.lost, points: pos.points,
      crestUrl: teamsMap[pos.teamId]?.logoUrl || ''
    })) || [];

    const scorers: Scorer[] = statsData?.scorers?.map((scorer, index) => ({
      rank: index + 1,
      player: `${scorer.playerInfo?.name || ''} ${scorer.playerInfo?.lastName || ''}`.trim(),
      team: teamsMap[scorer.teamId]?.name || 'Equipo Desconocido',
      goals: scorer.goals,
    })) || [];
    
    const sanctions: Sanction[] = statsData?.sanctions?.map(sanc => ({
      player: `${sanc.playerInfo?.name || ''} ${sanc.playerInfo?.lastName || ''}`.trim(),
      team: teamsMap[sanc.teamId]?.name || 'Equipo Desconocido',
      yellowCards: sanc.yellowCards, redCards: sanc.redCards,
    })) || [];

    const fullTournamentData: FullTournament = {
      id: tournamentSnapshot.key!,
      ...tournamentData,
      standings,
      scorers,
      sanctions,
      matches, 
      teamsList,
    };

    return fullTournamentData;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener los detalles del torneo ${tournamentId}:`, error);
    return null;
  }
};

/**
 * Obtiene los datos de múltiples torneos de forma eficiente.
 * @param tournamentIds Un array con los IDs de los torneos a obtener.
 * @returns Un mapa (objeto) donde cada clave es un ID de torneo y el valor son los datos del torneo.
 */
export const getMultipleTournaments = async (tournamentIds: string[]): Promise<{ [key: string]: Tournament }> => {
  if (tournamentIds.length === 0) {
    return {};
  }

  try {
    const uniqueTournamentIds = [...new Set(tournamentIds)];
    const tournamentsPromises = uniqueTournamentIds.map(id => get(ref(db, `tournaments/${id}`)));
    const tournamentsSnapshots = await Promise.all(tournamentsPromises);

    const tournamentsMap: { [key: string]: Tournament } = {};

    tournamentsSnapshots.forEach(snapshot => {
      if (snapshot.exists()) {
        tournamentsMap[snapshot.key!] = snapshot.val();
      }
    });

    return tournamentsMap;
  } catch (error) {
    console.error("[DB Service] Error al obtener múltiples torneos:", error);
    return {};
  }
};

/**
 * Obtiene las estadísticas agregadas de un torneo (posiciones, goleadores, etc.).
 * @param tournamentId El ID del torneo.
 * @returns Una promesa que se resuelve con el objeto de estadísticas del torneo o null.
 */
export const getTournamentStats = async (tournamentId: string): Promise<TournamentStats | null> => {
  try {
    const statsRef = ref(db, `tournament_stats/${tournamentId}`);
    const snapshot = await get(statsRef);

    if (snapshot.exists()) {
      return snapshot.val() as TournamentStats;
    }
    return null;
  } catch (error) {
    console.error(`[DB Service] Error al obtener estadísticas del torneo ${tournamentId}:`, error);
    return null;
  }
};
