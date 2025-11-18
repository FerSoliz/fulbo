
import { Round, PositionEntry, Team } from './types';

// --- Funciones Generadoras de Árbol ---
export const getStageName = (numMatches: number, isRoundTitle = false) => {
  if (isRoundTitle) {
    switch (numMatches) {
      case 1: return 'Final';
      case 2: return 'Semifinales';
      case 4: return 'Cuartos de Final';
      case 8: return 'Octavos de Final';
      case 16: return '16vos de Final';
      default: return `Ronda de ${numMatches * 2}`;
    }
  }
  switch (numMatches) {
      case 2: return 'Semis';
      case 4: return 'Cuartos';
      case 8: return 'Octavos';
      case 16: return '16vos';
      default: return `Ronda de ${numMatches * 2}`;
  }
};

export const getStageAbbreviation = (numMatches: number) => {
    switch (numMatches) {
        case 1: return 'F';
        case 2: return 'SF';
        case 4: return 'CF';
        case 8: return 'OF';
        case 16: return '16';
        default: return `R${numMatches * 2}`
    }
};

// Genera un árbol con equipos reales (Modo Automático)
export const generateBracket = (numTeams: number, dataSource: PositionEntry[], teams: Team[]): Round[] => {
    if (numTeams < 2 || dataSource.length < numTeams) return [];

    const getTeamLogo = (teamId: string) => teams.find(t => t.id === teamId)?.logoUrl || undefined;
    const rounds: Round[] = [];
    let currentTeams = dataSource.slice(0, numTeams).map(p => ({ id: p.teamId, name: p.teamName, logoUrl: getTeamLogo(p.teamId) }));
    let numMatches = numTeams / 2;
    let matchCounter = 1;
    
    const initialRound: Round = { title: getStageName(numMatches, true), matchups: [] };
    for (let i = 0; i < numMatches; i++) {
        initialRound.matchups.push({
            id: `m-${matchCounter++}`,
            home: currentTeams[i],
            away: currentTeams[numTeams - 1 - i],
        });
    }
    rounds.push(initialRound);

    numMatches /= 2;
    while (numMatches >= 1) {
        const prevRoundAbbrev = getStageAbbreviation(numMatches * 2);
        const newRound: Round = { title: getStageName(numMatches, true), matchups: [] };
        for (let i = 0; i < numMatches; i++) {
            newRound.matchups.push({
                id: `m-${matchCounter++}`,
                home: { id: `winner-${prevRoundAbbrev}${i * 2 + 1}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 1}` },
                away: { id: `winner-${prevRoundAbbrev}${i * 2 + 2}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 2}` },
            });
        }
        rounds.push(newRound);
        numMatches /= 2;
    }

    return rounds;
};

// Genera un árbol vacío con placeholders (Modo Personalizado)
export const generateEmptyBracket = (startPhaseMatches: number): Round[] => {
    if (!startPhaseMatches) return [];
    const rounds: Round[] = [];
    let numMatches = startPhaseMatches;
    let matchCounter = 1;

    // Primera ronda con placeholders
    const initialRound: Round = { title: getStageName(numMatches, true), matchups: [] };
    for (let i = 0; i < numMatches; i++) {
        initialRound.matchups.push({
            id: `m-${matchCounter++}`,
            home: null, // Vacío
            away: null, // Vacío
        });
    }
    rounds.push(initialRound);

    // Rondas siguientes con ganadores
    numMatches /= 2;
    while (numMatches >= 1) {
        const prevRoundAbbrev = getStageAbbreviation(numMatches * 2);
        const newRound: Round = { title: getStageName(numMatches, true), matchups: [] };
        for (let i = 0; i < numMatches; i++) {
            newRound.matchups.push({
                id: `m-${matchCounter++}`,
                home: { id: `winner-ph-${prevRoundAbbrev}${i * 2 + 1}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 1}` },
                away: { id: `winner-ph-${prevRoundAbbrev}${i * 2 + 2}`, name: `Ganador ${prevRoundAbbrev}${i * 2 + 2}` },
            });
        }
        rounds.push(newRound);
        numMatches /= 2;
    }
    return rounds;
}
