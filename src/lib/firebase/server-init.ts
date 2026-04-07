// Este archivo NO debe tener 'use client';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase } from "firebase/database";

// ¡CAMBIO CLAVE! Leemos las mismas variables que usa el cliente.
// Ahora el servidor buscará las variables con prefijo `NEXT_PUBLIC_`
// que ya tienes configuradas en Vercel.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Patrón Singleton para la inicialización en el servidor
let app: FirebaseApp;
if (!getApps().length) {
  // Validamos que las variables de entorno se hayan cargado correctamente.
  // Esta validación ahora funcionará en producción porque Vercel inyecta las variables.
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    throw new Error("Error crítico: Las variables de entorno del servidor no se pudieron cargar. Asegúrate de que las variables `NEXT_PUBLIC_...` están configuradas en el entorno de hosting (ej. Vercel).");
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getDatabase(app);

export { app, db };
