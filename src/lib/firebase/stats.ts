
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match, PlayerStatsInfo, Team, User, GuestPlayer } from '@/lib/types';

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
// (Sin cambios en esta función)
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

// --- FUNCIÓN 2: ACTUALIZAR SUDPOINTS GLOBALES (MOTOR DE RANKING MEJORADO) ---
export async function updatePlayerGlobalStats(matchId: string) {
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
    const updates: { [key: string]: any } = {};

    for (const playerId of playerIds) {
        const stats = matchStats[playerId];
        const playerTeamId = await getPlayerTeamId(playerId, [match.homeTeamId, match.awayTeamId]);
        if (!playerTeamId) continue;

        let result: 'win' | 'draw' | 'loss';
        if (playerTeamId === match.homeTeamId) {
            result = homeResult > awayResult ? 'win' : homeResult < awayResult ? 'loss' : 'draw';
        } else {
            result = awayResult > homeResult ? 'win' : awayResult < homeResult ? 'loss' : 'draw';
        }

        let pointsChange = 0;
        if (result === 'win') pointsChange += SP_POINTS.WIN;
        if (result === 'draw') pointsChange += SP_POINTS.DRAW;
        if (result === 'loss') pointsChange += SP_POINTS.LOSS;
        if (stats.goals > 0 && stats.goals <= 5) pointsChange += SP_POINTS.GOALS_LOW;
        else if (stats.goals > 5) pointsChange += SP_POINTS.GOALS_HIGH;
        pointsChange += ((stats.yellowCards || 0) * SP_POINTS.YELLOW_CARD);
        if (stats.redCard) pointsChange += SP_POINTS.RED_CARD;
        if (stats.mvp) pointsChange += SP_POINTS.MVP;

        const playerInfo = await getPlayerProfileInfo(playerId);
        if (!playerInfo) continue; // Jugador no encontrado en /users ni en /guestPlayers

        const newTotalPoints = playerInfo.currentPoints + pointsChange;

        updates[`${playerInfo.path}/sudpoints`] = newTotalPoints;
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = pointsChange;
    }

    updates[`/matches/${matchId}/statsProcessed`] = true;
    await update(ref(db), updates);
}

// --- FUNCIÓN 3: REVERTIR SUDPOINTS (MOTOR DE REVERSIÓN MEJORADO) ---
export async function revertMatchStats(matchId: string) {
    const matchStatsSnap = await get(ref(db, `match_stats/${matchId}`));
    if (!matchStatsSnap.exists()) return;
    
    const matchStats: { [playerId: string]: PlayerStatsInfo } = matchStatsSnap.val();
    const playerIds = Object.keys(matchStats);
    const updates: { [key: string]: any } = {};

    for (const playerId of playerIds) {
        const sudPointsChange = matchStats[playerId]?.sudPointsChange;
        if (typeof sudPointsChange !== 'number') continue;

        const playerInfo = await getPlayerProfileInfo(playerId);
        if (!playerInfo) continue; // Jugador no encontrado

        const revertedPoints = playerInfo.currentPoints - sudPointsChange;

        updates[`${playerInfo.path}/sudpoints`] = revertedPoints;
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = null;
    }
    
    updates[`/matches/${matchId}/statsProcessed`] = false;
    await update(ref(db), updates);
}


// --- HELPERS (AYUDANTES) ---

// NUEVO HELPER "DETECTIVE"
type PlayerProfileInfo = {
    path: string;
    currentPoints: number;
};

const getPlayerProfileInfo = async (playerId: string): Promise<PlayerProfileInfo | null> => {
    // 1. Buscar en usuarios registrados
    const userRef = ref(db, `users/${playerId}`);
    const userSnap = await get(userRef);
    if (userSnap.exists()) {
        const userData = userSnap.val() as User;
        return {
            path: `/users/${playerId}`,
            currentPoints: userData.sudpoints || 0
        };
    }

    // 2. Si no, buscar en jugadores invitados
    const guestPlayerRef = ref(db, `guestPlayers/${playerId}`);
    const guestPlayerSnap = await get(guestPlayerRef);
    if (guestPlayerSnap.exists()) {
        const guestPlayerData = guestPlayerSnap.val() as GuestPlayer;
        return {
            path: `/guestPlayers/${playerId}`,
            currentPoints: guestPlayerData.sudpoints || 0
        };
    }

    // 3. Jugador no encontrado en ninguna colección
    console.warn(`Perfil de jugador no encontrado para ID: ${playerId}. Se buscó en /users y /guestPlayers.`);
    return null;
};


const getPlayerTeamId = async (playerId: string, teamIds: string[]): Promise<string | null> => {
    for (const teamId of teamIds) {
        const playerInTeamSnap = await get(ref(db, `teams/${teamId}/players/${playerId}`));
        if (playerInTeamSnap.exists()) return teamId;
    }
    // Fallback por si no está en la lista del equipo (ej. error de carga inicial)
    const userSnap = await get(ref(db, `users/${playerId}`));
    if(userSnap.exists()){
        const userData = userSnap.val() as User;
        if(userData.team && teamIds.includes(userData.team.id)){
            return userData.team.id;
        }
    }
    const guestSnap = await get(ref(db, `guestPlayers/${playerId}`));
    if(guestSnap.exists()){
        const guestData = guestSnap.val() as GuestPlayer;
        if(guestData.teamId && teamIds.includes(guestData.teamId)){
            return guestData.teamId;
        }
    }
    return null;
};
