export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  dni?: string;
  // CORRECCIÓN: Alineado con los roles definidos en rules.md
  role: 'player' | 'captain' | 'admin';
  avatar: string;
  isBlocked?: boolean;
  sudpoints: number;
  baseSudpoints: number;
  league: string;
  division: number;
  isVerified: boolean;
  location: string;
  profileBackground?: string;
  sudonepassLevel?: number;
  sudonepassExp?: number;
  transferStatus?: 'libre' | 'traspaso' | 'blindado';
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
    name: string;
    crestUrl: string;
  };
  interactions?: number;
  packsOpened?: number;
}

export interface PlayerDetails {
  id: string;
  dni: string;
  name: string;
  lastName: string;
  age: string;
  nationality: string;
  phone: string;
  address: string;
  email: string;
}

export interface Tournament {
  id: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  venue: string;
}


// REFACTOR: Adaptado para Realtime Database con información desnormalizada del autor
export interface Comment {
  id: string; 
  authorId: string;
  authorName: string; // <-- NUEVA PROPIEDAD: Nombre del autor del comentario desnormalizado
  authorAvatar: string; // <-- NUEVA PROPIEDAD: Avatar del autor del comentario desnormalizado
  authorUsername: string; // <-- NUEVA PROPIEDAD: Username del autor del comentario desnormalizado
  content: string;
  createdAt: string;
}

// REFACTOR: Estructura de Post completamente adaptada para Realtime Database
export interface Post {
  id: string; // El ID será la clave generada por push()
  authorId: string; // UID del creador
  authorName: string; // Nombre del autor desnormalizado
  authorAvatar: string; // Avatar del autor desnormalizado
  authorUsername: string; // Username del autor desnormalizado
  content: string;
  media?: { type: 'image' | 'video'; url: string; videoType?: 'youtube' | 'twitch'; videoId?: string; }[];
  url?: string; // Campo opcional para enlaces externos
  // Es más eficiente en RTDB usar un objeto para likes/favoritos
  likes?: Record<string, { name: string; avatar: string; username: string; }>; // <-- CAMBIO: Ahora guarda un objeto con info del usuario
  comments?: Record<string, Comment>; // Usa la interfaz Comment actualizada
  createdAt: string; // ISO String. RTDB también puede usar ServerValue.TIMESTAMP
  isPinned?: boolean;
  pinnedUntil?: string | null; 
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  isInitial?: boolean;
}

export interface Notification {
  id: string;
  type: 'sudpoints' | 'post' | 'like' | 'pack' | 'team' | 'friend_request';
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  actions?: { label: string; action: string; }[];
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

export interface Conversation {
    id: string; // Combination of two user IDs
    participants: string[];
    messages: Message[];
    lastMessage?: {
        text: string;
        timestamp: number;
    }
}


export const sudpointConfig = {
    win: 25,
    loss: -15,
    draw: 5,
    goal: 5,
    yellowCard: -5,
    redCard: -25,
    mvp: 15,
    penaltyWin: 10,
    penaltyLoss: -5,
    competitionWin: 500,
    firstPlace: 200,
    lastPlace: -100,
};

export const leagues = [
    { name: 'Bronce', divisions: 4, color: '#cd7f32', nextLeague: 'Plata' },
    { name: 'Plata', divisions: 4, color: '#c0c0c0', nextLeague: 'Oro' },
    { name: 'Oro', divisions: 4, color: '#ffd700', nextLeague: 'Diamante' },
    { name: 'Diamante', divisions: 4, color: '#b9f2ff', nextLeague: 'HISTORICO' },
    { name: 'HISTORICO', divisions: 1, color: '#9d00ff', nextLeague: 'Leyenda del Fútbol' },
    { name: 'Leyenda del Fútbol', divisions: 1, color: '#ff4500', nextLeague: null },
];

// CORRECCIÓN: Roles actualizados en los datos iniciales
export const initialUsers: User[] = [
  {
    id: 'admin-user',
    name: 'Lucio Mingrone',
    username: 'luccio',
    email: 'admin@sudone.com',
    avatar: 'https://i.postimg.cc/xTT3zpg1/MARADONA-Y-EL-PURO-e1630357319461.jpg',
    location: 'Buenos Aires, Argentina',
    isVerified: true,
    role: 'admin',
    isBlocked: false,
    sudpoints: 100,
    baseSudpoints: 0,
    league: 'Diamante',
    division: 1,
    dni: '12345678',
    profileBackground: 'https://i.postimg.cc/76dmQW2x/interfaz-menu-png-1.png',
    sudonepassLevel: 15,
    sudonepassExp: 45,
    transferStatus: 'blindado',
    stats: { partidosJugados: 100, victorias: 80, empates: 10, derrotas: 10, goles: 150, asistencias: 50, amarillas: 2, rojas: 0, mvps: 40 },
    team: { name: 'Puerto F.C.', crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png' },
    interactions: 0,
    packsOpened: 0,
  },
  {
    id: 'captain-user', // ID actualizado
    name: 'Leo Messi',
    username: 'leomessi',
    email: 'captain@sudone.com', // Email actualizado
    avatar: 'https://i.postimg.cc/L6ZDmP25/messi.jpg',
    location: 'Rosario, Argentina',
    isVerified: true,
    role: 'captain', // Rol actualizado
    isBlocked: false,
    sudpoints: 80,
    baseSudpoints: 0,
    league: 'Oro',
    division: 2,
    dni: '10101010',
    profileBackground: 'https://i.postimg.cc/1RfWNTCC/lusail.png',
    sudonepassLevel: 8,
    sudonepassExp: 90,
    transferStatus: 'libre',
    stats: { partidosJugados: 10, victorias: 8, empates: 1, derrotas: 1, goles: 15, asistencias: 5, amarillas: 0, rojas: 0, mvps: 7 },
    team: { name: 'SUDONE FC', crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png' },
    interactions: 0,
    packsOpened: 0,
  },
];


export const initialNotifications: Notification[] = [
    {
        id: '0',
        type: 'post',
        message: '¡Bienvenido! Siéntete libre de explorar la página, editar tu perfil o lo que quieras hacer.',
        link: '/profile/admin-user',
        isRead: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: '1',
        type: 'post',
        message: 'Lucio Mingrone ha hecho una nueva publicación.',
        link: '/',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // hace 5 mins
    },
    {
        id: '2',
        type: 'sudpoints',
        message: '¡Ganaste 25 Sudpoints por tu victoria!',
        link: '/profile/admin-user',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // hace 2 horas
    },
    {
        id: '3',
        type: 'like',
        message: 'A Leo Messi le ha gustado tu comentario: "¡Gracias Dibu!".',
        link: '/',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // hace 8 horas
    },
];