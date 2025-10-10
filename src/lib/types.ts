
// --- TIPOS GLOBALES DE LA APLICACIÓN ---

// --- ESTADOS Y NAVEGACIÓN ---
export type PageState = 'LOADING' | 'ACCESS_DENIED' | 'NOT_FOUND' | 'READY';

// --- ENTIDADES PRINCIPALES ---
export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    role: 'admin' | 'captain' | 'player';
    team?: { // Desnormalizado para acceso rápido
        id: string;
        name: string;
        crestUrl: string;
    };
    sudpoints?: number;
}

export interface Team {
    id: string;
    name: string;
    logoUrl: string;
    captainId?: string;
    players?: { [playerId: string]: boolean };
    tournaments?: { [tournamentId: string]: boolean };
    // Roster se construye al vuelo, no se almacena en la DB
    roster?: { [playerId: string]: Player }; 
}

export interface Player {
    id: string;
    name: string;
    lastName?: string;
    dni?: string;
}

export interface Tournament {
    id: string;
    name: string;
    teamCount: number;
    teams: { [key: string]: boolean };
    status: 'draft' | 'open' | 'inprogress' | 'finished';
}

export interface Match {
    id: string;
    tournamentId: string;
    round: number;
    homeTeamId: string;
    awayTeamId: string;
    status: 'pending' | 'finished';
    result?: {
        home: number | null;
        away: number | null;
    };
    details?: {
        date: string;
        time: string;
        referee: string;
    };
    statsProcessed?: boolean;
}

// --- ESTADÍSTICAS (ESTRUCTURA NUEVA Y DETALLADA) ---

// Stats crudos que se guardan en /match_stats/{matchId}
export interface PlayerStatsInfo {
    goals: number;
    assists: number;
    yellowCards: number;
    redCard: boolean;
    mvp: boolean;
    sudPointsChange?: number; // Puntos ganados/perdidos en este partido
}

// Stats agregados que se guardan en /tournament_stats/{tournamentId}
export interface Stats {
    positions: any[];
    scorers: any[];
    sanctions: any[];
}

// --- NUEVA ESTRUCTURA PARA EL RANKING GLOBAL EN /playerStats/{userId} ---

// Lo que se guarda para un jugador por cada partido jugado
export interface PlayerMatchStats {
    matchId: string;
    tournamentId: string;
    tournamentName: string;
    teamId: string;
    opponentId: string;
    result: 'win' | 'draw' | 'loss';
    goals: number;
    yellowCards: number;
    redCard: boolean;
    mvp: boolean;
    sudpoints: number; // Puntos ganados SÓLO en este partido
}

// Las estadísticas totales de un jugador, calculadas a partir de la suma de `byMatch`
export interface PlayerStatTotals {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    yellowCards: number;
    redCards: number;
    mvp: number;
    sudpoints: number; // El total de puntos para el ranking
}

// El objeto completo que se guarda en /playerStats/{userId}
export interface PlayerStats {
    totals: PlayerStatTotals;
    byMatch: {
        [matchId: string]: PlayerMatchStats;
    };
}
