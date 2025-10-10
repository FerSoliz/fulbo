
import { ref, get, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match, PlayerStatsInfo, Team, User } from '@/lib/types';

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
// Esta función se mantiene igual, ya que maneja las tablas de posiciones, goleadores, etc.
export async function calculateTournamentStats(tournamentId: string, teams: Team[]) {
    const matchesRef = ref(db, 'matches');
    const matchesSnap = await get(matchesRef);
    const allMatches = matchesSnap.val() || {};

    const finishedMatches = Object.values(allMatches).filter((m: any) => m.tournamentId === tournamentId && m.status === 'finished') as Match[];

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

    await update(ref(db), { [`/tournament_stats/${tournamentId}/positions`]: sortedPositions });

}

// --- FUNCIÓN 2: ACTUALIZAR SUDPOINTS GLOBALES DE JUGADORES (MOTOR DE RANKING) ---
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
    const updates: { [key: string]: any } = {}; // Objeto para la actualización atómica

    for (const playerId of playerIds) {
        const stats = matchStats[playerId];
        const playerTeamId = await getPlayerTeamId(playerId, [match.homeTeamId, match.awayTeamId]);
        if (!playerTeamId) continue;

        let result: 'win' | 'draw' | 'loss';
        if (playerTeamId === match.homeTeamId) {
            if (homeResult > awayResult) result = 'win';
            else if (homeResult < awayResult) result = 'loss';
            else result = 'draw';
        } else {
            if (awayResult > homeResult) result = 'win';
            else if (awayResult < homeResult) result = 'loss';
            else result = 'draw';
        }

        // 1. Calcular SudPoints para ESTE partido
        let pointsChange = 0;
        if (result === 'win') pointsChange += SP_POINTS.WIN;
        if (result === 'draw') pointsChange += SP_POINTS.DRAW;
        if (result === 'loss') pointsChange += SP_POINTS.LOSS;
        if (stats.goals > 0 && stats.goals <= 5) pointsChange += SP_POINTS.GOALS_LOW;
        else if (stats.goals > 5) pointsChange += SP_POINTS.GOALS_HIGH;
        pointsChange += ((stats.yellowCards || 0) * SP_POINTS.YELLOW_CARD);
        if (stats.redCard) pointsChange += SP_POINTS.RED_CARD;
        if (stats.mvp) pointsChange += SP_POINTS.MVP;

        // 2. Preparar la actualización del perfil de usuario
        const userRef = ref(db, `users/${playerId}`);
        const userSnap = await get(userRef);
        const currentUser = userSnap.val() as User;
        const currentPoints = currentUser?.sudpoints || 0;
        const newTotalPoints = currentPoints + pointsChange;

        updates[`/users/${playerId}/sudpoints`] = newTotalPoints;
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = pointsChange; // Guardamos el delta para la reversión
    }

    // 3. Marcar el partido como procesado
    updates[`/matches/${matchId}/statsProcessed`] = true;

    // 4. Ejecutar todas las actualizaciones de forma atómica
    await update(ref(db), updates);
}

// --- FUNCIÓN 3: REVERTIR SUDPOINTS DE UN PARTIDO (EL "DESHACER") ---
export async function revertMatchStats(matchId: string, tournamentId: string) {
    const matchStatsSnap = await get(ref(db, `match_stats/${matchId}`));
    if (!matchStatsSnap.exists()) return; // No hay stats, no hay nada que revertir.
    
    const matchStats: { [playerId: string]: PlayerStatsInfo } = matchStatsSnap.val();
    const playerIds = Object.keys(matchStats);
    const updates: { [key: string]: any } = {}; // Objeto para la actualización atómica

    for (const playerId of playerIds) {
        const playerMatchStats = matchStats[playerId];
        const sudPointsChange = playerMatchStats.sudPointsChange;

        // Si por alguna razón no se guardó el cambio de puntos, no podemos revertir
        if (typeof sudPointsChange !== 'number') continue;

        const userRef = ref(db, `users/${playerId}`);
        const userSnap = await get(userRef);
        if (!userSnap.exists()) continue;

        const currentUser = userSnap.val() as User;
        const currentPoints = currentUser.sudpoints || 0;
        const revertedPoints = currentPoints - sudPointsChange; // Revertimos la operación

        updates[`/users/${playerId}/sudpoints`] = revertedPoints;
        // Eliminamos el registro para no poder revertir dos veces
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = null; 
    }
    
    // También marcamos el partido para que pueda ser procesado de nuevo
    updates[`/matches/${matchId}/statsProcessed`] = false;

    // Ejecutar todas las actualizaciones de forma atómica
    await update(ref(db), updates);
}


// --- HELPERS --- 

const getPlayerTeamId = async (playerId: string, teamIds: string[]): Promise<string | null> => {
    for (const teamId of teamIds) {
        const playerInTeamSnap = await get(ref(db, `teams/${teamId}/players/${playerId}`));
        if (playerInTeamSnap.exists()) return teamId;
    }
    // Fallback: Check user profile if not in team roster (e.g. guest player)
    const userSnap = await get(ref(db, `users/${playerId}`));
    if(userSnap.exists()){
        const userData = userSnap.val() as User;
        if(userData.team && teamIds.includes(userData.team.id)){
            return userData.team.id;
        }
    }
    return null;
};
