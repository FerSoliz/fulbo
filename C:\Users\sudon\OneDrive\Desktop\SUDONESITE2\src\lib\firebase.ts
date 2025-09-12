// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration will be populated here automatically by Firebase App Hosting.
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
