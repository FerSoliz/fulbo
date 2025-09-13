// This file is intentionally left with mock data as Firebase is not being used for authentication.
// You can remove this file or repurpose it if you decide to use other Firebase services.

const firebaseConfig = {
    apiKey: "mock-key",
    authDomain: "mock-domain.firebaseapp.com",
    projectId: "mock-project",
    storageBucket: "mock-project.appspot.com",
    messagingSenderId: "mock-sender-id",
    appId: "mock-app-id"
};

// Mock Firebase services if needed elsewhere to avoid crashes
const app = {};
const auth = {};
const storage = {};
const GoogleAuthProvider = function() {};
const signInWithPopup = () => Promise.reject("Firebase auth is not configured.");

export { app, auth, storage, GoogleAuthProvider, signInWithPopup };
