import { ref, get, update, child } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match, PlayerStatsInfo, Team, User, GuestPlayer, PlayerStats } from '@/lib/types';

// --- CONSTANTES DE PUNTUACIÓN (sin cambios) ---
const SP_POINTS = {
    WIN: 32,
    DRAW: 20,
    LOSS: -20,
    GOALS_LOW: 10,  // 1-5 goles
    GOALS_HIGH: 20, // 6-10 goles
    YELLOW_CARD: -12,
    RED_CARD: -30,
    MVP: 15,
    COMPETITION_WIN: 200,
};

// --- FUNCIÓN 1: CALCULAR TABLAS DE POSICIONES (sin cambios) ---
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

// --- FUNCIÓN 2: MOTOR DE ESTADÍSTICAS GLOBALES DEL JUGADOR (CORREGIDA Y FINAL) ---
export async function updatePlayerGlobalStats(matchId: string) {
    const dbRef = ref(db);
    const matchSnap = await get(child(dbRef, `matches/${matchId}`));
    const matchStatsSnap = await get(child(dbRef, `match_stats/${matchId}`));

    if (!matchSnap.exists() || !matchStatsSnap.exists()) {
        throw new Error(`No se encontraron datos del partido o sus estadísticas para el ID: ${matchId}`);
    }

    const match: Match = matchSnap.val();
    const matchStats: { [playerId: string]: PlayerStatsInfo } = matchStatsSnap.val();

    if (match.statsProcessed) {
        console.log(`El partido ${matchId} ya fue procesado. No se realizarán más acciones.`);
        return;
    }

    const tournamentSnap = await get(child(dbRef, `tournaments/${match.tournamentId}/name`));
    const tournamentName = tournamentSnap.val() || 'Torneo Desconocido';

    const homeResult = match.result?.home ?? 0;
    const awayResult = match.result?.away ?? 0;
    const playerIds = Object.keys(matchStats);
    const updates: { [key: string]: any } = {};

    const baseStats = { matchesPlayed: 0, goals: 0, assists: 0, mvp: 0 };

    for (const playerId of playerIds) {
        const individualMatchStats = matchStats[playerId];
        const playerInfo = await getPlayerProfileInfo(playerId);
        if (!playerInfo) continue;

        // --- CÁLCULO DE SUDPOINTS ---
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
        if ((individualMatchStats.goals || 0) > 0 && (individualMatchStats.goals || 0) <= 5) pointsChange += SP_POINTS.GOALS_LOW;
        else if ((individualMatchStats.goals || 0) > 5) pointsChange += SP_POINTS.GOALS_HIGH;
        pointsChange += ((individualMatchStats.yellowCards || 0) * SP_POINTS.YELLOW_CARD);
        if (individualMatchStats.redCard) pointsChange += SP_POINTS.RED_CARD;
        if (individualMatchStats.mvp) pointsChange += SP_POINTS.MVP;

        updates[`${playerInfo.path}/sudpoints`] = playerInfo.currentPoints + pointsChange;
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = pointsChange;

        // --- AGREGACIÓN DE ESTADÍSTICAS (CORREGIDO) ---
        const playerStatsSnap = await get(child(dbRef, `playerStats/${playerId}`));
        const currentFullStats: PlayerStats = playerStatsSnap.val() || { totals: { ...baseStats }, byTournament: {} };

        // 2a. Actualizar totales
        const newTotals = { ...(currentFullStats.totals || baseStats) };
        newTotals.matchesPlayed = (newTotals.matchesPlayed || 0) + 1;
        newTotals.goals = (newTotals.goals || 0) + (individualMatchStats.goals || 0);
        newTotals.mvp = (newTotals.mvp || 0) + (individualMatchStats.mvp ? 1 : 0);
        updates[`/playerStats/${playerId}/totals`] = newTotals;

        // 2b. Actualizar stats del torneo
        const currentTournamentStats = currentFullStats.byTournament?.[match.tournamentId] || { ...baseStats, tournamentName: tournamentName };
        const newTournamentStats = {
            ...currentTournamentStats,
            tournamentName: tournamentName,
            matchesPlayed: (currentTournamentStats.matchesPlayed || 0) + 1,
            goals: (currentTournamentStats.goals || 0) + (individualMatchStats.goals || 0),
            mvp: (currentTournamentStats.mvp || 0) + (individualMatchStats.mvp ? 1 : 0),
        };
        updates[`/playerStats/${playerId}/byTournament/${match.tournamentId}`] = newTournamentStats;
    }

    updates[`/matches/${matchId}/statsProcessed`] = true;
    await update(dbRef, updates);
}

// --- FUNCIÓN 3: REVERTIR SUDPOINTS ---
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
        if (!playerInfo) continue; 

        const revertedPoints = playerInfo.currentPoints - sudPointsChange;

        updates[`${playerInfo.path}/sudpoints`] = revertedPoints;
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = null;
    }
    
    updates[`/matches/${matchId}/statsProcessed`] = false;
    await update(ref(db), updates);
}


// --- HELPERS (AYUDANTES) ---
type PlayerProfileInfo = {
    path: string;
    currentPoints: number;
};

const getPlayerProfileInfo = async (playerId: string): Promise<PlayerProfileInfo | null> => {
    let userPath: string | null = null;
    let userData: User | GuestPlayer | null = null;

    const userRef = ref(db, `users/${playerId}`);
    const userSnap = await get(userRef);
    if (userSnap.exists()) {
        userPath = `/users/${playerId}`;
        userData = userSnap.val() as User;
    } else {
        const guestPlayerRef = ref(db, `guestPlayers/${playerId}`);
        const guestPlayerSnap = await get(guestPlayerRef);
        if (guestPlayerSnap.exists()) {
            userPath = `/guestPlayers/${playerId}`;
            userData = guestPlayerSnap.val() as GuestPlayer;
        } else {
          console.warn(`Perfil de jugador no encontrado para ID: ${playerId}.`);
          return null;
        }
    }

    return {
        path: userPath,
        currentPoints: userData.sudpoints || 0
    };
};

const getPlayerTeamId = async (playerId: string, teamIds: string[]): Promise<string | null> => {
    for (const teamId of teamIds) {
        const playerInTeamSnap = await get(ref(db, `teams/${teamId}/players/${playerId}`));
        if (playerInTeamSnap.exists()) return teamId;
    }
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