
// src/lib/types.ts

// Tipos base de la base de datos
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  dni: string;
  role: "Admin" | "Captain" | "Player";
  avatar?: string;
  profileBackground?: string;
  team?: {
    id: string;
    name: string;
    crestUrl: string;
  } | null;
  sudpoints: number;
  availablePacks: number;
  nextPackTimestamp: number;
  isVerified?: boolean;
  transferStatus?: 'libre' | 'traspaso' | 'blindado';
}

export interface GuestPlayer {
  name: string;
  dni: string;
  team?: {
    id: string;
    name: string;
    crestUrl: string;
  } | null;
  sudpoints: number;
}

// Interfaz Unificada para Perfiles (¡NUEVA!)
// Representa tanto a un usuario registrado como a un invitado.
// La usamos en el frontend para manejar ambos casos con un solo objeto.
export interface UserProfile {
  id: string; // UID para usuarios, DNI para invitados
  isGuest: boolean; // Flag para diferenciar

  // --- Campos Comunes ---
  name: string;
  dni: string;
  sudpoints: number;
  team?: {
    id: string;
    name: string;
    crestUrl: string;
  } | null;

  // --- Campos de Usuario Registrado (Opcionales) ---
  username?: string;
  email?: string;
  role?: 'Admin' | 'Captain' | 'Player';
  avatar?: string;
  profileBackground?: string;
  isVerified?: boolean;
  transferStatus?: 'libre' | 'traspaso' | 'blindado';
  
  // --- Campos de Juego (Opcionales) ---
  availablePacks?: number;
  nextPackTimestamp?: number;
}


export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  captainId: string;
  players: { [id: string]: { isGuest: boolean } };
  tournaments: { [id: string]: boolean };
}

export interface Tournament {
  id: string;
  name: string;
  category: string;
  startDate: string;
  venue: string;
  status: "INSCRIPCION_ABIERTA" | "EN_CURSO" | "FINALIZADO";
  teams: { [id: string]: boolean };
  teamCount: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string; // Denormalized
  awayTeamName?: string; // Denormalized
  homeTeamCrest?: string; // Denormalized
  awayTeamCrest?: string; // Denormalized
  date: string; // ISO 8601 format
  status: "PENDING" | "IN_PROGRESS" | "FINISHED";
  result?: {
    homeScore: number;
    awayScore: number;
  };
  statsProcessed: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string; // Denormalized
  authorAvatar: string; // Denormalized
  content: string;
  media?: {
    type: "image" | "video";
    url: string;
  };
  likes: { [userId: string]: boolean };
  comments: Comment[];
  createdAt: number; // timestamp
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: number;
}

// Tipos para estadísticas y datos agregados

export interface Standing {
  rank: number;
  crestUrl: string;
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

// Interfaces completas para vistas específicas

export interface FullTournament extends Tournament {
  standings?: Standing[];
  scorers?: Scorer[];
  sanctions?: Sanction[];
  matches?: Match[];
  teamsList?: Team[]; // Renombrado para evitar conflicto con `teams` mapa
}
