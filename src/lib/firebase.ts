'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase, ref, set, push, onValue, get, serverTimestamp, update, remove } from "firebase/database";
import { getFirestore } from 'firebase/firestore'; // <-- Importamos getFirestore

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
// Para evitar errores de "Firebase app already exists" en Next.js con HMR (Hot Module Replacement)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- SERVICIOS ---
const auth = getAuth(app);
const storage = getStorage(app);
const rtdb = getDatabase(app); // Realtime Database
const db = getFirestore(app); // <-- AÑADIDO: Inicializamos Firestore


// --- EXPORTS ---
export { 
    app, 
    auth, 
    storage, 
    db, // <-- AÑADIDO: Exportamos la instancia de Firestore
    // Realtime Database exports
    rtdb, 
    ref,
    set,
    push,
    onValue,
    update,
    remove,
    get, 
    serverTimestamp,
    // Auth exports
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
};
