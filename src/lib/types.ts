
import { Timestamp } from "firebase/database";

// Definición de la estructura para un equipo asociado a un usuario o invitado
export interface PlayerTeamInfo {
  id: string;
  name: string;
  crestUrl: string;
}

// Interfaz ÚNICA Y DEFINITIVA para un usuario registrado
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  dni: string;
  role: 'player' | 'captain' | 'admin';
  avatar?: string;
  profileBackground?: string;
  location?: string;
  isVerified: boolean;
  isBlocked: boolean;
  sudpoints: number;
  team?: PlayerTeamInfo | null;
  // Añade aquí cualquier otro campo específico del usuario
}

export interface GuestPlayer {
  name: string;
  dni: string;
  team: PlayerTeamInfo;
  sudpoints?: number; // Hacemos que sea opcional para no romper datos antiguos
}

export interface Team {
    id: string;
    name: string;
    logoUrl: string;
    captainId: string;
    players: { [key: string]: { isGuest: boolean } };
    tournaments: { [key: string]: true };
}

export interface Tournament {
    id: string;
    name: string;
    category: string;
    startDate: string;
    teams: { [key: string]: true };
    teamCount: number;
    status: 'inscripciones-abiertas' | 'en-juego' | 'finalizado';
    venue: string;
    endDate?: string;
}

export interface Match {
    id: string;
    tournamentId: string;
    homeTeamId: string;
    awayTeamId: string;
    details: {
        date: string; // ISO 8601 format
        time: string; // HH:mm format
        field: string;
    };
    result?: {
        homeScore: number;
        awayScore: number;
    };
    status: 'pending' | 'in-progress' | 'finalizado' | 'cancelled';
    statsProcessed: boolean;
    financesProcessed?: boolean; // Flag para saber si ya se cargó la caja
}

// NUEVO TIPO: Partido enriquecido para mostrar en la UI
export interface EnrichedMatch extends Match {
  tournamentName: string;
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamName: string;
  awayTeamLogo?: string;
}

// NUEVO TIPO: Estructura para las finanzas de un partido
export interface MatchFinances {
    earnings: number;
    expenses: number;
    balance: number;
    notes?: string;
    createdAt: Timestamp | number;
    updatedAt: Timestamp | number;
}

export interface PlayerStatsInfo {
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCard?: boolean;
    mvp?: boolean;
    sudPointsChange?: number;
}

export interface PlayerStats {
    totals: {
        matchesPlayed: number;
        goals: number;
        assists: number;
        yellowCards: number;
        redCards: number;
        mvp: number;
    };
    byTournament: {
        [tournamentId: string]: {
            tournamentName?: string;
            matchesPlayed: number;
            goals: number;
            assists: number;
            yellowCards: number;
            redCards: number;
            mvp: number;
        }
    }
}


export interface Standing {
    rank: number;
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
    crestUrl?: string;
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
    positions: any[];
    scorers: any[];
    sanctions: any[];
}


export interface FullTournament extends Omit<Tournament, 'teams' | 'teamCount'> {
    standings: Standing[];
    scorers: Scorer[];
    sanctions: Sanction[];
}

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorUsername: string;
    content: string;
    media?: { type: 'image' | 'video', url: string, videoType?: 'youtube' | 'twitch', videoId?: string }[];
    url?: string;
    likes: { [key: string]: { name: string, avatar: string, username: string } };
    comments: { [key: string]: Comment };
    createdAt: number;
    isPinned?: boolean;
}

export interface Comment {
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorUsername: string;
    content: string;
    createdAt: number;
}

export interface TeamDetails {
    id: string;
    name: string;
    logoUrl: string;
    captainId: string;
}

export interface RosterPlayer {
    id: string;
    name: string;
    dni: string;
    isGuest: boolean;
}

export interface FoundPlayer {
    id: string;
    name: string;
    dni: string;
    username: string;
    avatar?: string;
    isGuest: boolean;
    team?: {
        id: string;
        name: string;
    } | null;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
    category: string;
}
