'use client';
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
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
    orderBy,
    addDoc
} from "firebase/firestore";

// --- Realtime Database Imports ---
import * as RTDB from "firebase/database";

// ¡CORREGIDO! Se utiliza la configuración exacta proporcionada por el usuario.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDrZo9X6NNtazx4J9kS9L5D1NUswQTQ0SM",
  authDomain: "studio-1084069868-b52ab.firebaseapp.com",
  databaseURL: "https://studio-1084069868-b52ab-default-rtdb.firebaseio.com",
  projectId: "studio-1084069868-b52ab",
  storageBucket: "studio-1084069868-b52ab.firebasestorage.app", // <--- Valor corregido y validado
  messagingSenderId: "243075375047",
  appId: "1:243075375047:web:eddc9c9e86681afe82c3e2"
};


// Initialize Firebase
// Esta lógica previene que la app se inicialice más de una vez, lo cual es una buena práctica.
let app;
try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
    console.error("Error al inicializar Firebase. Revisa que la configuración sea correcta.", e);
    // En caso de un error de inicialización, intenta recuperar la app existente si es posible.
    app = getApp(); 
}

const auth = getAuth(app);
const storage = getStorage(app);

// --- Initialize BOTH databases ---
let db;
let dbRealtime;
try {
    db = getFirestore(app); // Instancia de Firestore
    dbRealtime = RTDB.getDatabase(app); // Instancia de Realtime Database
} catch (e) {
    console.error("Error al inicializar las bases de datos de Firebase. Revisa tu configuración.", e);
}

// Exporta todo lo que necesitas para usar en el resto de la aplicación
export {
    app,
    auth,
    storage,
    db, // Firestore
    dbRealtime, // Realtime DB
    // Firestore methods
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
    addDoc,
    // Realtime DB methods
    RTDB
};
