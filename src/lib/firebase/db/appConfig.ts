import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';

const APP_CONFIG_PATH = 'app_config';
const HEADER_BANNER_URL_PATH = `${APP_CONFIG_PATH}/headerBannerUrl`;

/**
 * Obtiene la URL del banner del header desde la Realtime Database.
 * @returns {Promise<string | null>} La URL del banner si existe, o null si no está configurada.
 */
export const getHeaderBannerUrl = async (): Promise<string | null> => {
  try {
    const bannerRef = ref(db, HEADER_BANNER_URL_PATH);
    const snapshot = await get(bannerRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error al obtener la URL del banner:", error);
    return null;
  }
};

/**
 * Establece o actualiza la URL del banner del header en la Realtime Database.
 * @param {string} url La nueva URL para el banner del header.
 * @returns {Promise<void>}
 */
export const setHeaderBannerUrl = async (url: string): Promise<void> => {
  try {
    const bannerRef = ref(db, HEADER_BANNER_URL_PATH);
    await set(bannerRef, url);
  } catch (error) {
    console.error("Error al establecer la URL del banner:", error);
    throw error; // Relanzamos el error para que el UI pueda manejarlo.
  }
};
