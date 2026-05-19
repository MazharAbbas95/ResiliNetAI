import admin from 'firebase-admin';
import path from 'path';
import { ENV } from './env';

// Initialize Firebase Admin SDK as a singleton
if (!admin.apps.length) {
  try {
    if (ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Load from local file in development
      // Resolve path relative to backend root (one level up from config)
      const serviceAccountPath = path.resolve(__dirname, '../../', ENV.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[Firebase Admin] Initialized via: ${serviceAccountPath}`);
    } else {
      // Fallback for cloud environments (Cloud Run, Functions, etc.)
      admin.initializeApp();
      console.log('[Firebase Admin] Initialized via Default Credentials.');
    }
  } catch (error) {
    console.error('[Firebase Admin] Initialization Error:', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();

export default admin;
