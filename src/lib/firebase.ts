// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrZo9X6NNtazx4J9kS9L5D1NUswQTQ0SM",
  authDomain: "studio-1084069868-b52ab.firebaseapp.com",
  projectId: "studio-1084069868-b52ab",
  storageBucket: "studio-1084069868-b52ab.appspot.com",
  messagingSenderId: "243075375047",
  appId: "1:243075375047:web:eddc9c9e86681afe82c3e2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

// Check if the config is just placeholder values
const isMockConfig = firebaseConfig.apiKey.startsWith("AIza");

if (isMockConfig && typeof window !== 'undefined') {
    console.warn("Firebase config is using placeholder values. Please replace them in src/lib/firebase.ts");
}


export { app, auth, storage, GoogleAuthProvider, signInWithPopup };
