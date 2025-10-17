import { ref, get } from 'firebase/database';
import { db } from '../../firebase';
import { FoundPlayer } from '../../types';

/**
 * Obtiene el perfil de un jugador invitado por su DNI.
 * @param dni El DNI del jugador invitado.
 * @returns Una promesa que se resuelve con el objeto FoundPlayer (simplificado) o null si no se encuentra.
 */
export const getGuestPlayerByDni = async (dni: string): Promise<FoundPlayer | null> => {
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);
    if (guestSnapshot.exists()) {
        const guestData = guestSnapshot.val();
        return {
            id: guestSnapshot.key!,
            name: guestData.name,
            dni: guestData.dni,
            username: 'invitado',
            isGuest: true,
            team: guestData.team || null,
        };
    }
    return null;
};
