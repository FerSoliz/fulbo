'use server';

// Importamos la función de la capa de datos que SÍ funciona en producción.
import { findUserByDni } from '@/lib/firebase/db/users';

// El tipo de resultado que espera el componente de la página de registro.
type DniCheckResult = 
  | { status: 'USER_EXISTS' } 
  | { status: 'GUEST_FOUND', data: { name: string } } 
  | { status: 'AVAILABLE' } 
  | { status: 'INVALID_DNI' } 
  | { status: 'ERROR', message: string };

/**
 * Server Action para verificar un DNI.
 * 
 * CORRECCIÓN: Esta función fue refactorizada para eliminar su propia lógica de acceso a la base de datos,
 * que usaba una inicialización de servidor ('server-init') que fallaba en producción.
 * 
 * Ahora, delega toda la responsabilidad a la función centralizada `findUserByDni`,
 * la cual utiliza la misma inicialización de Firebase que el resto de la aplicación (la que funciona).
 * Esto soluciona el bug del "cuelgue" en producción y alinea el código con la arquitectura del proyecto.
 */
export async function checkDni(dni: string): Promise<DniCheckResult> {
  // 1. La validación de formato se mantiene aquí por eficiencia, para no llamar a la DB innecesariamente.
  if (!/^\d{8}$/.test(dni)) {
    return { status: 'INVALID_DNI' };
  }

  try {
    // 2. Usamos la función de la capa de datos que ya existe y funciona.
    const foundPlayer = await findUserByDni(dni);

    // 3. Traducimos la respuesta de la capa de datos al formato que el frontend espera.
    if (!foundPlayer) {
      return { status: 'AVAILABLE' };
    }

    if (foundPlayer.isGuest) {
      return { 
        status: 'GUEST_FOUND', 
        data: { name: foundPlayer.name || 'Jugador Encontrado' } 
      };
    } else {
      return { status: 'USER_EXISTS' };
    }

  } catch (error) {
    console.error('[Server Action - checkDni] Error al verificar DNI:', error);
    return { status: 'ERROR', message: 'No se pudo completar la verificación. Inténtalo de nuevo.' };
  }
}
