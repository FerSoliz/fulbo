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
import * as RTDB from "firebase/database"; // Import entire module as RTDB

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDrZo9X6NNtazx4J9kS9L5D1NUswQTQ0SM",
  authDomain: "studio-1084069868-b52ab.firebaseapp.com",
  databaseURL: "https://studio-1084069868-b52ab-default-rtdb.firebaseio.com",
  projectId: "studio-1084069868-b52ab",
  storageBucket: "studio-1084069868-b52ab.firebasestorage.app",
  messagingSenderId: "243075375047",
  appId: "1:243075375047:web:eddc9c9e86681afe82c3e2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

// --- Initialize BOTH databases ---
const db = getFirestore(app); // Firestore instance
const dbRealtime = RTDB.getDatabase(app); // Realtime Database instance, using RTDB.getDatabase

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
    RTDB as dbRTExports, // Exporting RTDB for other files to use if needed
    // Auth exports
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
};
