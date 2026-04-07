
// src/lib/types.ts

// --- TIPOS ESPECÍFICOS PARA MEJOR AUTOCOMPLETADO Y SEGURIDAD ---
export type PlayingPosition = 'arquero' | 'defensa' | 'mediocampo' | 'lateral' | 'delantero' | 'otro';
export type Surface = 'sintetico' | 'piso' | 'once';

// --- TIPOS DE USUARIO Y AUTENTICACIÓN ---
export interface User {
  id: string;
  email?: string;
  name: string;
  username: string;
  dni: string;
  role: 'admin' | 'player' | 'vendedor';
  avatar?: string;
  profileBackground?: string;
  team?: {
    id: string;
    name: string;
    crestUrl: string;
  } | null;
  sudpoints: number;
  createdAt?: number;

  // --- Mercado de Pases ---
  transferStatus?: 'libre' | 'traspaso' | 'blindado'; // Estado del jugador en el mercado
  isBlocked?: boolean;
  isGuest?: boolean;
  isVerified?: boolean;

  // --- Campos Adicionales del Perfil ---
  age?: number;
  phone?: string;
  playingPosition?: PlayingPosition;
  preferredSurfaces?: {
    [key in Surface]?: boolean;
  };
  baseSudpoints?: number;
  league?: string;
  division?: number;
  location?: string;
  stats?: {
    partidosJugados?: number;
    victorias?: number;
    empates?: number;
    derrotas?: number;
    goles?: number;
    asistencias?: number;
    amarillas?: number;
    rojas?: number;
    mvps?: number;
  };
  sudonepassLevel?: number;
  sudonepassExp?: number;
  collectibles?: any;
  gamertag?: string;
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
  teamId?: string;
}

export interface FoundPlayer {
  id: string;
  name: string;
  dni: string;
  username: string;
  profilePicture?: string;
  avatar?: string;
  isGuest?: boolean;
  team?: {
    id: string;
    name: string;
    crestUrl?: string;
  } | null;
}


// --- TIPOS DE TORNEOS Y PARTIDOS ---

export interface FullTournament {
  id: string;
  name: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  venue?: string; // Sede
  startDate?: string;
  endDate?: string;
  date?: string; // Fecha
  category?: string;
  price?: number;
  imageUrl?: string;
  teamsList?: Team[];
  matches?: Match[];
  standings?: Standing[];
  scorers?: Scorer[];
  sanctions?: Sanction[];
}

export interface Tournament {
  id: string;
  name: string;
  category?: string;
  startDate?: string;
  venue?: string;
  status?: 'upcoming' | 'ongoing' | 'finished';
  teams?: { [teamId: string]: boolean };
  teamCount?: number;
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
  stage?: string;
  date?: string;
  advancesToMatchId?: string;
  advancesToPosition?: 'home' | 'away';
}

// NUEVO: Interfaz para Partidos Enriquecidos
export interface EnrichedMatch extends Match {
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamName: string;
  awayTeamLogo?: string;
  tournamentName?: string;
  venue?: string; // Sede del torneo
  finances?: MatchFinances;
  financesProcessed?: boolean;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  captainId?: string;
  players?: { [playerId: string]: { isGuest?: boolean } };
  tournaments?: { [tournamentId: string]: boolean };
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
  nextMatchupId?: string;
  nextMatchupPosition?: 'home' | 'away';
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
  redCard?: boolean;
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
    assists?: number;
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
  imageUrl?: string;
  images?: string[];
  stock: number;
  category?: string;
  tienda?: string;
  sizes?: string[];
  colors?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}


// --- TIPOS DE POSTS (FEED) --
export interface Post {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  authorUsername?: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    videoType?: 'youtube' | 'twitch'; // Agregado para el tipo de video
    videoId?: string; // Agregado para el ID del video
  }[]; // Se cambió a un array de media items
  url?: string;
  createdAt: number;
  likes: { [userId: string]: boolean };
  comments: Comment[];
  location?: string; // Agregado para la ubicación del post
  isPinned?: boolean; // Agregado para el estado de fijado
  pinnedUntil?: number | null; // Agregado para la fecha de fin de fijado
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

export type UserProfile = User;

export interface Notification {
  id: string;
  type?: string;
  link?: string;
  title?: string;
  message: string;
  createdAt?: number;
  read?: boolean;
  isRead?: boolean;
  actions?: { label: string; action: string }[];
}

export interface PlayerTeamInfo {
  id: string;
  name: string;
  crestUrl?: string;
}

export interface TeamDetails {
  id: string;
  name: string;
  logoUrl?: string;
  captainId?: string | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface RosterPlayer {
  id: string;
  name: string;
  dni: string;
  isGuest?: boolean;
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
  standings?: Standing[];
  scorers?: Scorer[];
  sanctions?: Sanction[];
}

export interface Player {
  id: string;
  name: string;
  teamId?: string;
}

export type MatchStats = Record<string, PlayerStatsInfo>;

export interface PlayerStats {
  totals: {
    matchesPlayed: number;
    goals: number;
    assists?: number;
    mvp: number;
    yellowCards?: number;
    redCards?: number;
  };
  byTournament: Record<string, {
    tournamentName?: string;
    matchesPlayed: number;
    goals: number;
    assists?: number;
    mvp: number;
  }>;
}

export interface FinancialItem {
  id: string;
  label?: string;
  concept: string;
  amount: number;
}

export interface MatchFinances {
  matchId?: string;
  income?: { total: number; items: FinancialItem[] };
  expenses?: { total: number; items: FinancialItem[] };
  balance?: number;
  notes?: string;
  closedBy?: { id: string; name: string };
  closedAt?: string;
  lastEditedBy?: { id: string; name: string };
  lastEditedAt?: string;
}

export interface ManualCashEntry {
  id: string;
  date: string;
  concept: string;
  finances: MatchFinances;
}

export interface CashMovement {
  id: string;
  type: 'match' | 'manual';
  date: string | number;
  data: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: {
    text: string;
    timestamp: number;
  };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Card {
  id: any;
  name: string;
  imageUrl?: string;
  rarity?: string;
  position?: string;
  stats?: any;
  rating?: number;
  playerImageUrl?: string;
  clubImageUrl?: string;
  countryImageUrl?: string;
}
