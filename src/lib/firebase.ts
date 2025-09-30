'use client';
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";

// --- Realtime Database Imports ---
import { 
    getDatabase,
    ref,
    set,
    push,
    onValue,
    update,
    remove,
    serverTimestamp // Útil para marcas de tiempo consistentes
} from "firebase/database"; 

// Your web app's Firebase configuration (using environment variables)
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

// --- Initialize Realtime Database ---
const rtdb = getDatabase(app); 

// --- EXPORTS ---
export { 
    app, 
    auth, 
    storage, 
    // Realtime Database exports
    rtdb, 
    ref,
    set,
    push,
    onValue,
    update,
    remove,
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
