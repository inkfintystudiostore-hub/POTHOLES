import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { getSavedFirebaseConfig, isFirebaseConfigured } from './firebaseConfig';
import { INITIAL_POTHOLES } from '../data/mockPotholes';

let appInstance = null;
let firestoreDb = null;
let activeUnsubscribe = null;

/**
 * Initialize or re-initialize Firebase instance
 */
export function getFirebaseInstance(customConfig = null) {
  const config = customConfig || getSavedFirebaseConfig();
  if (!isFirebaseConfigured(config)) {
    return null;
  }

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    firestoreDb = getFirestore(appInstance);
    return { app: appInstance, db: firestoreDb };
  } catch (err) {
    console.error('Error initializing Firebase client:', err);
    return null;
  }
}

/**
 * Reset Firebase connection (e.g. after user updates credentials)
 */
export function reconnectFirebase(newConfig) {
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }
  appInstance = null;
  firestoreDb = null;
  return getFirebaseInstance(newConfig);
}

/**
 * Seed Firestore with initial demo potholes if empty
 */
export async function seedDemoPotholesIfEmpty(db) {
  try {
    const potholesRef = collection(db, 'potholes');
    const existingSnap = await getDocs(potholesRef);
    if (existingSnap.empty) {
      console.log('Seeding initial demo potholes into Firestore...');
      for (const p of INITIAL_POTHOLES) {
        await setDoc(doc(db, 'potholes', p.id), {
          ...p,
          reportedAt: p.reportedAt || new Date().toISOString()
        });
      }
      console.log('Initial demo potholes seeded successfully.');
    }
  } catch (err) {
    console.warn('Could not seed initial demo potholes:', err);
  }
}

/**
 * Subscribe to real-time pothole updates across all connected devices
 * Returns an unsubscribe function.
 */
export function subscribeToLivePotholes(onData, onError) {
  const fb = getFirebaseInstance();
  if (!fb || !fb.db) {
    console.log('[RoadWatch] Running in offline / local prototype mode.');
    onData(INITIAL_POTHOLES, false);
    return () => {};
  }

  const { db } = fb;
  seedDemoPotholesIfEmpty(db);

  try {
    const q = query(collection(db, 'potholes'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveList = [];
        snapshot.forEach((docSnap) => {
          liveList.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });

        // If collection exists with items, use it; otherwise fallback to initial
        const result = liveList.length > 0 ? liveList : INITIAL_POTHOLES;
        onData(result, true);
      },
      (error) => {
        console.error('[RoadWatch] Firestore snapshot error:', error);
        if (onError) onError(error);
        // Fallback to local
        onData(INITIAL_POTHOLES, false);
      }
    );

    activeUnsubscribe = unsubscribe;
    return unsubscribe;
  } catch (err) {
    console.error('[RoadWatch] Failed to set up snapshot listener:', err);
    if (onError) onError(err);
    onData(INITIAL_POTHOLES, false);
    return () => {};
  }
}

/**
 * Submit a newly reported pothole to Firestore
 */
export async function publishPotholeToCloud(potholeData) {
  const fb = getFirebaseInstance();
  if (!fb || !fb.db) {
    console.log('[RoadWatch] Local mock save (Firebase not configured)');
    return { success: true, localOnly: true, data: potholeData };
  }

  try {
    const id = potholeData.id || `pothole-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(fb.db, 'potholes', id);
    const payload = {
      ...potholeData,
      id,
      reportedAt: potholeData.reportedAt || new Date().toISOString(),
      status: potholeData.status || 'reported',
      upvotes: potholeData.upvotes ?? 1,
      confirmations: potholeData.confirmations ?? 1
    };

    await setDoc(docRef, payload, { merge: true });
    return { success: true, localOnly: false, data: payload };
  } catch (error) {
    console.error('[RoadWatch] Error publishing to Firestore:', error);
    throw error;
  }
}

/**
 * Update an existing pothole (e.g. upvotes, status to 'fixed', before/after photo)
 */
export async function updatePotholeInCloud(potholeId, updates) {
  const fb = getFirebaseInstance();
  if (!fb || !fb.db) {
    return { success: true, localOnly: true };
  }

  try {
    const docRef = doc(fb.db, 'potholes', potholeId);
    await updateDoc(docRef, updates);
    return { success: true, localOnly: false };
  } catch (error) {
    console.error('[RoadWatch] Error updating Firestore document:', error);
    throw error;
  }
}
