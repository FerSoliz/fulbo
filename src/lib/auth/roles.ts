import type { User } from '@/lib/types';

export type CanonicalRole = 'dios' | 'organizador' | 'director_tecnico' | 'jugador' | 'unknown';

export const normalizeRole = (role?: User['role'] | string): CanonicalRole => {
  switch (role) {
    case 'dios':
    case 'admin':
      return 'dios';
    case 'organizador':
    case 'vendedor':
      return 'organizador';
    case 'director_tecnico':
      return 'director_tecnico';
    case 'jugador':
    case 'player':
      return 'jugador';
    default:
      return 'unknown';
  }
};

export const hasRole = (user: User | null | undefined, role: Exclude<CanonicalRole, 'unknown'>): boolean => {
  return normalizeRole(user?.role) === role;
};

export const isGod = (user: User | null | undefined): boolean => hasRole(user, 'dios');
export const isOrganizer = (user: User | null | undefined): boolean => hasRole(user, 'organizador');
export const isDirectorTecnico = (user: User | null | undefined): boolean => hasRole(user, 'director_tecnico');
export const isPlayer = (user: User | null | undefined): boolean => hasRole(user, 'jugador');

export const canAccessAdminPanel = (user: User | null | undefined): boolean => isGod(user) || isOrganizer(user);
export const canManageStore = (user: User | null | undefined): boolean => isGod(user) || isOrganizer(user);
export const canDeleteAnyPost = (user: User | null | undefined): boolean => isGod(user) || isOrganizer(user);
export const canPinPost = (user: User | null | undefined): boolean => isGod(user) || isOrganizer(user);

export const roleLabel = (role?: User['role'] | string): string => {
  switch (normalizeRole(role)) {
    case 'dios':
      return 'Dios';
    case 'organizador':
      return 'Organizador';
    case 'director_tecnico':
      return 'Director Tecnico';
    case 'jugador':
      return 'Jugador';
    default:
      return 'Sin rol';
  }
};
