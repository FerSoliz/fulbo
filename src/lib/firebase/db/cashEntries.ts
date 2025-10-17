import { ref, push, set, serverTimestamp, onValue, Unsubscribe } from 'firebase/database';
import { db } from '../../firebase';
import { ManualCashEntry, MatchFinances } from '../../types'; 

/**
 * Crea una nueva entrada de caja manual en la base de datos.
 * Utilizado para registrar movimientos de dinero que no están asociados a un partido.
 * @param concept El concepto general del asiento (ej. "Venta de bebidas").
 * @param date La fecha en que ocurrió el movimiento (en formato ISO string).
 * @param financesData El objeto con los detalles de ingresos, egresos y balance.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const createManualCashEntry = async (concept: string, date: string, financesData: MatchFinances): Promise<void> => {
    console.log(`[DB Service] Creando nuevo asiento de caja manual con concepto: ${concept}`);
    try {
        const manualEntriesRef = ref(db, 'manual_cash_entries');
        const newEntryRef = push(manualEntriesRef); // Genera un ID único

        const entryData: Omit<ManualCashEntry, 'id' | 'createdAt'> & { createdAt: object } = {
            concept,
            date,
            finances: financesData, // Corregido para anidar el objeto de finanzas
            createdAt: serverTimestamp() // Usa el timestamp del servidor para la creación
        };

        await set(newEntryRef, entryData);
        console.log(`[DB Service] Asiento manual con ID ${newEntryRef.key} creado exitosamente.`);

    } catch (error) {
        console.error(`[DB Service] Error al crear el asiento de caja manual:`, error);
        // Relanzamos el error para que el componente que llama pueda manejarlo (ej. mostrar un toast)
        throw new Error('No se pudo crear el asiento de caja manual.');
    }
};

/**
 * Escucha los cambios en los asientos de caja manuales en tiempo real.
 * @param callback La función a ejecutar cada vez que los datos cambian.
 * @returns Una función para cancelar la suscripción.
 */
export const listenToManualCashEntries = (callback: (entries: ManualCashEntry[]) => void): Unsubscribe => {
    const manualEntriesRef = ref(db, 'manual_cash_entries');

    const unsubscribe = onValue(manualEntriesRef, (snapshot) => {
        if (snapshot.exists()) {
            const entriesData = snapshot.val();
            const entriesList: ManualCashEntry[] = Object.keys(entriesData).map(key => ({
                id: key,
                ...entriesData[key]
            }));
            callback(entriesList);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error("Error al escuchar los asientos de caja manuales:", error);
        callback([]);
    });

    return unsubscribe;
};
