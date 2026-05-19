import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  initializeAuth, 
  getAuth,
  // @ts-ignore - getReactNativePersistence is specifically for React Native environments
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '@config/firebase';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

/**
 * Initialize Auth with Persistence
 * We use a dedicated initialization block to ensure AsyncStorage is correctly linked
 * and to prevent "already-initialized" errors during Hot Reloading.
 */
const getSafeAuth = () => {
  try {
    const existingAuth = getAuth(app);
    return existingAuth;
  } catch (e) {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
};

export const auth = getSafeAuth();

// Initialize Storage
export const storage = getStorage(app);

export default app;
