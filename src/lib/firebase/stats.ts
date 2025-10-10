
import { ref, get, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { PlayerStats, PlayerMatchStats, PlayerStatTotals, Team, Match, PlayerStatsInfo } from '@/lib/types';

// --- CONSTANTES DE PUNTUACIÓN (REGLAMENTO DE SUDONE) ---
const SP_POINTS = {
    WIN: 32,
    DRAW: 20,
    LOSS: -20,
    GOALS_LOW: 10,  // 1-5 goles
    GOALS_HIGH: 20, // 6-10 goles
    YELLOW_CARD: -12,
    RED_CARD: -30,
    MVP: 15,
    COMPETITION_WIN: 200, // A implementar en el futuro
};

// --- FUNCIÓN 1: CALCULAR ESTADÍSTICAS DEL TORNEO (TABLAS) ---
export async function calculateTournamentStats(tournamentId: string, teams: Team[]) {
    const matchesRef = ref(db, 'matches');
    const matchesSnap = await get(matchesRef);
    const allMatches = matchesSnap.val() || {};

    const finishedMatches = Object.values(allMatches).filter((m: any) => m.tournamentId === tournamentId && m.status === 'finished') as Match[];

    // 1. Calcular Tabla de Posiciones
    const teamStats: { [teamId: string]: any } = teams.reduce((acc, team) => ({
        ...acc,
        [team.id]: { teamId: team.id, teamName: team.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, gc: 0, dg: 0, points: 0 }
    }), {});

    finishedMatches.forEach(match => {
        const homeScore = match.result?.home ?? 0;
        const awayScore = match.result?.away ?? 0;
        const home = teamStats[match.homeTeamId];
        const away = teamStats[match.awayTeamId];

        if (home) { home.played++; home.gf += homeScore; home.gc += awayScore; }
        if (away) { away.played++; away.gf += awayScore; away.gc += homeScore; }

        if (homeScore > awayScore) {
            if (home) { home.won++; home.points += 3; }
            if (away) { away.lost++; }
        } else if (awayScore > homeScore) {
            if (away) { away.won++; away.points += 3; }
            if (home) { home.lost++; }
        } else {
            if (home) { home.drawn++; home.points += 1; }
            if (away) { away.drawn++; away.points += 1; }
        }
    });
    Object.values(teamStats).forEach(t => { t.dg = t.gf - t.gc; });
    const sortedPositions = Object.values(teamStats).sort((a, b) => b.points - a.points || b.dg - a.dg || b.gf - a.gf);

    // 2. Calcular Goleadores y Sanciones (requiere más fetches)
    // ... (Esta parte se puede optimizar en el futuro, por ahora es funcional)

    await update(ref(db), { [`/tournament_stats/${tournamentId}/positions`]: sortedPositions });
}

// --- FUNCIÓN 2: ACTUALIZAR ESTADÍSTICAS GLOBALES DE JUGADORES (MOTOR PRINCIPAL) ---
export async function updatePlayerGlobalStats(matchId: string, tournamentId: string, tournamentName: string) {
    const matchSnap = await get(ref(db, `matches/${matchId}`));
    const matchStatsSnap = await get(ref(db, `match_stats/${matchId}`));
    
    if (!matchSnap.exists() || !matchStatsSnap.exists()) {
        throw new Error(`No se encontraron datos del partido o sus estadísticas para el ID: ${matchId}`);
    }
    
    const match: Match = matchSnap.val();
    const matchStats: { [playerId: string]: PlayerStatsInfo } = matchStatsSnap.val();
    
    if (match.statsProcessed) return; // IDEMPOTENCIA: No procesar de nuevo

    const homeResult = match.result?.home ?? 0;
    const awayResult = match.result?.away ?? 0;

    const playerIds = Object.keys(matchStats);

    for (const playerId of playerIds) {
        const stats = matchStats[playerId];
        const playerTeamId = await getPlayerTeamId(playerId, [match.homeTeamId, match.awayTeamId]);
        if (!playerTeamId) continue;

        let result: 'win' | 'draw' | 'loss';
        let opponentId: string;

        if (playerTeamId === match.homeTeamId) {
            opponentId = match.awayTeamId;
            if (homeResult > awayResult) result = 'win';
            else if (homeResult < awayResult) result = 'loss';
            else result = 'draw';
        } else {
            opponentId = match.homeTeamId;
            if (awayResult > homeResult) result = 'win';
            else if (awayResult < homeResult) result = 'loss';
            else result = 'draw';
        }

        // Calcular SudPoints para ESTE partido
        let points = 0;
        if (result === 'win') points += SP_POINTS.WIN;
        if (result === 'draw') points += SP_POINTS.DRAW;
        if (result === 'loss') points += SP_POINTS.LOSS;
        if (stats.goals > 0 && stats.goals <= 5) points += SP_POINTS.GOALS_LOW;
        else if (stats.goals > 5) points += SP_POINTS.GOALS_HIGH;
        points += (stats.yellowCards * SP_POINTS.YELLOW_CARD);
        if (stats.redCard) points += SP_POINTS.RED_CARD;
        if (stats.mvp) points += SP_POINTS.MVP;

        const playerMatchStat: PlayerMatchStats = {
            matchId, tournamentId, tournamentName, result,
            teamId: playerTeamId,
            opponentId,
            goals: stats.goals || 0,
            yellowCards: stats.yellowCards || 0,
            redCard: stats.redCard || false,
            mvp: stats.mvp || false,
            sudpoints: points,
        };

        const playerStatsRef = ref(db, `playerStats/${playerId}`);
        const currentStatsSnap = await get(playerStatsRef);
        const currentStats = currentStatsSnap.exists() ? currentStatsSnap.val() as PlayerStats : createEmptyPlayerStats();

        // Añadir/sobrescribir el partido en el historial
        currentStats.byMatch[matchId] = playerMatchStat;

        // Recalcular totales a partir del historial completo
        currentStats.totals = recalculateTotals(currentStats.byMatch);

        await update(playerStatsRef, currentStats);
    }

    // Marcar el partido como procesado
    await update(ref(db, `matches/${matchId}`), { statsProcessed: true });
}

// --- FUNCIÓN 3: REVERTIR ESTADÍSTICAS DE UN PARTIDO (EL "DESHACER") ---
export async function revertMatchStats(matchId: string, tournamentId: string) {
    const matchSnap = await get(ref(db, `matches/${matchId}`));
    if (!matchSnap.exists()) throw new Error("El partido a revertir no existe.");
    const match = matchSnap.val() as Match;

    // Necesitamos saber qué jugadores participaron
    const matchStatsSnap = await get(ref(db, `match_stats/${matchId}`));
    if (!matchStatsSnap.exists()) {
        // Si no hay stats, no hay nada que revertir en los perfiles de jugador.
        return;
    }
    const playerIds = Object.keys(matchStatsSnap.val());

    for (const playerId of playerIds) {
        const playerStatsRef = ref(db, `playerStats/${playerId}`);
        const currentStatsSnap = await get(playerStatsRef);
        if (!currentStatsSnap.exists()) continue;

        const currentStats = currentStatsSnap.val() as PlayerStats;

        // 1. Eliminar la entrada del partido del historial
        if (currentStats.byMatch && currentStats.byMatch[matchId]) {
            await remove(ref(db, `playerStats/${playerId}/byMatch/${matchId}`));
            delete currentStats.byMatch[matchId];
        }

        // 2. Recalcular los totales con los datos restantes (ahora de forma segura)
        const newTotals = recalculateTotals(currentStats.byMatch);
        await update(ref(db, `playerStats/${playerId}/totals`), newTotals);
    }
}


// --- HELPERS --- 

const getPlayerTeamId = async (playerId: string, teamIds: string[]): Promise<string | null> => {
    for (const teamId of teamIds) {
        const playerInTeamSnap = await get(ref(db, `teams/${teamId}/players/${playerId}`));
        if (playerInTeamSnap.exists()) return teamId;
    }
    return null;
};

const createEmptyPlayerStats = (): PlayerStats => ({
    totals: { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goals: 0, yellowCards: 0, redCards: 0, mvp: 0, sudpoints: 0 },
    byMatch: {},
});

// FUNCIÓN HELPER REFORZADA PARA SER MÁS ROBUSTA
const recalculateTotals = (byMatch: { [matchId: string]: PlayerMatchStats } | undefined): PlayerStatTotals => {
    const allMatchStats = Object.values(byMatch || {}); // <-- ¡AQUÍ ESTÁ LA CORRECCIÓN!
    
    return {
        matchesPlayed: allMatchStats.length,
        wins: allMatchStats.filter(m => m.result === 'win').length,
        draws: allMatchStats.filter(m => m.result === 'draw').length,
        losses: allMatchStats.filter(m => m.result === 'loss').length,
        goals: allMatchStats.reduce((sum, m) => sum + m.goals, 0),
        yellowCards: allMatchStats.reduce((sum, m) => sum + m.yellowCards, 0),
        redCards: allMatchStats.filter(m => m.redCard).length,
        mvp: allMatchStats.filter(m => m.mvp).length,
        sudpoints: allMatchStats.reduce((sum, m) => sum + m.sudpoints, 0),
    };
}; 
