'use client';
import { ref, get, update, child } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Match, PlayerStatsInfo, Team, User, GuestPlayer, PlayerStats, MatchStats } from '@/lib/types';

// --- CONSTANTES DE PUNTUACIÓN ---
const SP_POINTS = {
    WIN: 32,
    DRAW: 20,
    LOSS: -20,
    GOALS_LOW: 10,
    GOALS_HIGH: 20,
    YELLOW_CARD: -12,
    RED_CARD: -30,
    MVP: 15,
    COMPETITION_WIN: 200,
};

// --- HELPER: OBTENER NOMBRES DE JUGADORES EN LOTE ---
async function getPlayerNames(playerIds: Set<string>, dbRef: any): Promise<Map<string, string>> {
    const namesMap = new Map<string, string>();
    const promises = Array.from(playerIds).map(async (id) => {
        const userSnap = await get(child(dbRef, `users/${id}`));
        if (userSnap.exists()) {
            namesMap.set(id, userSnap.val().name || 'Usuario sin nombre');
            return;
        }
        const guestSnap = await get(child(dbRef, `guestPlayers/${id}`));
        if (guestSnap.exists()) {
            namesMap.set(id, guestSnap.val().name || 'Invitado sin nombre');
            return;
        }
        namesMap.set(id, 'Jugador Desconocido');
    });
    await Promise.all(promises);
    return namesMap;
}

// --- FUNCIÓN 1: CALCULAR ESTADÍSTICAS COMPLETAS DEL TORNEO ---
export async function calculateTournamentStats(tournamentId: string, teams: Team[]) {
    const dbRef = ref(db);
    const matchesSnap = await get(child(dbRef, 'matches'));
    const allMatches = matchesSnap.val() || {};

    const finishedMatches = Object.entries(allMatches)
        .filter(([, m]: [string, any]) => m.tournamentId === tournamentId && m.status === 'finished')
        .map(([id, data]) => ({ ...(data as Match), id }));

    const allPlayerIds = new Set<string>();
    const matchStatsMap = new Map<string, { [playerId: string]: PlayerStatsInfo }>();
    for (const match of finishedMatches) {
        const matchStatsSnap = await get(child(dbRef, `match_stats/${match.id}`));
        if (matchStatsSnap.exists()) {
            const stats: { [playerId: string]: PlayerStatsInfo } = matchStatsSnap.val();
            matchStatsMap.set(match.id, stats);
            Object.keys(stats).forEach(playerId => allPlayerIds.add(playerId));
        }
    }

    const playerNames = await getPlayerNames(allPlayerIds, dbRef);

    const teamStats: { [teamId: string]: any } = teams.reduce((acc, team) => ({
        ...acc,
        [team.id]: { teamId: team.id, teamName: team.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, gc: 0, dg: 0, points: 0 }
    }), {});
    const scorersData: { [playerId: string]: any } = {};
    const sanctionsData: { [playerId: string]: any } = {};

    for (const match of finishedMatches) {
        const homeScore = match.result?.home ?? 0;
        const awayScore = match.result?.away ?? 0;
        const home = teamStats[match.homeTeamId];
        const away = teamStats[match.awayTeamId];

        if (home) { home.played++; home.gf += homeScore; home.gc += awayScore; }
        if (away) { away.played++; away.gf += awayScore; away.gc += homeScore; }
        if (homeScore > awayScore) { if (home) { home.won++; home.points += 3; } if (away) { away.lost++; } } 
        else if (awayScore > homeScore) { if (away) { away.won++; away.points += 3; } if (home) { home.lost++; } } 
        else { if (home) { home.drawn++; home.points += 1; } if (away) { away.drawn++; away.points += 1; } }

        const matchStats = matchStatsMap.get(match.id);
        if (matchStats) {
            for (const playerId in matchStats) {
                const stats = matchStats[playerId];
                const playerTeam = teams.find(t => t.players && t.players[playerId]);

                if (stats.goals && stats.goals > 0) {
                    if (!scorersData[playerId]) {
                        scorersData[playerId] = { playerInfo: { id: playerId, name: playerNames.get(playerId) || 'N/A' }, teamId: playerTeam?.id || 'N/A', teamName: playerTeam?.name || 'N/A', goals: 0 };
                    }
                    scorersData[playerId].goals += stats.goals;
                }

                if ((stats.yellowCards && stats.yellowCards > 0) || stats.redCard) {
                    if (!sanctionsData[playerId]) {
                        sanctionsData[playerId] = { playerInfo: { id: playerId, name: playerNames.get(playerId) || 'N/A' }, teamId: playerTeam?.id || 'N/A', teamName: playerTeam?.name || 'N/A', yellowCards: 0, redCards: 0 };
                    }
                    sanctionsData[playerId].yellowCards += (stats.yellowCards || 0);
                    if (stats.redCard) sanctionsData[playerId].redCards += 1;
                }
            }
        }
    }

    Object.values(teamStats).forEach(t => { t.dg = t.gf - t.gc; });
    const sortedPositions = Object.values(teamStats).sort((a, b) => b.points - a.points || b.dg - a.dg || b.gf - a.gf);
    const sortedScorers = Object.values(scorersData).sort((a, b) => b.goals - a.goals);
    const sortedSanctions = Object.values(sanctionsData).sort((a, b) => b.redCards - a.redCards || b.yellowCards - a.yellowCards);

    const updates = {
        [`/tournament_stats/${tournamentId}/positions`]: sortedPositions,
        [`/tournament_stats/${tournamentId}/scorers`]: sortedScorers,
        [`/tournament_stats/${tournamentId}/sanctions`]: sortedSanctions,
    };

    await update(ref(db), updates);
}

// --- FUNCIÓN 2: MOTOR DE ESTADÍSTICAS GLOBALES DEL JUGADOR ---
export async function updatePlayerGlobalStats(matchId: string, tournamentId: string, tournamentName: string) {
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

    const homeResult = match.result?.home ?? 0;
    const awayResult = match.result?.away ?? 0;
    const playerIds = Object.keys(matchStats);
    const updates: { [key: string]: any } = {};

    const baseStats = { matchesPlayed: 0, goals: 0, assists: 0, mvp: 0 };

    for (const playerId of playerIds) {
        const individualMatchStats = matchStats[playerId];
        const playerInfo = await getPlayerProfileInfo(playerId);
        if (!playerInfo) continue;

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

        updates[`${playerInfo.path}/sudpoints`] = (playerInfo.currentPoints || 0) + pointsChange;
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = pointsChange;

        const playerStatsSnap = await get(child(dbRef, `playerStats/${playerId}`));
        const currentFullStats: PlayerStats = playerStatsSnap.val() || { totals: { ...baseStats }, byTournament: {} };

        const newTotals = { ...(currentFullStats.totals || baseStats) };
        newTotals.matchesPlayed = (newTotals.matchesPlayed || 0) + 1;
        newTotals.goals = (newTotals.goals || 0) + (individualMatchStats.goals || 0);
        newTotals.mvp = (newTotals.mvp || 0) + (individualMatchStats.mvp ? 1 : 0);
        updates[`/playerStats/${playerId}/totals`] = newTotals;

        const currentTournamentStats = currentFullStats.byTournament?.[match.tournamentId] || { ...baseStats, tournamentName: tournamentName };
        const newTournamentStats = {
            ...currentTournamentStats,
            tournamentName: tournamentName,
            matchesPlayed: (currentTournamentStats.matchesPlayed || 0) + 1,
            goals: (currentTournamentStats.goals || 0) + (individualMatchStats.goals || 0),
            mvp: (currentTournamentStats.mvp || 0) + (individualMatchStats.mvp ? 1 : 0),
        };
        updates[`/playerStats/${playerId}/byTournament/${tournamentId}`] = newTournamentStats;
    }

    updates[`/matches/${matchId}/statsProcessed`] = true;
    await update(dbRef, updates);
}

// --- FUNCIÓN 3: REVERTIR ESTADÍSTICAS GLOBALES (CORREGIDA) ---
export async function revertMatchStats(matchId: string, tournamentId: string) {
    const dbRef = ref(db);
    const matchSnap = await get(child(dbRef, `matches/${matchId}`));
    const matchStatsSnap = await get(child(dbRef, `match_stats/${matchId}`));

    if (!matchSnap.exists() || !matchStatsSnap.exists()) {
        console.error(`Error de reversión: No se encontraron datos para el partido ${matchId}`);
        return;
    }

    const match: Match = matchSnap.val();
    const matchStats: { [playerId: string]: PlayerStatsInfo } = matchStatsSnap.val();
    const playerIds = Object.keys(matchStats);
    const updates: { [key: string]: any } = {};

    for (const playerId of playerIds) {
        const individualMatchStats = matchStats[playerId];
        if (!individualMatchStats) continue;

        const sudPointsChange = individualMatchStats.sudPointsChange;
        if (typeof sudPointsChange === 'number') {
            const playerInfo = await getPlayerProfileInfo(playerId);
            if (playerInfo) {
                updates[`${playerInfo.path}/sudpoints`] = (playerInfo.currentPoints || 0) - sudPointsChange;
            }
        }

        const playerStatsSnap = await get(child(dbRef, `playerStats/${playerId}`));
        if (playerStatsSnap.exists()) {
            const currentFullStats: PlayerStats = playerStatsSnap.val();

            const newTotals = { ...(currentFullStats.totals || {}) };
            newTotals.matchesPlayed = Math.max(0, (newTotals.matchesPlayed || 0) - 1);
            newTotals.goals = Math.max(0, (newTotals.goals || 0) - (individualMatchStats.goals || 0));
            newTotals.mvp = Math.max(0, (newTotals.mvp || 0) - (individualMatchStats.mvp ? 1 : 0));
            updates[`/playerStats/${playerId}/totals`] = newTotals;

            if (currentFullStats.byTournament && currentFullStats.byTournament[tournamentId]) {
                const currentTournamentStats = currentFullStats.byTournament[tournamentId];
                const newTournamentStats = { ...currentTournamentStats };
                newTournamentStats.matchesPlayed = Math.max(0, (newTournamentStats.matchesPlayed || 0) - 1);
                newTournamentStats.goals = Math.max(0, (newTournamentStats.goals || 0) - (individualMatchStats.goals || 0));
                newTournamentStats.mvp = Math.max(0, (newTournamentStats.mvp || 0) - (individualMatchStats.mvp ? 1 : 0));
                updates[`/playerStats/${playerId}/byTournament/${tournamentId}`] = newTournamentStats;
            }
        }
        
        updates[`/match_stats/${matchId}/${playerId}/sudPointsChange`] = null;
    }
    
    updates[`/matches/${matchId}/statsProcessed`] = false;
    
    await update(dbRef, updates);
    console.log(`Reversión completada para el partido ${matchId}`);
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

/**
 * Guarda la planilla de un partido, calcula el resultado final y cierra el partido.
 * Esta es la función centralizada que reemplaza la lógica anterior.
 *
 * @param matchId El ID del partido.
 * @param stats La planilla con las estadísticas de los jugadores.
 * @param homeTeamId El ID del equipo local para poder calcular el marcador.
 */
export const saveMatchStatsAndRecalculate = async (matchId: string, stats: MatchStats, homeTeamId: string) => {
    const homePlayersSnap = await get(ref(db, `teams/${homeTeamId}/players`));
    if (!homePlayersSnap.exists()) {
        throw new Error(`No se encontró la lista de jugadores para el equipo local ${homeTeamId}.`);
    }
    const homePlayerIds = Object.keys(homePlayersSnap.val());

    let homeScore = 0;
    let awayScore = 0;

    for (const playerId in stats) {
        const playerGoals = stats[playerId].goals || 0;
        if (homePlayerIds.includes(playerId)) {
            homeScore += playerGoals;
        } else {
            awayScore += playerGoals;
        }
    }

    const updates: { [key: string]: any } = {};
    updates[`/match_stats/${matchId}`] = stats;
    updates[`/matches/${matchId}/result`] = { home: homeScore, away: awayScore };
    updates[`/matches/${matchId}/status`] = 'finished';
    
    await update(ref(db), updates);
};
