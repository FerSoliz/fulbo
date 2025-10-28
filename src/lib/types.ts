import { FieldValue } from 'firebase/firestore';

// --- Interfaces Base de la Base de Datos (Realtime DB) ---

export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    dni: string;
    role: 'player' | 'captain' | 'admin';
    avatar?: string;
    profileBackground?: string;
    team?: { // Desnormalizado para acceso rápido
        id: string;
        name: string;
        crestUrl?: string;
    } | null;
    sudpoints: number;
    createdAt: FieldValue;
}

export interface GuestPlayer {
    name: string;
    dni: string;
    team?: { // Desnormalizado
        id: string;
        name: string;
        crestUrl?: string;
    };
    sudpoints: number;
}

export interface Team {
    id: string;
    name: string;
    logoUrl?: string;
    captainId: string;
    players: Record<string, { isGuest: boolean }>;
    tournaments: Record<string, boolean>;
}

export interface Tournament {
    id: string;
    name: string;
    category: string;
    startDate: string; // YYYY-MM-DD
    teams: Record<string, boolean>;
    teamCount: number;
    venue: string; // Sede del torneo
    status: 'open' | 'ongoing' | 'finished';
}

export interface Match {
    id: string;
    tournamentId: string;
    round: number;
    homeTeamId: string;
    awayTeamId: string;
    status: 'pending' | 'finished';
    statsProcessed: boolean; // para idempotencia
    details?: {
        date: string; // YYYY-MM-DD
        time: string; // HH:MM
        youtube_url?: string;
    };
    result?: {
        home: number;
        away: number;
    }
}

export interface Post {
    id: string;
    authorId: string;
    content: string;
    media?: {
        type: 'image' | 'video';
        url: string;
        thumbnail?: string;
    };
    likes: Record<string, boolean>;
    comments: Record<string, Comment>;
    createdAt: number; // Timestamp
}

export interface Comment {
    id: string;
    authorId: string;
    content: string;
    createdAt: number;
}


// --- Interfaces de Estadísticas (Agregadas y Crudas) ---
export interface PlayerStatsInfo {
    goals: number;
    assists: number;
    mvp: boolean;
    sudPointsChange: number;
}

export interface MatchStats {
    [playerId: string]: PlayerStatsInfo;
}

export interface PlayerTotals {
    matchesPlayed: number;
    goals: number;
    assists: number;
    mvp: number;
}

export interface PlayerStats {
    totals: PlayerTotals;
    byTournament: Record<string, PlayerTotals>;
}

export interface Standing {
    rank: number;
    crestUrl?: string;
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
}

export interface Scorer {
    rank: number;
    player: string;
    team: string;
    goals: number;
}

export interface Sanction {
    player: string;
    team: string;
    yellowCards: number;
    redCards: number;
}

export interface TournamentStats {
    positions: Standing[];
    scorers: Scorer[];
    sanctions: Sanction[];
}


// --- Interfaces Enriquecidas (Para la UI) ---

// Objeto de Torneo con todos los datos anidados para la página de detalles.
export interface FullTournament extends Tournament {
    teamsList?: Team[];
    matches?: Match[];
    standings?: Standing[];
    scorers?: Scorer[];
    sanctions?: Sanction[];
}

// Objeto de Partido enriquecido con nombres y logos para la UI.
export interface EnrichedMatch extends Match {
    tournamentName?: string;
    homeTeamName: string;
    homeTeamLogo?: string;
    awayTeamName: string;
    awayTeamLogo?: string;
    venue?: string; // <-- ¡CAMPO AÑADIDO!
}
