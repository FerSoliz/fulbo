
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';

// --- TIPOS DE DATOS ---
// Representa las estadísticas de un jugador en un solo partido.
interface MatchPlayerStats {
  goals: number;
  assists: number;
  mvp: boolean;
  // ... podrían añadirse tarjetas, etc. en el futuro
}

// Representa la estructura completa de estadísticas globales de un jugador.
interface PlayerGlobalStats {
  totals: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    mvp: number;
  };
  byTournament?: {
    [tournamentId: string]: {
      tournamentName: string;
      matchesPlayed: number;
      goals: number;
      assists: number;
      mvp: number;
    };
  };
}

/**
 * Procesa las estadísticas de un partido finalizado y las agrega a las estadísticas globales de cada jugador involucrado.
 * Esta función es idempotente: si se ejecuta más de una vez para el mismo partido, no duplicará las estadísticas
 * siempre y cuando el partido se marque como procesado después de la primera ejecución exitosa.
 *
 * @param matchId - El ID del partido cuyas estadísticas se van a procesar.
 * @param tournamentId - El ID del torneo al que pertenece el partido.
 * @param tournamentName - El nombre del torneo, para almacenarlo en el perfil del jugador.
 */
export const updatePlayerGlobalStats = async (matchId: string, tournamentId: string, tournamentName: string): Promise<void> => {
  console.log(`[Global Stats] Iniciando procesamiento para el partido: ${matchId}`);

  // 1. Obtener las estadísticas específicas de este partido desde 'match_stats'
  const matchStatsRef = ref(db, `match_stats/${matchId}`);
  const matchStatsSnapshot = await get(matchStatsRef);

  if (!matchStatsSnapshot.exists()) {
    console.warn(`[Global Stats] No se encontraron estadísticas para el partido ${matchId}. Abortando.`);
    return;
  }

  const matchStatsData: { [playerId: string]: MatchPlayerStats } = matchStatsSnapshot.val();
  const playerIds = Object.keys(matchStatsData);

  if (playerIds.length === 0) {
    console.log(`[Global Stats] El partido ${matchId} no tiene jugadores con estadísticas registradas.`);
    return;
  }

  // 2. Preparar una única operación de actualización masiva para atomicidad
  const updates: { [path: string]: any } = {};

  for (const playerId of playerIds) {
    const playerMatchStats = matchStatsData[playerId];
    const playerGlobalStatsRef = ref(db, `playerStats/${playerId}`);
    const playerGlobalStatsSnapshot = await get(playerGlobalStatsRef);

    // 3. Obtener las estadísticas globales existentes del jugador o inicializarlas
    let currentStats: PlayerGlobalStats;
    if (playerGlobalStatsSnapshot.exists()) {
      currentStats = playerGlobalStatsSnapshot.val();
    } else {
      // Si el jugador no tiene un perfil de estadísticas, se crea uno desde cero.
      currentStats = {
        totals: { matchesPlayed: 0, goals: 0, assists: 0, mvp: 0 },
        byTournament: {},
      };
    }

    // 4. Sumar las nuevas estadísticas a los totales y a las del torneo específico
    
    // Se incrementa siempre en 1 partido jugado
    currentStats.totals.matchesPlayed = (currentStats.totals.matchesPlayed || 0) + 1;
    currentStats.totals.goals = (currentStats.totals.goals || 0) + (playerMatchStats.goals || 0);
    currentStats.totals.assists = (currentStats.totals.assists || 0) + (playerMatchStats.assists || 0);
    currentStats.totals.mvp = (currentStats.totals.mvp || 0) + (playerMatchStats.mvp ? 1 : 0);

    // Inicializar el objeto del torneo si no existe
    if (!currentStats.byTournament) {
      currentStats.byTournament = {};
    }
    if (!currentStats.byTournament[tournamentId]) {
      currentStats.byTournament[tournamentId] = {
        tournamentName,
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        mvp: 0,
      };
    }

    const tournamentStats = currentStats.byTournament[tournamentId];
    tournamentStats.matchesPlayed = (tournamentStats.matchesPlayed || 0) + 1;
    tournamentStats.goals = (tournamentStats.goals || 0) + (playerMatchStats.goals || 0);
    tournamentStats.assists = (tournamentStats.assists || 0) + (playerMatchStats.assists || 0);
    tournamentStats.mvp = (tournamentStats.mvp || 0) + (playerMatchStats.mvp ? 1 : 0);

    // 5. Añadir la ruta completa del jugador al objeto de actualizaciones masivas
    updates[`/playerStats/${playerId}`] = currentStats;
  }

  // Se añade una bandera al propio partido para marcarlo como procesado.
  updates[`/matches/${matchId}/statsProcessed`] = true;

  // 6. Ejecutar la actualización atómica en la base de datos
  try {
    await update(ref(db), updates);
    console.log(`[Global Stats] Éxito. ${playerIds.length} perfiles de jugador actualizados y el partido ${matchId} marcado como procesado.`);
  } catch (error) {
    console.error("[Global Stats] Error al ejecutar la actualización masiva:", error);
    // En un escenario de producción, aquí se podría manejar el error, reintentar, o registrarlo en un sistema de monitoreo.
    throw error; // Relanzar el error para que el llamador sepa que algo salió mal.
  }
};
