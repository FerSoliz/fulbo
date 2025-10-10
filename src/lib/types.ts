'''
// --- TIPOS GLOBALES DE LA APLICACIÓN ---

// --- ESTADOS Y NAVEGACIÓN ---
export type PageState = 'LOADING' | 'ACCESS_DENIED' | 'NOT_FOUND' | 'READY';

// --- ENTIDADES PRINCIPALES ---
export interface UserProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    dni?: string;
    role: 'admin' | 'captain' | 'player';
    team?: {
        id: string;
        name: string;
        crestUrl: string;
    } | null;
    profileBackground?: string;
}

export interface Team {
    id: string;
    name: string;
    logoUrl: string;
    captainId?: string;
    players?: { [playerId: string]: boolean };
    tournaments?: { [tournamentId: string]: boolean };
    roster?: { [playerId: string]: RosterPlayer }; 
}

export interface RosterPlayer {
    id: string;
    name: string;
    dni?: string;
    isGuest: boolean;
}

export interface FoundPlayer {
  id: string;
  name: string;
  dni?: string;
  username: string;
  avatar?: string;
  isGuest: boolean;
  team?: {
    id: string;
    name: string;
  } | null;
}

export interface TeamDetails {
  id: string;
  name: string;
  logoUrl: string;
  captainId: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorUsername: string;
  content: string;
  media?: { type: 'image' | 'video'; url: string; videoType?: 'youtube' | 'twitch'; videoId?: string }[];
  url?: string;
  createdAt: number;
  likes: { [userId: string]: { name: string; avatar: string; username: string } };
  comments: { [commentId: string]: Comment };
  isPinned?: boolean;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorUsername: string;
    content: string;
    createdAt: number;
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

export interface TournamentStats {
    positions: any[];
    scorers: any[];
    sanctions: any[];
}

export interface Standing {
  rank: number;
  team: string;
  crestUrl?: string;
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

// --- ESTRUCTURA DE TORNEO ENRIQUECIDA ---
export interface FullTournament {
    id: string;
    name: string;
    venue: string; // Sede
    status: 'Inscripciones Abiertas' | 'En curso' | 'Finalizado' | 'Próximamente';
    
    // Estos campos son opcionales y pueden no venir de la consulta inicial
    category?: string;
    startDate?: string;
    endDate?: string;
    
    // Estos se llenan en la vista de detalle del torneo
    standings?: Standing[];
    scorers?: Scorer[];
    sanctions?: Sanction[];
}

// --- STATS ---
export interface PlayerStatsInfo {
    goals: number;
    assists: number;
    yellowCards: number;
    redCard: boolean;
    mvp: boolean;
    sudPointsChange?: number;
}

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
    sudpoints: number;
}

export interface PlayerStatTotals {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    yellowCards: number;
    redCards: number;
    mvp: number;
    sudpoints: number;
}

export interface PlayerStats {
    totals: PlayerStatTotals;
    byMatch: {
        [matchId: string]: PlayerMatchStats;
    };
}
''