// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration will be populated here automatically by Firebase App Hosting.
const firebaseConfig = {"apiKey":"your-api-key","authDomain":"your-auth-domain","projectId":"your-project-id","storageBucket":"your-storage-bucket","messagingSenderId":"your-messaging-sender-id","appId":"your-app-id"};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
