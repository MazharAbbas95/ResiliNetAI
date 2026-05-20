import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { ENV } from './env';

// Initialize Firebase Admin SDK as a singleton
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_CREDENTIALS) {
      // Load directly from environment variable in cloud environments
      const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase Admin] Initialized successfully via environment variable.');
    } else if (ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Load from local file in development
      const serviceAccountPath = path.resolve(__dirname, '../../', ENV.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(`[Firebase Admin] Initialized via: ${serviceAccountPath}`);
      } else {
        throw new Error(
          `Firebase credentials file not found at: ${serviceAccountPath}.\n` +
          `=========================================================================\n` +
          `🚨 DEPLOYMENT ERROR: MISSING FIREBASE CREDENTIALS 🚨\n` +
          `To fix this on Render:\n` +
          `1. Copy the contents of your local 'backend/firebase-services-account.json'\n` +
          `2. Go to your Render Dashboard -> Environment -> Add Environment Variable\n` +
          `3. Set Key: FIREBASE_CREDENTIALS\n` +
          `4. Set Value: (paste the copied JSON contents)\n` +
          `5. Save and redeploy!\n` +
          `=========================================================================`
        );
      }
    } else {
      // Fallback for cloud environments (Cloud Run, Functions, etc.)
      admin.initializeApp();
      console.log('[Firebase Admin] Initialized via Default Credentials.');
    }
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization Error:', error.message || error);
    // Explicitly exit with status 1 to prevent app running without database
    process.exit(1);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();

export default admin;
