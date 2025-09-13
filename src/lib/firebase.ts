import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {"apiKey":"API_KEY","authDomain":"PROJECT_ID.firebaseapp.com","projectId":"PROJECT_ID","storageBucket":"PROJECT_ID.appspot.com","messagingSenderId":"SENDER_ID","appId":"APP_ID"};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

// Check if the config is just placeholder values
const isMockConfig = firebaseConfig.apiKey === "API_KEY";

if (isMockConfig) {
    console.warn("Firebase config is not set. Using mock implementation. Please replace placeholder values in src/lib/firebase.ts");
}

export { app, auth, storage, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, isMockConfig as isMocked };
