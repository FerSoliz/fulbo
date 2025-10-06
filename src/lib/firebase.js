'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = exports.signInWithEmailAndPassword = exports.createUserWithEmailAndPassword = exports.onAuthStateChanged = exports.sendPasswordResetEmail = exports.signInWithPopup = exports.GoogleAuthProvider = exports.db = exports.storage = exports.auth = exports.app = void 0;
var app_1 = require("firebase/app");
var auth_1 = require("firebase/auth");
Object.defineProperty(exports, "GoogleAuthProvider", { enumerable: true, get: function () { return auth_1.GoogleAuthProvider; } });
Object.defineProperty(exports, "signInWithPopup", { enumerable: true, get: function () { return auth_1.signInWithPopup; } });
Object.defineProperty(exports, "sendPasswordResetEmail", { enumerable: true, get: function () { return auth_1.sendPasswordResetEmail; } });
Object.defineProperty(exports, "onAuthStateChanged", { enumerable: true, get: function () { return auth_1.onAuthStateChanged; } });
Object.defineProperty(exports, "createUserWithEmailAndPassword", { enumerable: true, get: function () { return auth_1.createUserWithEmailAndPassword; } });
Object.defineProperty(exports, "signInWithEmailAndPassword", { enumerable: true, get: function () { return auth_1.signInWithEmailAndPassword; } });
Object.defineProperty(exports, "signOut", { enumerable: true, get: function () { return auth_1.signOut; } });
var storage_1 = require("firebase/storage");
var database_1 = require("firebase/database");
// La configuración de Firebase no cambia
var firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};
// --- INICIALIZACIÓN DE FIREBASE ---
var app = !(0, app_1.getApps)().length ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApp)();
exports.app = app;
// --- SERVICIOS ---
var auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
var storage = (0, storage_1.getStorage)(app);
exports.storage = storage;
// ¡CORRECCIÓN CLAVE! Ahora `db` es la instancia de Realtime Database.
var db = (0, database_1.getDatabase)(app);
exports.db = db;
