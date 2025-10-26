'use client';

import { Timestamp } from "firebase/firestore";

export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    dni: string;
    role: 'Admin' | 'Captain' | 'Player';
    avatar?: string;
    profileBackground?: string;
    team?: {
        id: string;
        name: string;
        crestUrl: string;
    } | null;
    sudpoints: number;
}
  
export interface GuestPlayer {
    name: string;
    dni: string;
    team: {
      id: string;
      name: string;
      crestUrl: string;
    };
    sudpoints: number;
}

export interface Team {
    id: string;
    name: string;
    logoUrl: string;
    captainId: string;
    players: {
        [key: string]: { isGuest: boolean };
    };
    tournaments: {
        [key: string]: boolean;
    };
}

export interface FullTournament {
    id: string;
    name: string;
    category: string;
    startDate: Timestamp | Date | string;
    teams?: Team[];
    teamCount: number;
    venue: string; // Sede del torneo
    status: 'open' | 'closed' | 'active' | 'finished';
}

export interface Match {
    id: string;
    tournamentId: string;
    homeTeamId: string;
    awayTeamId: string;
    details: {
        date: Timestamp | Date | string;
        field: string;
    };
    status: 'pending' | 'finished';
    statsProcessed: boolean;
}

export interface PlayerStats {
    totals: {
        matchesPlayed: number;
        goals: number;
        assists: number;
        mvp: number;
        yellowCards: number;
        redCards: number;
    };
    byTournament: {
        [tournamentId: string]: {
            matchesPlayed: number;
            goals: number;
            assists: number;
            mvp: number;
            yellowCards: number;
            redCards: number;
        }
    };
}

export interface Post {
    authorId: string;
    content: string;
    media?: {
        type: 'image' | 'video';
        url: string;
    }[];
    likes: { 
        [userId: string]: boolean; 
    };
    comments: {
        [commentId: string]: {
            authorId: string;
            content: string;
            createdAt: Timestamp;
        }
    };
    createdAt: Timestamp;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    stock: number;
    tienda?: string;
    sizes?: string[]; 
    colors?: string[];
}

export interface CartItem extends Product {
    quantity: number;
}
