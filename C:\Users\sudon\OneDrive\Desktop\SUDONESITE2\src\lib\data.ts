

export interface User {
  id: string;
  name: string;
  email?: string;
  password?: string;
  role: 'user' | 'editor' | 'admin';
  avatar: string;
  uniqueCode?: string;
  sudpoints: number;
  baseSudpoints: number;
  league: string;
  division: number;
  isVerified: boolean;
  location: string;
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
  type: 'sudpoints' | 'post' | 'like' | 'pack' | 'team';
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
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
    { name: 'Bronce', divisions: 4, color: '#cd7f32', icon: 'Shield', nextLeague: 'Plata' },
    { name: 'Plata', divisions: 4, color: '#c0c0c0', icon: 'Shield', nextLeague: 'Oro' },
    { name: 'Oro', divisions: 4, color: '#ffd700', icon: 'Shield', nextLeague: 'Diamante' },
    { name: 'Diamante', divisions: 4, color: '#b9f2ff', icon: 'Gem', nextLeague: 'HISTORICO' },
    { name: 'HISTORICO', divisions: 1, color: '#9d00ff', icon: 'Crown', nextLeague: 'Leyenda del Fútbol' },
    { name: 'Leyenda del Fútbol', divisions: 1, color: '#ff4500', icon: 'Star', nextLeague: null },
];

export const defaultVisitor: User = {
    id: '1',
    name: 'Lucio Mingrone',
    email: 'lucionmingrone@gmail.com',
    avatar: '/images/MARADONA_Y_EL_PURO_e1630357319461.jpg',
    location: 'Buenos Aires, Argentina',
    isVerified: true,
    role: 'admin',
    sudpoints: 0,
    baseSudpoints: 0,
    league: 'Bronce',
    division: 4,
    stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
  };


export const users: User[] = [
  {
    id: '1',
    name: 'Lucio Mingrone',
    email: 'lucionmingrone@gmail.com',
    avatar: '/images/MARADONA_Y_EL_PURO_e1630357319461.jpg',
    location: 'Buenos Aires, Argentina',
    isVerified: true,
    role: 'admin',
    sudpoints: 0,
    baseSudpoints: 0,
    league: 'Bronce',
    division: 4,
    stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
  },
  {
    id: 'user-2',
    name: 'Leo Messi',
    avatar: '/images/messi.jpg',
    location: 'Rosario, Argentina',
    isVerified: true,
    role: 'editor',
    sudpoints: 80,
    baseSudpoints: 0,
    league: 'Oro',
    division: 2,
    uniqueCode: 'MESSI10',
    stats: { partidosJugados: 10, victorias: 8, empates: 1, derrotas: 1, goles: 15, asistencias: 5, amarillas: 0, rojas: 0, mvps: 7 },
  },
  {
    id: 'user-3',
    name: 'Dibu Martinez',
    avatar: '/images/dibu.jpg',
    location: 'Mar del Plata, Argentina',
    isVerified: false,
    role: 'user',
    sudpoints: 55,
    baseSudpoints: 0,
    league: 'Plata',
    division: 3,
    uniqueCode: 'DIBU23',
    stats: { partidosJugados: 10, victorias: 5, empates: 3, derrotas: 2, goles: 0, asistencias: 1, amarillas: 1, rojas: 0, mvps: 3 },
  },
];

export const posts: Post[] = [
    {
        id: 1,
        authorId: '1',
        title: "¡Arrancó la Liga Anual 2024!",
        content: "Estamos muy emocionados de anunciar el comienzo de la Liga Anual de SUDONE. Prepárense para competir y demostrar quién es el mejor. ¡Mucha suerte a todos los participantes!",
        media: [
            { type: "image", url: "/images/liga-anual.png" },
        ],
        likes: ['user-2', 'user-3'],
        comments: [
            { id: 1, authorId: 'user-2', content: "¡Vamos con todo!", createdAt: "2024-05-20T11:00:00Z" }
        ],
        createdAt: "2024-05-20T10:00:00Z"
    },
    {
        id: 2,
        authorId: 'user-2',
        title: "Recordando la final del mundo",
        content: "Un momento inolvidable para todos los argentinos. Comparto este video del resumen del partido. ¿Cuál fue su momento favorito?",
        media: [
            { type: "video", url: "https://img.youtube.com/vi/FG_wffPU-yM/maxresdefault.jpg" },
        ],
        likes: ['1', 'user-3'],
        comments: [
             { id: 2, authorId: 'user-3', content: "La atajada en el último minuto. ¡Gracias Dibu!", createdAt: "2024-05-21T15:30:00Z" },
             { id: 3, authorId: '1', content: "El gol de Fideo. ¡Qué locura!", createdAt: "2024-05-21T16:00:00Z" }
        ],
        createdAt: "2024-05-21T14:00:00Z"
    },
    {
        id: 3,
        authorId: 'user-3',
        title: "Algunas fotos del último entrenamiento",
        content: "Dejándolo todo en la cancha para lo que se viene. ¡Vamos equipo!",
        media: [
            { type: "image", url: "/images/dibu-training-1.jpg" },
            { type: "image", url: "/images/dibu-training-2.jpg" },
            { type: "image", url: "/images/dibu-training-3.jpg" },
            { type: "image", url: "/images/dibu-training-4.jpg" },
            { type: "image", url: "/images/dibu-training-5.jpg" },
        ],
        likes: ['1'],
        comments: [],
        createdAt: "2024-05-22T09:00:00Z"
    }
];

export const initialProducts: Product[] = [
  {
    id: 'prod_initial_1',
    name: 'CAMISETA TITULAR SELECCIÓN ARGENTINA',
    description: 'La nueva camiseta titular de la Selección Argentina para la Copa América 2024. Sentí los colores como nuestros campeones del mundo.',
    price: 79000,
    stock: 15,
    images: [
      '/images/camiseta-titular-frente.png',
      '/images/camiseta-titular-espalda.png',
    ],
    isInitial: true,
  },
  {
    id: 'prod_initial_2',
    name: 'CAMISETA SUPLENTE SELECCIÓN ARGENTINA',
    description: 'El nuevo modelo alternativo de la Selección Argentina para la Copa América 2024. Un diseño innovador para llevar la pasión a todos lados.',
    price: 79000,
    stock: 10,
    images: [
      '/images/camiseta-suplente-frente.png',
      '/images/camiseta-suplente-espalda.png',
    ],
    isInitial: true,
  },
   {
    id: 'prod_initial_3',
    name: 'SHORT TITULAR SELECCIÓN ARGENTINA',
    description: 'El short que completa el uniforme titular de la Selección Argentina. Comodidad y estilo para jugar o alentar.',
    price: 49000,
    stock: 20,
    images: [
      '/images/short-titular.png',
    ],
    isInitial: true,
  },
   {
    id: 'prod_initial_4',
    name: 'SHORT SUPLENTE SELECCIÓN ARGENTINA',
    description: 'El short del uniforme alternativo de la Selección. Un diseño moderno que combina con la camiseta suplente.',
    price: 49000,
    stock: 0,
    images: [
      '/images/short-suplente.png',
    ],
    isInitial: true,
  },
];


export const initialNotifications: Notification[] = [
    {
        id: '0',
        type: 'post',
        message: '¡Bienvenido! Siéntete libre de explorar la página, editar tu perfil o lo que quieras hacer.',
        link: '/profile/1',
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
        link: '/profile/1',
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
    {
        id: '4',
        type: 'pack',
        message: '¡Tu sobre diario gratuito está listo para abrir!',
        link: '/collectibles',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // hace 1 día
    },
    {
        id: '5',
        type: 'team',
        message: 'Se han actualizado los resultados de la "Liga Anual 2024".',
        link: '/leagues',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // hace 2 días
    },
];
