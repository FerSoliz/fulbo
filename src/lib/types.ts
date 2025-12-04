
// src/lib/types.ts

// --- TIPOS ESPECÍFICOS PARA MEJOR AUTOCOMPLETADO Y SEGURIDAD ---
export type PlayingPosition = 'arquero' | 'defensa' | 'mediocampo' | 'lateral' | 'delantero' | 'otro';
export type Surface = 'sintetico' | 'piso' | 'once';

// --- TIPOS DE USUARIO Y AUTENTICACIÓN ---
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  dni: string;
  role: 'admin' | 'player' | 'captain' | 'vendedor';
  avatar?: string;
  profileBackground?: string;
  team?: {
    id: string;
    name: string;
    crestUrl: string;
  } | null;
  sudpoints: number;
  createdAt: number;

  // --- Mercado de Pases ---
  transferStatus?: 'libre' | 'traspaso'; // Estado del jugador en el mercado

  // --- Campos Adicionales del Perfil ---
  age?: number;
  phone?: string;
  playingPosition?: PlayingPosition;
  preferredSurfaces?: {
    [key in Surface]?: boolean;
  };
}

export interface GuestPlayer {
  dni: string;
  name:string;
  team?: {
    id: string;
    name: string;
    crestUrl: string;
  } | null;
  sudpoints: number;
}


// --- TIPOS DE TORNEOS Y PARTIDOS ---

export interface FullTournament {
  id: string;
  name: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  venue?: string; // Sede
  date?: string; // Fecha
  category?: string;
  price?: number;
  imageUrl?: string;
}

export interface Tournament {
  id: string;
  name: string;
  category: string;
  startDate: string;
  teams: { [teamId: string]: boolean };
  teamCount: number;
}

export interface MatchDetails {
  date?: string;
  time?: string;
  referee?: string;
  videoUrl?: string; // URL del video del partido
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  roundTitle?: string; // Añadido para el título de la ronda (ej. "Cuartos de Final")
  matchupRef?: string; // Añadido para la referencia del matchup del bracket (ej. "match-0-0")
  homeTeamId: string;
  awayTeamId: string;
  status: 'pending' | 'finished' | 'live';
  result?: {
    home: number | null;
    away: number | null;
  };
  details?: MatchDetails;
  statsProcessed?: boolean;
}

// NUEVO: Interfaz para Partidos Enriquecidos
export interface EnrichedMatch extends Match {
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamName: string;
  awayTeamLogo?: string;
  tournamentName?: string;
  venue?: string; // Sede del torneo
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  captainId: string;
  players: { [playerId: string]: { isGuest?: boolean } };
  tournaments: { [tournamentId: string]: boolean };
}


// --- TIPOS DE PLAYOFFS ---
export interface TeamInfo {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface PositionEntry {
  teamId: string;
  teamName: string;
}

export interface Matchup {
  id: string;
  home: TeamInfo | null;
  away: TeamInfo | null;
}

export interface Round {
  title: string;
  matchups: Matchup[];
}


// --- TIPOS DE ESTADÍSTICAS --
export interface PlayerStatsInfo {
  goals?: number;
  assists?: number;
  mvp?: boolean;
  yellowCards?: number;
  redCards?: number;
  sudPointsChange?: number; // Para trazabilidad
}

export interface TournamentPlayerStats {
  goals: number;
  yellowCards: number;
  redCards: number;
}

export interface GlobalPlayerStats {
  totals: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    mvp: number;
    yellowCards: number;
    redCards: number;
  };
  byTournament: {
    [tournamentId: string]: TournamentPlayerStats;
  };
}

export interface PositionRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goles a favor
  gc: number; // Goles en contra
  dg: number; // Diferencia de gol
  points: number;
}

export interface ScorerRow {
  playerInfo: { id: string; name: string; };
  teamName: string;
  goals: number;
}

export interface SanctionRow {
  playerInfo: { id: string; name: string; };
  teamName: string;
  yellowCards: number;
  redCards: number;
}

export interface Stats {
  positions: PositionRow[];
  scorers: ScorerRow[];
  sanctions: SanctionRow[];
}


// --- TIPOS DE LA TIENDA ---
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}


// --- TIPOS DE POSTS (FEED) --
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    videoType?: 'youtube' | 'twitch'; // Agregado para el tipo de video
    videoId?: string; // Agregado para el ID del video
  }[]; // Se cambió a un array de media items
  createdAt: number;
  likes: { [userId: string]: boolean };
  comments: Comment[];
  location?: string; // Agregado para la ubicación del post
  isPinned?: boolean; // Agregado para el estado de fijado
  pinnedUntil?: number; // Agregado para la fecha de fin de fijado
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string; // Agregado para el avatar del autor del comentario
  content: string;
  createdAt: number;
}

// --- TIPOS DE PÁGINA --
export type PageState = 'LOADING' | 'READY' | 'NOT_FOUND' | 'ACCESS_DENIED';

export type ProfileView = 
  | 'buttons'
  | 'sudone_pass'
  | 'ranking_preview'
  | 'my_team'
  | 'stats'
  | 'history'
  | 'next_match'
  | 'favorite_tournaments'
  | 'my_data'
  | 'coach';


// --- TIPOS DE COLECCIONABLES ---
export interface CardStats {
  vel: number; // Velocidad
  tir: number; // Tiro
  rit: number; // Ritmo
  reg: number; // Regate
  def: number; // Defensa
  fis: number; // Físico
}

export interface CollectibleCard {
  id: number;
  name: string;
  position: 'POR' | 'DEF' | 'MED' | 'DEL';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'hero' | 'CRACKS' | 'LEYENDA MUNDIAL';
  stats: CardStats;
  rating: number;
  playerImageUrl: string;
  clubImageUrl: string;
  countryImageUrl: string;
}

export interface UserCardCollection {
  [cardId: string]: number; // cardId: count
}

export interface UserTeamFormation {
  [position: string]: string; // position: cardId
}

export interface UserCollectiblesData {
  collection: UserCardCollection;
  formation: UserTeamFormation;
  packs: {
    available: number;
    nextPackTimestamp: number;
  };
}
