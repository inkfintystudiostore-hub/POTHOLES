// Firebase Configuration for Mobile App (iOS & Android)
// Free Spark Plan Compatible ($0)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAJrjeHWvrm6-DR0q4LcS6CnUJnK8DyaT0",
  authDomain: "potholes-a989e.firebaseapp.com",
  projectId: "potholes-a989e",
  storageBucket: "potholes-a989e.firebasestorage.app",
  messagingSenderId: "447838677282",
  appId: "1:447838677282:web:2fa4ae05a26960b71a1d7b",
  measurementId: "G-HVWVQ4P1F8"
};

// Check if actual configuration has been supplied
export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
};

let app = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log('[Mobile] Connected to Cloud Firestore:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Mobile] Firebase initialization skipped or failed:', err);
  }
}

export { app, db };
