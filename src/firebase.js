import { getApps, getApp, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

// Firebase Web App configuration supplied for AquaFlow.
// Google Sign-In also requires the Google provider to be enabled in
// Firebase Authentication and localhost to be an authorized domain.
const firebaseConfig = {
  apiKey: "AIzaSyDTK_FCaKofq6zzQm32Fig4ABo0L8mMuEU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "flow-5ffcb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flow-5ffcb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flow-5ffcb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "96067983074",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:96067983074:web:9219fca22030188b6e30bb",
  measurementId: "G-40RS37Q9SJ",
};

let app;
let auth;
let googleProvider;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const isFirebaseConfigured = () => Boolean(auth && googleProvider);

export async function signOutFirebase() {
  if (auth) await signOut(auth);
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    const error = new Error("Firebase Authentication is not initialized.");
    error.code = "auth/not-configured";
    throw error;
  }
  return signInWithPopup(auth, googleProvider);
}

export { app, auth, googleProvider, firebaseConfig };
export default app;
