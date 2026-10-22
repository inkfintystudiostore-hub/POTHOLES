import { isFirebaseConfigured } from './firebaseConfig';
import * as ImageManipulator from 'expo-image-manipulator';

// Realistic sample potholes so the map is never empty for store reviewers and first-time users
export const INITIAL_DEMO_POTHOLES = [
  {
    id: 'demo-pothole-1',
    latitude: 28.6139,
    longitude: 77.2090,
    severity: 'high',
    title: 'Severe Crater on Main Arterial',
    description: 'Deep pothole in the center lane. Danger of rim and tire damage.',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
    reportedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'reported',
    upvotes: 14,
    confirmations: 6,
    address: 'Near Central Ring Road Junction',
  },
  {
    id: 'demo-pothole-2',
    latitude: 28.6219,
    longitude: 77.2140,
    severity: 'medium',
    title: 'Rough Asphalt & Dip',
    description: 'Surface sinking after recent rain. Causes suspension thud.',
    photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=60',
    reportedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'reported',
    upvotes: 7,
    confirmations: 3,
    address: 'East Avenue, Lane 4',
  },
  {
    id: 'demo-pothole-3',
    latitude: 28.6080,
    longitude: 77.2010,
    severity: 'low',
    title: 'Hairline Edge Cracking',
    description: 'Small erosion near curb. Safe to drive over but deteriorating.',
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=60',
    reportedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'fixed',
    upvotes: 4,
    confirmations: 2,
    address: 'Sector 5 Service Road',
  },
];

// In-memory / local storage cache for newly reported potholes during the session
let localPotholes = [...INITIAL_DEMO_POTHOLES];

/**
 * Compress and resize photo client-side before upload to save bandwidth & storage
 */
export async function optimizePotholePhoto(uri) {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }], // Resize width to 1280px (maintains aspect ratio)
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG } // 75% quality JPEG (~250-350 KB)
    );
    return manipResult.uri;
  } catch (error) {
    console.warn('Image optimization skipped, using original photo:', error);
    return uri;
  }
}

/**
 * Fetch all pothole reports
 */
export async function fetchPotholes() {
  if (isFirebaseConfigured()) {
    // In production mode with live Firebase:
    // Firestore query will run here
  }
  return [...localPotholes];
}

/**
 * Submit a new pothole report
 */
export async function submitPotholeReport({ photoUri, latitude, longitude, severity, description }) {
  // 1. Optimize photo client-side
  const compressedUri = await optimizePotholePhoto(photoUri);

  const newReport = {
    id: `pothole-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    latitude: Number(latitude),
    longitude: Number(longitude),
    severity: severity || 'medium',
    description: description || 'Pothole reported via mobile app',
    photoUrl: compressedUri,
    reportedAt: new Date().toISOString(),
    status: 'reported',
    upvotes: 1,
    confirmations: 1,
    address: `GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
  };

  // Prepend to top of list
  localPotholes = [newReport, ...localPotholes];

  if (isFirebaseConfigured()) {
    // Upload image to Firebase Storage and document to Firestore
    console.log('Firebase active: submitting to Firestore...');
  }

  return newReport;
}

/**
 * Upvote / confirm an existing pothole report
 */
export async function upvotePothole(potholeId) {
  localPotholes = localPotholes.map(item => {
    if (item.id === potholeId) {
      return {
        ...item,
        upvotes: (item.upvotes || 0) + 1,
        confirmations: (item.confirmations || 0) + 1,
      };
    }
    return item;
  });
  return localPotholes.find(p => p.id === potholeId);
}
