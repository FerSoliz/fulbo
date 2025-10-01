'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from "firebase/database";

// La configuración de Firebase no cambia
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// --- INICIALIZACIÓN DE FIREBASE ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- SERVICIOS ---
const auth = getAuth(app);
const storage = getStorage(app);
// ¡CORRECCIÓN CLAVE! Ahora `db` es la instancia de Realtime Database.
const db = getDatabase(app); 

// --- EXPORTS ---
// Exportamos los servicios con nombres consistentes y todo lo necesario para Auth.
export { 
    app, 
    auth, 
    storage, 
    db, // <-- `db` ahora es correctamente la Realtime Database
    // Auth-related exports
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
};
