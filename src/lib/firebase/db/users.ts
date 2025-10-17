import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { User, FoundPlayer } from '../../types';
import { getGuestPlayerByDni } from './guestPlayers';

/**
 * Obtiene el perfil completo de un usuario registrado por su ID.
 * @param userId El ID del usuario.
 * @returns Una promesa que se resuelve con el objeto User o null si no se encuentra.
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if(snapshot.exists()) return { id: snapshot.key, ...snapshot.val() } as User;
    return null;
};

/**
 * Obtiene una lista de usuarios clasificados por SudPoints en orden descendente.
 * @returns Una promesa que se resuelve con un array de usuarios clasificados.
 */
export const getRankedUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('sudpoints'));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron usuarios para el ranking.");
      return [];
    }

    const usersList: User[] = [];
    snapshot.forEach(childSnapshot => {
      usersList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });

    return usersList.reverse(); // Los SudPoints más altos primero
  } catch (error) {
    console.error("[DB Service] Error crítico al obtener el ranking de usuarios:", error);
    return [];
  }
};

/**
 * Busca un usuario por DNI, primero en usuarios registrados y luego en invitados.
 * @param dni El DNI del jugador a buscar.
 * @returns Una promesa que se resuelve con el objeto FoundPlayer o null si no se encuentra.
 */
export const findUserByDni = async (dni: string): Promise<FoundPlayer | null> => {
  try {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('dni'), equalTo(dni));
    const snapshot = await get(q);

    if (snapshot.exists()) {
        let foundUser: FoundPlayer | null = null;
        snapshot.forEach((childSnapshot) => {
        const userData: User = childSnapshot.val();
        if (!foundUser) {
            foundUser = {
            id: childSnapshot.key!,
            name: userData.name,
            dni: userData.dni,
            username: userData.username,
            avatar: userData.avatar,
            isGuest: false,
            team: userData.team || null, 
            };
        }
        });
        return foundUser;
    }
    
    // Si no se encuentra en usuarios, buscar en jugadores invitados
    return await getGuestPlayerByDni(dni);

  } catch (error) {
    console.error('Error al buscar usuario por DNI:', error);
    return null;
  }
};
