// ¡SOLUCIÓN DEFINITIVA! Cargamos explícitamente las variables de entorno.
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

// Este archivo NO debe tener 'use client';
import { initializeApp, getApps, getApp, App } from 'firebase/app';
import { getDatabase } from "firebase/database";

// Las variables de entorno del servidor NO deben tener el prefijo NEXT_PUBLIC_.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

// Patrón Singleton para la inicialización en el servidor
let app: App;
if (!getApps().length) {
  // Validamos que las variables de entorno del servidor existan DESPUÉS de intentar cargarlas.
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    throw new Error("Error crítico: Las variables de entorno del servidor no se pudieron cargar. Asegúrate de que el archivo .env.local existe en la raíz del proyecto y que las claves como FIREBASE_API_KEY están definidas.");
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getDatabase(app);

export { app, db };
