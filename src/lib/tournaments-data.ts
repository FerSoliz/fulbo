
// Definimos una estructura más completa para el torneo en la base de datos
export interface FullTournament {
    id: string;
    name: string;
    category: string;
    startDate: string;
    endDate: string;
    venue: string;
    standings: Standing[];
    scorers: Scorer[];
    sanctions: Sanction[];
}

// Ahora, definimos los tipos que faltaban en `types.ts`
export interface Standing {
    rank: number;
    team: string;
    crestUrl: string;
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
    yellow: number;
    red: number;
}

export const initialTournaments: { [key: string]: FullTournament } = {
    'clausura-2024': {
        id: 'clausura-2024',
        name: "Liga Sudone Clausura 2024",
        category: "Fútbol 11",
        startDate: "2024-08-01",
        endDate: "2024-12-15",
        venue: "Complejo La Ribera",
        standings: [
            { rank: 1, team: 'SUDONE FC', crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png', played: 4, won: 3, drawn: 1, lost: 0, points: 10 },
            { rank: 2, team: 'Los Renegados', crestUrl: 'https://i.postimg.cc/pXQx1b6s/bad-boys.png', played: 4, won: 2, drawn: 1, lost: 1, points: 7 },
            { rank: 3, team: 'La Naranja Mecánica', crestUrl: 'https://i.postimg.cc/50sVJ1B4/naranja.png', played: 4, won: 1, drawn: 0, lost: 3, points: 3 },
        ],
        scorers: [
            { rank: 1, player: 'L. Mingrone', team: 'SUDONE FC', goals: 6 },
            { rank: 2, player: 'J. Pérez', team: 'Los Renegados', goals: 4 },
            { rank: 3, player: 'S. Gomez', team: 'La Naranja Mecánica', goals: 2 },
        ],
        sanctions: [
            { player: 'F. González', team: 'SUDONE FC', yellow: 2, red: 0 },
            { player: 'M. Rodríguez', team: 'La Naranja Mecánica', yellow: 1, red: 1 },
            { player: 'C. Sanchez', team: 'Los Renegados', yellow: 3, red: 0 },
        ]
    }
};
