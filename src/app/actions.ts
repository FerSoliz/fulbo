'use server';

// ¡CORRECCIÓN CRÍTICA! Importamos la instancia de la DB desde el archivo de inicialización del servidor.
import { db } from '@/lib/firebase/server-init';
import { ref, get, query, orderByChild, equalTo, limitToFirst } from 'firebase/database';

// Definimos los tipos de resultado posibles para que el frontend sepa qué esperar.
type DniCheckResult = 
  | { status: 'USER_EXISTS' } // El DNI ya pertenece a una cuenta registrada.
  | { status: 'GUEST_FOUND', data: { name: string } } // El DNI pertenece a un jugador invitado.
  | { status: 'AVAILABLE' } // El DNI está libre.
  | { status: 'INVALID_DNI' } // El formato del DNI no es válido.
  | { status: 'ERROR', message: string }; // Ocurrió un error en el servidor.

/**
 * Verifica la existencia de un DNI en la base de datos (usuarios y jugadores invitados).
 * Se ejecuta de forma segura en el servidor.
 * @param dni El Documento Nacional de Identidad a verificar.
 * @returns Un objeto indicando el estado del DNI.
 */
export async function checkDni(dni: string): Promise<DniCheckResult> {
  // 1. Validación de formato básica.
  if (!/^\d{8}$/.test(dni)) {
    return { status: 'INVALID_DNI' };
  }

  try {
    // 2. Buscar si ya existe un USUARIO registrado con ese DNI.
    // Usamos una consulta indexada para un rendimiento óptimo.
    const usersQuery = query(
      ref(db, 'users'), 
      orderByChild('dni'), 
      equalTo(dni),
      limitToFirst(1)
    );
    const userSnapshot = await get(usersQuery);

    if (userSnapshot.exists()) {
      // Si encontramos un resultado, no necesitamos seguir buscando.
      return { status: 'USER_EXISTS' };
    }

    // 3. Si no es un usuario, buscar si existe como JUGADOR INVITADO.
    // La búsqueda aquí es directa y muy rápida, ya que el DNI es la clave.
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);

    if (guestSnapshot.exists()) {
      const guestData = guestSnapshot.val();
      return { 
        status: 'GUEST_FOUND', 
        data: { name: guestData.name || 'Nombre no encontrado' } 
      };
    }

    // 4. Si no se encontró en ninguna de las dos ramas, está disponible.
    return { status: 'AVAILABLE' };

  } catch (error) {
    console.error('Error severo al verificar DNI:', error);
    // Es importante notificar al frontend si algo falló en el servidor.
    return { status: 'ERROR', message: 'No se pudo completar la verificación en este momento.' };
  }
}
