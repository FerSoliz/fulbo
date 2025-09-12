// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration will be populated here automatically by Firebase App Hosting.
const firebaseConfig = {"apiKey":"your-api-key","authDomain":"sudonesite2.firebaseapp.com","projectId":"sudonesite2","storageBucket":"sudonesite2.appspot.com","messagingSenderId":"397488055627","appId":"1:397488055627:web:2120b08053c30623348039"};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage, GoogleAuthProvider, signInWithPopup };
