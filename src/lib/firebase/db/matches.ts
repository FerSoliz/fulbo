
import { ref, get, query, orderByChild, equalTo, update, push } from 'firebase/database';
import { db } from '../../firebase';
import { Match, EnrichedMatch, MatchFinances, Player, Team, MatchStats, Round, Matchup } from '../../types';

/**
 * Obtiene el historial de partidos para un equipo específico, buscando en todos los torneos en los que participa.
 * @param teamId El ID del equipo.
 * @returns Una promesa que se resuelve con un array de Match.
 */
export const getMatchHistoryForTeam = async (teamId: string): Promise<Match[]> => {
  console.log(`[DB Service] Iniciando búsqueda de historial para teamId: ${teamId}`);
  try {
    const teamTournamentsRef = ref(db, `teams/${teamId}/tournaments`);
    const teamTournamentsSnap = await get(teamTournamentsRef);

    if (!teamTournamentsSnap.exists()) {
      console.log(`[DB Service] El equipo ${teamId} no está inscrito en ningún torneo.`);
      return [];
    }

    const tournamentIds = Object.keys(teamTournamentsSnap.val());
    if (tournamentIds.length === 0) return [];
    console.log(`[DB Service] Equipo ${teamId} participa en los torneos:`, tournamentIds);

    const matchesPromises = tournamentIds.map(async (tournamentId) => {
      const matchesRef = ref(db, 'matches');
      const q = query(matchesRef, orderByChild('tournamentId'), equalTo(tournamentId));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        const matchesData = snapshot.val();
        const teamMatches = Object.keys(matchesData)
          .map(matchId => {
            const matchData = matchesData[matchId];
            return { ...matchData, id: matchId };
          })
          .filter(match => match.homeTeamId === teamId || match.awayTeamId === teamId);
        
        return teamMatches;
      }
      return [];
    });

    const matchesPerTournament = await Promise.all(matchesPromises);
    const allMatches = matchesPerTournament.flat();

    console.log(`[DB Service] Se encontraron un total de ${allMatches.length} partidos para el equipo ${teamId}.`);
    return allMatches;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener el historial de partidos para ${teamId}:`, error);
    return [];
  }
};

/**
 * Obtiene los próximos partidos pendientes para un equipo específico.
 * @param teamId El ID del equipo.
 * @returns Una promesa que se resuelve con un array de Match (solo partidos pendientes y ordenados).
 */
export const getUpcomingMatchesForTeam = async (teamId: string): Promise<Match[]> => {
  console.log(`[DB Service] Buscando TODOS los partidos pendientes para teamId: ${teamId}`);
  try {
    const allMatches = await getMatchHistoryForTeam(teamId); // Reutilizamos la función existente
    const pendingMatches = allMatches.filter(match => match.status === 'pending');

    if (pendingMatches.length === 0) {
      console.log(`[DB Service] No se encontraron partidos pendientes para el equipo ${teamId}.`);
      return []; 
    }

    pendingMatches.sort((a, b) => {
      const aDate = a.details?.date ? new Date(a.details.date).getTime() : 0;
      const bDate = b.details?.date ? new Date(b.details.date).getTime() : 0;
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      return aDate - bDate;
    });

    console.log(`[DB Service] Se encontraron ${pendingMatches.length} partidos pendientes.`);
    return pendingMatches;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener los próximos partidos para ${teamId}:`, error);
    return [];
  }
};

/**
 * Obtiene todos los partidos con estado 'finished' y los enriquece con datos
 * del torneo y los equipos para ser mostrados en la UI.
 * @returns Una promesa que se resuelve a un array de partidos finalizados y enriquecidos.
 */
export const getFinishedMatches = async (): Promise<EnrichedMatch[]> => {
  console.log("[DB Service] Obteniendo partidos finalizados para el módulo de caja...");
  try {
    const matchesRef = ref(db, 'matches');
    const q = query(matchesRef, orderByChild('status'), equalTo('finished'));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron partidos finalizados.");
      return [];
    }

    const matchesData = snapshot.val();
    const finishedMatches: Match[] = Object.keys(matchesData).map(key => ({
      id: key,
      ...matchesData[key]
    }));

    // --- Enriquecimiento de Datos ---
    const teamIds = new Set<string>();
    const tournamentIds = new Set<string>();

    finishedMatches.forEach(match => {
      teamIds.add(match.homeTeamId);
      teamIds.add(match.awayTeamId);
      tournamentIds.add(match.tournamentId);
    });

    // Obtener datos de equipos y torneos en paralelo
    const teamsPromises = [...teamIds].map(id => get(ref(db, `teams/${id}`)));
    const tournamentsPromises = [...tournamentIds].map(id => get(ref(db, `tournaments/${id}`)));

    const [teamsSnapshots, tournamentsSnapshots] = await Promise.all([
      Promise.all(teamsPromises),
      Promise.all(tournamentsPromises)
    ]);

    // Crear mapas para búsqueda rápida (O(1))
    const teamsMap = new Map(teamsSnapshots.map(snap => [snap.key, snap.val()]));
    const tournamentsMap = new Map(tournamentsSnapshots.map(snap => [snap.key, snap.val()]));

    const enrichedMatches: EnrichedMatch[] = finishedMatches.map(match => {
      const homeTeam = teamsMap.get(match.homeTeamId);
      const awayTeam = teamsMap.get(match.awayTeamId);
      const tournament = tournamentsMap.get(match.tournamentId);

      return {
        ...match,
        tournamentName: tournament?.name || 'Torneo Desconocido',
        homeTeamName: homeTeam?.name || 'Equipo Desconocido',
        homeTeamLogo: homeTeam?.logoUrl || '/logo-placeholder.png',
        awayTeamName: awayTeam?.name || 'Equipo Desconocido',
        awayTeamLogo: awayTeam?.logoUrl || '/logo-placeholder.png',
      };
    });
    
    console.log(`[DB Service] Se encontraron y enriquecieron ${enrichedMatches.length} partidos finalizados.`);
    
    // Ordenar por fecha de partido descendente (más recientes primero)
    return enrichedMatches.sort((a, b) => {
      const dateA = a.details?.date ? new Date(a.details.date).getTime() : 0;
      const dateB = b.details?.date ? new Date(b.details.date).getTime() : 0;
      return dateB - dateA;
    });

  } catch (error) {
    console.error("[DB Service] Error crítico al obtener partidos finalizados:", error);
    return [];
  }
};


/**
 * Guarda o actualiza los datos financieros de un partido específico.
 * Marca el partido como procesado financieramente en una operación atómica.
 * @param matchId El ID del partido a actualizar.
 * @param financesData Un objeto MatchFinances completo con los datos a guardar.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const saveMatchFinances = async (matchId: string, financesData: MatchFinances): Promise<void> => {
    console.log(`[DB Service] Guardando finanzas para el partido: ${matchId}`);
    try {
        const updates: { [key: string]: any } = {};
        
        // Guardar los datos financieros completos bajo /matches/{matchId}/finances
        updates[`/matches/${matchId}/finances`] = financesData;
        // Marcar el partido como procesado financieramente
        updates[`/matches/${matchId}/financesProcessed`] = true;

        await update(ref(db), updates);
        console.log(`[DB Service] Finanzas para el partido ${matchId} guardadas exitosamente.`);

    } catch (error) {
        console.error(`[DB Service] Error al guardar finanzas para el partido ${matchId}:`, error);
        throw new Error('No se pudieron guardar los datos financieros del partido.');
    }
};

/**
 * Fetches the complete context required for the Match Stats Dialog.
 * This includes team names, full player lists for both teams (with names),
 * and any existing stats for the match.
 * It's optimized to reduce multiple database calls.
 *
 * @param matchId The ID of the match.
 * @param homeTeamId The ID of the home team.
 * @param awayTeamId The ID of the away team.
 * @returns An object containing all necessary data for the stats dialog.
 */
export const getMatchStatsContext = async (matchId: string, homeTeamId: string, awayTeamId: string) => {

    // 1. Fetch team names, player IDs, and existing stats in parallel
    const [homeTeamSnap, awayTeamSnap, homePlayerIdsSnap, awayPlayerIdsSnap, statsSnap] = await Promise.all([
        get(ref(db, `teams/${homeTeamId}/name`)),
        get(ref(db, `teams/${awayTeamId}/name`)),
        get(ref(db, `teams/${homeTeamId}/players`)),
        get(ref(db, `teams/${awayTeamId}/players`)),
        get(ref(db, `match_stats/${matchId}`))
    ]);

    const homePlayerIds = homePlayerIdsSnap.exists() ? Object.keys(homePlayerIdsSnap.val()) : [];
    const awayPlayerIds = awayPlayerIdsSnap.exists() ? Object.keys(awayPlayerIdsSnap.val()) : [];
    const allPlayerIds = [...new Set([...homePlayerIds, ...awayPlayerIds])];

    // 2. Fetch all player profiles (users and guests) in a single batch
    const playerPromises = allPlayerIds.map(id => {
        const isDni = id.length === 8 && /^\d+$/.test(id);
        const path = isDni ? `guestPlayers/${id}` : `users/${id}`;
        return get(ref(db, path)).then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                return { id, name: data.name || 'Nombre no encontrado' };
            }
            return null;
        });
    });
    
    const playersData = (await Promise.all(playerPromises)).filter((p): p is Player => p !== null);
    const playersMap = new Map(playersData.map(p => [p.id, p]));

    // 3. Separate players back into their teams
    const homePlayers = homePlayerIds.map(id => playersMap.get(id)).filter((p): p is Player => !!p);
    const awayPlayers = awayPlayerIds.map(id => playersMap.get(id)).filter((p): p is Player => !!p);

    // 4. Construct the initial stats object for all players
    const initialStats: MatchStats = {};
    const savedStats = statsSnap.exists() ? statsSnap.val() : {};
    const allPlayers = [...homePlayers, ...awayPlayers];

    allPlayers.forEach(player => {
        if (player && player.id) {
            const playerSavedStats = savedStats[player.id] || {};
            initialStats[player.id] = { goals: 0, yellowCards: 0, redCard: false, mvp: false, ...playerSavedStats };
        }
    });

    // 5. Return the complete context object
    return {
        homeTeam: { name: homeTeamSnap.val() || 'Local', players: homePlayers },
        awayTeam: { name: awayTeamSnap.val() || 'Visitante', players: awayPlayers },
        stats: initialStats,
    };
};

// MODIFICADO: Ahora 'stage' es una propiedad opcional en Match y 'advancesTo' también.
interface PlayoffMatch extends Match {
  stage: string;
  advancesToMatchId?: string;
  advancesToPosition?: 'home' | 'away';
}

/**
 * Crea una serie de partidos de playoffs en la base de datos para un torneo dado,
 * incluyendo la estructura completa del bracket con relaciones entre partidos.
 * @param tournamentId El ID del torneo.
 * @param playoffRounds Las rondas de playoffs generadas, que deben contener los matchups con referencias al siguiente.
 * @returns Una promesa que se resuelve cuando todos los partidos han sido creados.
 */
export const createPlayoffMatches = async (tournamentId: string, playoffRounds: Round[]): Promise<void> => {
  console.log(`[DB Service] Iniciando la creación de partidos de playoffs para el torneo: ${tournamentId}`);

  const updates: { [key: string]: any } = {};
  // Mapa para relacionar el ID de un matchup (ej: "match-0-0") con el ID del partido real que se creará en la DB.
  const matchupIdToDbIdMap = new Map<string, string>();
  // Array temporal para almacenar los objetos de partido antes de añadir las referencias de avance.
  const matchesToCreate: any[] = [];

  // --- 1. Primera Pasada: Generar IDs y crear objetos de partido base ---
  playoffRounds.forEach((round, roundIndex) => {
    round.matchups.forEach(matchup => {
      const newMatchRef = push(ref(db, 'matches'));
      const newMatchId = newMatchRef.key as string;
      matchupIdToDbIdMap.set(matchup.id, newMatchId);

      const newMatch: any = {
        id: newMatchId,
        tournamentId,
        round: roundIndex,
        roundTitle: round.title,
        matchupRef: matchup.id,
        homeTeamId: matchup.home?.id || `winner-${matchup.id.replace('match', 'winner')}`,
        awayTeamId: matchup.away?.id || `winner-${matchup.id.replace('match', 'winner')}`,
        status: 'pending',
        stage: round.title, // La fase del playoff (ej. "Cuartos de Final")
        details: { date: '', time: '', referee: '', videoUrl: '' },
        // Guardamos la referencia al siguiente matchup para usarla en la segunda pasada
        _nextMatchupId: (matchup as any).nextMatchupId,
        _nextMatchupPosition: (matchup as any).nextMatchupPosition,
      };
      matchesToCreate.push(newMatch);
    });
  });

  // --- 2. Segunda Pasada: Añadir las referencias de avance (advancesTo) ---
  matchesToCreate.forEach(match => {
    if (match._nextMatchupId) {
      const nextDbId = matchupIdToDbIdMap.get(match._nextMatchupId);
      if (nextDbId) {
        match.advancesToMatchId = nextDbId;
        match.advancesToPosition = match._nextMatchupPosition;
      }
    }

    // Limpiamos las propiedades temporales
    delete match._nextMatchupId;
    delete match._nextMatchupPosition;
    
    updates[`/matches/${match.id}`] = match;
  });

  if (Object.keys(updates).length === 0) {
    console.log('[DB Service] No se encontraron partidos de playoffs para crear.');
    return;
  }

  try {
    await update(ref(db), updates);
    console.log(`[DB Service] ${Object.keys(updates).length} partidos de playoffs creados exitosamente para el torneo ${tournamentId}.`);
  } catch (error) {
    console.error(`[DB Service] Error al crear partidos de playoffs para el torneo ${tournamentId}:`, error);
    throw new Error('No se pudieron crear los partidos de playoffs.');
  }
};
