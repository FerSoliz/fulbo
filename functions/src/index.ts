import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa Firebase Admin SDK
admin.initializeApp();

// Cloud Function para sincronizar el rol de Realtime Database con Custom Claims
export const syncUserRoleWithCustomClaims = functions.database.ref('/users/{uid}/role')
    .onWrite(async (change, context) => {
      const uid = context.params.uid;
      const newRole = change.after.val(); // Nuevo valor del rol en Realtime Database

      // Si el rol es nulo o undefined, podemos optar por eliminar el claim o establecer un rol por defecto
      if (!newRole) {
        console.log(`Rol eliminado o nulo para el usuario ${uid}. Eliminando custom claim.`);
        try {
          await admin.auth().setCustomUserClaims(uid, { role: null }); // Elimina el claim 'role'
          console.log(`Custom claim 'role' eliminado para el usuario ${uid}.`);
        } catch (error) {
          console.error(`Error al eliminar custom claim para el usuario ${uid}:`, error);
        }
        return null;
      }

      // Aseguramos que el rol sea un string válido
      if (typeof newRole !== 'string') {
        console.error(`El rol para el usuario ${uid} no es una cadena de texto válida: ${newRole}`);
        return null; // Salimos si el rol no es válido
      }

      console.log(`Intentando establecer custom claim para el usuario ${uid} con rol: ${newRole}`);

      try {
        // Obtener los custom claims actuales del usuario
        const user = await admin.auth().getUser(uid);
        const currentCustomClaims = user.customClaims || {};

        // Si el rol ya es el mismo, no hacemos nada para evitar ciclos y escrituras innecesarias.
        if (currentCustomClaims.role === newRole) {
          console.log(`El rol para el usuario ${uid} ya es ${newRole}. No se requiere actualización.`);
          return null;
        }

        // Establecer o actualizar el custom claim 'role'
        await admin.auth().setCustomUserClaims(uid, { ...currentCustomClaims, role: newRole });

        // Opcional: Notificar al usuario que su rol ha cambiado
        // admin.firestore().collection('notifications').add({ ... });

        console.log(`Custom claim 'role' actualizado a '${newRole}' para el usuario ${uid}.`);

        // Si necesitas forzar una actualización del token en el cliente, puedes revocarlo
        // await admin.auth().revokeRefreshTokens(uid);

        return null;
      } catch (error) {
        console.error(`Error al establecer custom claim para el usuario ${uid}:`, error);
        return null;
      }
    });
