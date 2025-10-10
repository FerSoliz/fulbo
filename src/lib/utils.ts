import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- LÓGICA DE DIVISIONES DEL RANKING DE SUDONE ---

export interface DivisionInfo {
  name: string;
  level: string | null;
  icon: 'Shield' | 'Gem' | 'Crown' | 'Star';
  color: string;
  startOfDivisionPoints: number;
  endOfDivisionPoints: number;
  pointsInDivision: number;
  totalPointsForDivision: number;
  progressPercentage: number;
  pointsToNextDivision: number;
  nextDivisionName: string; // NUEVA PROPIEDAD
}

/**
 * Calcula TODA la información de la división de un jugador basado en sus SudPoints.
 * @param sudpoints - El total de SudPoints del jugador.
 * @returns Un objeto DivisionInfo con los detalles de la división y el progreso.
 */
export function getDivisionInfo(sudpoints: number): DivisionInfo {
  let info: Omit<DivisionInfo, 'pointsInDivision' | 'totalPointsForDivision' | 'progressPercentage' | 'pointsToNextDivision' | 'nextDivisionName'>;
  let nextDivisionName: string;

  if (sudpoints >= 700) {
    info = { name: 'Leyenda Mundial', level: '🏅', icon: 'Star', color: '#FFD700', startOfDivisionPoints: 700, endOfDivisionPoints: Infinity };
    nextDivisionName = "Cima alcanzada";
  } else if (sudpoints >= 600) {
    info = { name: 'Crack', level: null, icon: 'Crown', color: '#C0C0C0', startOfDivisionPoints: 600, endOfDivisionPoints: 700 };
    nextDivisionName = "Leyenda Mundial";
  } else if (sudpoints >= 500) {
    info = { name: 'Oro', level: null, icon: 'Gem', color: '#FBBF24', startOfDivisionPoints: 500, endOfDivisionPoints: 600 };
    nextDivisionName = "Crack";
  } else if (sudpoints >= 400) {
    info = { name: 'Plata', level: null, icon: 'Shield', color: '#A1A1AA', startOfDivisionPoints: 400, endOfDivisionPoints: 500 };
    nextDivisionName = "Oro";
  } else if (sudpoints >= 300) {
    info = { name: 'Bronce', level: 'I', icon: 'Shield', color: '#CD7F32', startOfDivisionPoints: 300, endOfDivisionPoints: 400 };
    nextDivisionName = "Plata";
  } else if (sudpoints >= 200) {
    info = { name: 'Bronce', level: 'II', icon: 'Shield', color: '#CD7F32', startOfDivisionPoints: 200, endOfDivisionPoints: 300 };
    nextDivisionName = "Bronce I";
  } else if (sudpoints >= 100) {
    info = { name: 'Bronce', level: 'III', icon: 'Shield', color: '#CD7F32', startOfDivisionPoints: 100, endOfDivisionPoints: 200 };
    nextDivisionName = "Bronce II";
  } else {
    info = { name: 'Bronce', level: 'IV', icon: 'Shield', color: '#CD7F32', startOfDivisionPoints: 0, endOfDivisionPoints: 100 };
    nextDivisionName = "Bronce III";
  }

  const { startOfDivisionPoints, endOfDivisionPoints } = info;

  if (!isFinite(endOfDivisionPoints)) {
    return {
      ...info,
      pointsInDivision: sudpoints - startOfDivisionPoints,
      totalPointsForDivision: 0,
      progressPercentage: 100,
      pointsToNextDivision: 0,
      nextDivisionName,
    };
  }

  const pointsInDivision = sudpoints - startOfDivisionPoints;
  const totalPointsForDivision = endOfDivisionPoints - startOfDivisionPoints;
  const progressPercentage = totalPointsForDivision > 0 ? (pointsInDivision / totalPointsForDivision) * 100 : 100;
  const pointsToNextDivision = endOfDivisionPoints - sudpoints;

  return {
    ...info,
    pointsInDivision,
    totalPointsForDivision,
    progressPercentage,
    pointsToNextDivision,
    nextDivisionName,
  };
}
