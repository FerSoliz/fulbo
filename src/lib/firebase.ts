'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase } from "firebase/database";

// La configuración de Firebase no cambia
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// --- INICIALIZACIÓN DE FIREBASE ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- SERVICIOS ---
const auth = getAuth(app);
const db = getDatabase(app); 

// --- EXPORTS ---
// Exportamos los servicios con nombres consistentes y todo lo necesario para Auth.
export { 
    app, 
    auth, 
    db,
    // Auth-related exports
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
};
