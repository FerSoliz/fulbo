

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  dni?: string;
  role: 'user' | 'editor' | 'admin';
  avatar: string;
  isBlocked?: boolean;
  uniqueCode?: string;
  sudpoints: number;
  baseSudpoints: number;
  league: string;
  division: number;
  isVerified: boolean;
  location: string;
  profileBackground?: string;
  sudonepassLevel?: number;
  sudonepassExp?: number;
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
}

export interface PlayerDetails {
  id: string;
  uniqueCode: string;
  name: string;
  lastName: string;
  age: string;
  nationality: string;
  phone: string;
  address: string;
  email: string;
}

export interface Comment {
  id: number;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: number;
  authorId: string;
  title: string;
  content: string;
  media: { type: 'image' | 'video'; url: string }[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
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
    { name: 'Bronce', divisions: 4, color: '#cd7f32', icon: 'Shield', badgeImageUrl: 'https://i.postimg.cc/c1KwdNCm/bronce.png', nextLeague: 'Plata' },
    { name: 'Plata', divisions: 4, color: '#c0c0c0', icon: 'Shield', nextLeague: 'Oro' },
    { name: 'Oro', divisions: 4, color: '#ffd700', icon: 'Shield', nextLeague: 'Diamante' },
    { name: 'Diamante', divisions: 4, color: '#b9f2ff', icon: 'Gem', nextLeague: 'HISTORICO' },
    { name: 'HISTORICO', divisions: 1, color: '#9d00ff', icon: 'Crown', nextLeague: 'Leyenda del Fútbol' },
    { name: 'Leyenda del Fútbol', divisions: 1, color: '#ff4500', icon: 'Star', nextLeague: null },
];

export const defaultVisitor: User = {
    id: 'visitor',
    name: 'VISITANTE',
    username: 'visitante',
    role: 'user', 
    avatar: 'https://avatar.vercel.sh/visitor.png',
    isVerified: false,
    isBlocked: false,
    location: '',
    profileBackground: 'https://i.postimg.cc/76dmQW2x/interfaz-menu-png-1.png',
    sudpoints: 0,
    baseSudpoints: 0,
    league: 'Bronce',
    division: 4,
    stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
};

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
    uniqueCode: 'SUD-ADMIN',
    profileBackground: 'https://i.postimg.cc/76dmQW2x/interfaz-menu-png-1.png',
    sudonepassLevel: 15,
    sudonepassExp: 45,
    stats: { partidosJugados: 100, victorias: 80, empates: 10, derrotas: 10, goles: 150, asistencias: 50, amarillas: 2, rojas: 0, mvps: 40 },
  },
  {
    id: 'editor-user',
    name: 'Leo Messi',
    username: 'leomessi',
    email: 'editor@sudone.com',
    avatar: 'https://i.postimg.cc/L6ZDmP25/messi.jpg',
    location: 'Rosario, Argentina',
    isVerified: true,
    role: 'user',
    isBlocked: false,
    sudpoints: 80,
    baseSudpoints: 0,
    league: 'Oro',
    division: 2,
    uniqueCode: 'MESSI10',
    profileBackground: 'https://i.postimg.cc/1RfWNTCC/lusail.png',
    sudonepassLevel: 8,
    sudonepassExp: 90,
    stats: { partidosJugados: 10, victorias: 8, empates: 1, derrotas: 1, goles: 15, asistencias: 5, amarillas: 0, rojas: 0, mvps: 7 },
  },
];

export const posts: Post[] = [
     {
        id: 4,
        authorId: 'admin-user',
        title: "Nuevas funcionalidades en la plataforma",
        content: "Hemos estado trabajando duro para traerles nuevas características. ¡Pronto podrán disfrutar del sistema de ranking de jugadores y las cartas coleccionables! 🔥",
        media: [
             { type: "image", url: "https://i.postimg.cc/SRHq90Yg/sudone-features.png" }
        ],
        likes: ['editor-user'],
        comments: [],
        createdAt: "2024-05-23T12:00:00Z"
    },
    {
        id: 3,
        authorId: 'admin-user',
        title: "¡Inscripciones Abiertas - Copa Verano!",
        content: "Ya están abiertas las inscripciones para la edición de verano de nuestra copa. ¡No te quedes afuera! Equipos limitados. Más info en la sección 'Inscribirme'.",
        media: [
             { type: "image", url: "https://i.postimg.cc/W3d9b4Vf/copa-verano.png" }
        ],
        likes: [],
        comments: [],
        createdAt: "2024-05-22T18:00:00Z"
    },
    {
        id: 1,
        authorId: 'admin-user',
        title: "¡Arrancó la Liga Anual 2024!",
        content: "Estamos muy emocionados de anunciar el comienzo de la Liga Anual de SUDONE. Prepárense para competir y demostrar quién es el mejor. ¡Mucha suerte a todos los participantes!",
        media: [
            { type: "image", url: "https://i.postimg.cc/NfHBrS60/liga-anual.png" },
        ],
        likes: ['editor-user'],
        comments: [
            { id: 1, authorId: 'editor-user', content: "¡Vamos con todo!", createdAt: "2024-05-20T11:00:00Z" }
        ],
        createdAt: "2024-05-20T10:00:00Z"
    },
    {
        id: 2,
        authorId: 'editor-user',
        title: "Recordando la final del mundo",
        content: "Un momento inolvidable para todos los argentinos. Comparto este video del resumen del partido. ¿Cuál fue su momento favorito?",
        media: [
            { type: "video", url: "https://img.youtube.com/vi/FG_wffPU-yM/maxresdefault.jpg" },
        ],
        likes: ['admin-user'],
        comments: [
             { id: 3, authorId: 'admin-user', content: "El gol de Fideo. ¡Qué locura!", createdAt: "2024-05-21T16:00:00Z" }
        ],
        createdAt: "2024-05-21T14:00:00Z"
    },
];

export const initialProducts: Product[] = [];


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
