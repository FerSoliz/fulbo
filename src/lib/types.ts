'''
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

// --- NUEVA INTERFAZ PARA DETALLES DE EQUIPO ---
export interface TeamDetails {
    id: string;
    name: string;
    logoUrl: string;
    captainId: string;
    // Podríamos añadir más campos como `tournamentId`, etc. en el futuro
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
''