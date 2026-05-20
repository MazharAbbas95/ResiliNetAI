"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMessaging = exports.adminAuth = exports.adminDb = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("./env");
const fs_1 = __importDefault(require("fs"));
// Initialize Firebase Admin SDK as a singleton
if (!firebase_admin_1.default.apps.length) {
    try {
        if (process.env.FIREBASE_CREDENTIALS) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
            console.log('[Firebase Admin] Initialized successfully via environment variable.');
        }
        else if (env_1.ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
            // Load from local file in development
            const serviceAccountPath = require('path').resolve(__dirname, '../../', env_1.ENV.FIREBASE_SERVICE_ACCOUNT_PATH);
            if (fs_1.default.existsSync(serviceAccountPath)) {
                const serviceAccount = require(serviceAccountPath);
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert(serviceAccount),
                });
                console.log('[Firebase Admin] Initialized via Service Account JSON.');
            }
            else {
                throw new Error(`Firebase credentials file not found at: ${serviceAccountPath}.\n` +
                    `=========================================================================\n` +
                    `🚨 DEPLOYMENT ERROR: MISSING FIREBASE CREDENTIALS 🚨\n` +
                    `To fix this on Render:\n` +
                    `1. Copy the contents of your local 'backend/firebase-services-account.json'\n` +
                    `2. Go to your Render Dashboard -> Environment -> Add Environment Variable\n` +
                    `3. Set Key: FIREBASE_CREDENTIALS\n` +
                    `4. Set Value: (paste the copied JSON contents)\n` +
                    `5. Save and redeploy!\n` +
                    `=========================================================================`);
            }
        }
        else {
            // Fallback for cloud environments (Cloud Run, Functions, etc.)
            firebase_admin_1.default.initializeApp();
            console.log('[Firebase Admin] Initialized via Default Credentials.');
        }
    }
    catch (error) {
        console.error('[Firebase Admin] Initialization Error:', error.message || error);
        process.exit(1);
    }
}
exports.adminDb = firebase_admin_1.default.firestore();
exports.adminAuth = firebase_admin_1.default.auth();
exports.adminMessaging = firebase_admin_1.default.messaging();
exports.default = firebase_admin_1.default;
