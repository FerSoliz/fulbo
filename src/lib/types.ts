
// src/lib/types.ts

/**
 * Define la estructura de un objeto de equipo en la base de datos.
 */
export interface Team {
  id: string;
  name: string;
  crestUrl: string; // URL del escudo
}

/**
 * Define la estructura completa del perfil de un usuario en Firebase Realtime Database.
 */
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'captain' | 'player';
  avatar?: string; // URL de la imagen de perfil
  profileBackground?: string; // URL de la imagen de fondo del perfil
  dni?: string; // Usado para vincular estadísticas
  
  isVerified?: boolean; // Si el usuario está verificado
  
  // --- Datos de Jugador ---
  stats?: {
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
  
  // --- Gamificación y Ranking ---
  sudpoints: number; // Puntos de ranking
  league: string; // Ej: "Liga de los Sábados"
  division: string; // Ej: "A", "B", "C"
  
  // --- Social y Equipo ---
  team?: {
    id: string;
    name: string;
    crestUrl: string;
  };
  transferStatus?: 'libre' | 'traspaso' | 'blindado'; // Estado de fichaje del jugador

  // --- SUDONE PASS ---
  sudonepassLevel?: number;
  sudonepassExp?: number;
  claimedPassRewards?: number[]; // Array con los niveles de recompensa reclamados
  
  // --- Metadatos ---
  createdAt: string; // Fecha de creación en formato ISO
  lastLogin: string; // Último inicio de sesión en formato ISO
}

