'''
import { ref, set } from 'firebase/database';
import { db } from './firebase'; // Make sure the path to your firebase config is correct

// 1. Definition of Tournaments with unique IDs
const tournaments = {
  'clausura-2024': {
    id: 'clausura-2024',
    name: 'Torneo Clausura 2024',
    category: 'Masculino',
    startDate: '2024-07-01',
    endDate: '2024-12-15',
    venue: 'Complejo La Redonda'
  }
};

// 2. Definition of Teams with unique IDs
const teams = {
  '-OaRDEPu8IgnmWKaaXJm': {
    id: '-OaRDEPu8IgnmWKaaXJm',
    name: 'Puerto F.C.',
    crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png',
    players: { 'admin-user': true } // The admin is part of this team
  },
  '-OaRDJ823opZqH0_7ALz': {
    id: '-OaRDJ823opZqH0_7ALz',
    name: 'SUDONE FC',
    crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png',
    players: { 'captain-user': true } // The captain is part of this team
  },
  'la-banda': {
      id: 'la-banda',
      name: 'La Banda',
      crestUrl: 'https://i.postimg.cc/3wts3GNd/escudito-river.png'
  }
};

// 3. Definition of Users with reference to teamId
const users = {
  'admin-user': {
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
    transferStatus: 'blindado',
    teamId: '-OaRDEPu8IgnmWKaaXJm' // <-- Reference to the team's ID
  },
  'captain-user': {
    id: 'captain-user',
    name: 'Leo Messi',
    username: 'leomessi',
    email: 'captain@sudone.com',
    avatar: 'https://i.postimg.cc/L6ZDmP25/messi.jpg',
    location: 'Rosario, Argentina',
    isVerified: true,
    role: 'captain',
    isBlocked: false,
    sudpoints: 80,
    baseSudpoints: 0,
    league: 'Oro',
    division: 2,
    dni: '10101010',
    profileBackground: 'https://i.postimg.cc/1RfWNTCC/lusail.png',
    transferStatus: 'libre',
    teamId: '-OaRDJ823opZqH0_7ALz' // <-- Reference to the team's ID
  }
};

// 4. Definition of Test Matches
const matches = {
    'match-1': {
        id: 'match-1',
        date: '2024-05-20',
        teamAId: '-OaRDJ823opZqH0_7ALz',      // <-- We use the ID of SUDONE FC
        teamBId: 'la-banda',       // <-- We use the ID of La Banda
        teamA: { name: 'SUDONE FC', crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png' },
        teamB: { name: 'La Banda', crestUrl: 'https://i.postimg.cc/3wts3GNd/escudito-river.png' },
        scoreA: 3,
        scoreB: 1,
        tournamentId: 'clausura-2024'
    },
    'match-2': {
        id: 'match-2',
        date: '2024-05-27',
        teamAId: '-OaRDEPu8IgnmWKaaXJm',      // <-- We use the ID of Puerto F.C.
        teamBId: '-OaRDJ823opZqH0_7ALz',      // <-- We use the ID of SUDONE FC
        teamA: { name: 'Puerto F.C.', crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png' },
        teamB: { name: 'SUDONE FC', crestUrl: 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png' },
        scoreA: 0,
        scoreB: 2,
        tournamentId: 'clausura-2024'
    }
};

// 5. Function to populate the database
const seedDatabase = async () => {
  console.log('⏳ Starting database seeding...');

  try {
    // Deletes old data and writes new data in a single atomic operation
    await set(ref(db), {
      tournaments,
      teams,
      users,
      matches
    });
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding the database:', error);
  }
};

// Execute the function
seedDatabase();
'''