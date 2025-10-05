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
    favoriteTournaments?: string[]; // <--- NUEVO CAMPO AÑADIDO
}

export interface Team {
    id: string;
    name: string;
    crestUrl: string;
    captainId: string;
    players: string[];
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
''