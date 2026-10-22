// Firebase Client Configuration for RoadWatch Web Portal
// Free Spark Plan Compatible ($0)

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJrjeHWvrm6-DR0q4LcS6CnUJnK8DyaT0",
  authDomain: "potholes-a989e.firebaseapp.com",
  projectId: "potholes-a989e",
  storageBucket: "potholes-a989e.firebasestorage.app",
  messagingSenderId: "447838677282",
  appId: "1:447838677282:web:2fa4ae05a26960b71a1d7b",
  measurementId: "G-HVWVQ4P1F8"
};

const STORAGE_KEY = "roadwatch_firebase_config";

/**
 * Retrieve saved Firebase config from localStorage or defaults
 */
export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.projectId &&
        parsed.apiKey &&
        parsed.apiKey.length > 15 &&
        !parsed.apiKey.includes('YOUR_') &&
        parsed.projectId !== 'roadwatch-12345'
      ) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load saved Firebase config:", err);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Persist user-entered Firebase credentials in browser storage
 */
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error("Failed to save Firebase config:", err);
    return false;
  }
}

/**
 * Clear stored credentials
 */
export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if the current config contains valid keys
 */
export function isFirebaseConfigured(config = null) {
  const cfg = config || getSavedFirebaseConfig();
  return Boolean(
    cfg &&
    cfg.apiKey &&
    cfg.apiKey.trim().length > 10 &&
    cfg.projectId &&
    cfg.projectId.trim().length > 2 &&
    !cfg.apiKey.includes("YOUR_")
  );
}
