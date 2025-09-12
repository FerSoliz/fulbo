// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration will be populated here automatically by Firebase App Hosting.
const firebaseConfig = {"apiKey":"your-api-key","authDomain":"sudonesite2.firebaseapp.com","projectId":"sudonesite2","storageBucket":"sudonesite2.appspot.com","messagingSenderId":"397488055627","appId":"1:397488055627:web:2120b08053c30623348039"};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

// Development-only: Force admin login simulation
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // This part simulates the admin user being logged in for local development.
    // It will not run in the deployed production environment.
    try {
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    } catch (e) {
        // Emulator might already be connected
    }
}


export { app, auth, storage, GoogleAuthProvider, signInWithPopup };
