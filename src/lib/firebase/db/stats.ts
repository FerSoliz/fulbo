import { ref, onValue, Unsubscribe, off } from 'firebase/database';
import { db } from '../../firebase';
import { PlayerStats } from '../../types';

/**
 * Escucha las estadísticas de un jugador en tiempo real.
 * @param userId El ID del usuario.
 * @param callback La función a ejecutar cuando los datos cambien.
 * @returns Una función para cancelar la suscripción.
 */
export const listenToPlayerStats = (userId: string, callback: (stats: PlayerStats | null) => void): Unsubscribe => {
    const statsRef = ref(db, `playerStats/${userId}`);

    const listener = onValue(statsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    }, (error) => {
        console.error(`Error al obtener las estadísticas para el usuario ${userId}:`, error);
        callback(null);
    });

    // Devuelve una función que puede cancelar este listener específico.
    return () => off(statsRef, 'value', listener);
};
