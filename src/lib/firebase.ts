'use client';
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";

// --- Firestore Imports ---
import { 
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc, 
    getDoc,
    getDocs,
    writeBatch,
    deleteDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    limit,
    orderBy
} from "firebase/firestore";

// --- Realtime Database Imports ---
import * as RTDB from "firebase/database"; 

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

console.log("Firebase Config Loaded:", firebaseConfig); // <--- NUEVO console.log aquí

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

// --- Initialize BOTH databases ---
const db = getFirestore(app); 
const dbRealtime = RTDB.getDatabase(app); 

// --- EXPORTS ---
export { 
    app, 
    auth, 
    storage, 
    // Firestore exports
    db, 
    collection, 
    doc, 
    setDoc, 
    addDoc, 
    getDoc, 
    getDocs, 
    writeBatch, 
    deleteDoc, 
    updateDoc, 
    onSnapshot, 
    query, 
    where, 
    limit, 
    orderBy,
    // Realtime Database exports (accessing via RTDB alias)
    dbRealtime, 
    RTDB as dbRTExports, 
    // Auth exports
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
};
