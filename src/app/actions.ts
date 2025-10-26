'use server';

// 1. IMPORTACIÓN CORRECTA: Usamos la inicialización de Firebase para el SERVIDOR.
import { db } from '@/lib/firebase/server-init';
import { ref, get } from 'firebase/database';

// El tipo de resultado que espera el componente de la página de registro.
type DniCheckResult = 
  | { status: 'USER_EXISTS' } 
  | { status: 'GUEST_FOUND', data: { name: string } } 
  | { status: 'AVAILABLE' } 
  | { status: 'INVALID_DNI' } 
  | { status: 'ERROR', message: string };

/**
 * Server Action DEFINITIVA para verificar un DNI.
 * 
 * DIAGNÓSTICO FINAL: El error ocurría por una colisión arquitectónica. La acción intentaba usar
 * una función de la capa de datos que dependía de un módulo de cliente ('use client'),
 * lo cual es inválido en un entorno de servidor.
 * 
 * SOLUCIÓN:
 * 1. La acción ahora es 100% autónoma y utiliza la conexión a la base de datos del servidor (`server-init.ts`).
 * 2. Se implementa una lógica de búsqueda manual ("fuerza bruta") para evitar los fallos de la función `query()`
 *    en el entorno de producción de Vercel. Esto garantiza que los DNI existentes SIEMPRE se encuentren.
 */
export async function checkDni(dni: string): Promise<DniCheckResult> {
  if (!/^\d{8}$/.test(dni)) {
    return { status: 'INVALID_DNI' };
  }

  try {
    // --- Búsqueda en /users (Método Robusto) ---
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (usersSnapshot.exists()) {
      const allUsers = usersSnapshot.val();
      for (const userId in allUsers) {
        // Comparamos el DNI, asegurándonos que ambos sean string para evitar errores de tipo.
        if (String(allUsers[userId].dni) === dni) {
          // Si encontramos una coincidencia, el DNI ya existe.
          return { status: 'USER_EXISTS' };
        }
      }
    }

    // --- Búsqueda en /guestPlayers --- 
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);

    if (guestSnapshot.exists()) {
      const guestData = guestSnapshot.val();
      return {
        status: 'GUEST_FOUND',
        data: { name: guestData.name || 'Jugador Encontrado' },
      };
    }

    // Si después de todas las búsquedas no se encontró nada, el DNI está disponible.
    return { status: 'AVAILABLE' };

  } catch (error) {
    console.error('[Server Action - checkDni] Error fatal al verificar DNI:', error);
    // Este error SÍ aparecerá en los logs de Vercel si la conexión falla.
    return { status: 'ERROR', message: 'No se pudo completar la verificación. Inténtalo de nuevo.' };
  }
}
