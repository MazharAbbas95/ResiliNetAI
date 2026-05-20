import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
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

// Initialize Auth with permanent AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Storage
export const storage = getStorage(app);

export default app;
