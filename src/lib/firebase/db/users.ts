import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { db } from '../../firebase'; // Instancia para el cliente
import { db as serverDb } from '../server-init'; // Instancia para el servidor con ALIAS
import { User } from '../../types';
import { getGuestPlayerByDni } from './guestPlayers';

export const getRankedUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(serverDb, 'users');
    const q = query(usersRef, orderByChild('sudpoints'));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      return [];
    }

    const usersList: User[] = [];
    snapshot.forEach(childSnapshot => {
      const userData = childSnapshot.val();
      if (userData) {
        usersList.push({ 
          id: childSnapshot.key!, 
          ...userData,
          sudpoints: userData.sudpoints ?? 0,
          username: userData.username ?? 'N/A',
        });
      }
    });

    return usersList.reverse();
  } catch (error) {
    console.error("[DB Service] Error crítico al obtener el ranking de usuarios:", error);
    return [];
  }
};

export const getTransferListPlayers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(serverDb, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const transferList: User[] = [];
    snapshot.forEach(childSnapshot => {
      const userData = childSnapshot.val();
      if (userData) {
        const user = {
          id: childSnapshot.key!,
          ...userData,
          sudpoints: userData.sudpoints ?? 0,
          username: userData.username ?? 'N/A',
          name: userData.name ?? 'Usuario Desconocido',
          avatar: userData.avatar ?? '',
        } as User;

        if (user.transferStatus === 'libre' || user.transferStatus === 'traspaso') {
          transferList.push(user);
        }
      }
    });

    transferList.sort((a, b) => b.sudpoints - a.sudpoints);

    return transferList;
  } catch (error) {
    console.error("[DB Service] Error crítico al obtener la lista de transferibles:", error);
    return [];
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if(snapshot.exists()) {
      const userData = snapshot.val();
      if (userData) {
        return {
          id: snapshot.key!,
          ...userData,
          sudpoints: userData.sudpoints ?? 0,
          username: userData.username ?? 'N/A',
        } as User;
      }
    }
    return null;
};

export const findUserByDni = async (dni: string) => {
  try {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('dni'), equalTo(dni));
    const snapshot = await get(q);

    if (snapshot.exists()) {
        let foundUser: any = null;
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (userData && !foundUser) {
              foundUser = {
                id: childSnapshot.key!,
                ...userData,
                isGuest: false,
              };
          }
        });
        return foundUser;
    }
    
    return await getGuestPlayerByDni(dni);

  } catch (error) {
    console.error('Error al buscar usuario por DNI:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  if (!userId) {
    throw new Error('El ID de usuario es requerido para actualizar el perfil.');
  }
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, data);
};
