export interface UserProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    location?: string;
    isVerified: boolean;
    role: 'admin' | 'captain' | 'player';
    isBlocked: boolean;
    sudpoints: number;
    baseSudpoints: number;
    league: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
    division: number;
    dni: string;
    profileBackground: string;
    sudonepassLevel: number;
    sudonepassExp: number;
    claimedPassRewards?: number[];
    transferStatus: 'libre' | 'traspaso' | 'blindado';
    stats: {
        partidosJugados: number;
        victorias: number;
        empates: number;
        derrotas: number;
        goles: number;
        asistencias: number;
        amarillas: number;
        rojas: number;
        mvps: number;
    };
    team?: {
        id: string;
        name: string;
        crestUrl: string;
    };
    interactions: number;
    packsOpened: number;
    favoriteTournaments?: string[]; 
}

export interface Team {
    id: string;
    name: string;
    crestUrl: string;
    captainId: string;
    players: string[];
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
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  youtubeUrl?: string;
  twitchUrl?: string;
  likes: { [userId: string]: boolean };
  comments: {
    [commentId: string]: {
      authorId: string;
      content: string;
      createdAt: number;
    };
  };
  createdAt: number;
  isPinned?: boolean;
  pinnedUntil?: number;
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
  isGuest?: boolean;
  team?: {
    id: string;
    name: string;
    crestUrl?: string | null;
  } | null;
}

// Tipos relacionados a Torneos

export interface Standing {
    rank: number;
    team: string;
    crestUrl: string;
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
    yellow: number;
    red: number;
}

export interface FullTournament {
    id: string;
    name: string;
    category: string;
    startDate: string;
    endDate: string;
    venue: string;
    standings: Standing[];
    scorers: Scorer[];
    sanctions: Sanction[];
}
