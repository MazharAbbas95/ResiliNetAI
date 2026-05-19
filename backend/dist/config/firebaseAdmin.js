"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMessaging = exports.adminAuth = exports.adminDb = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("./env");
// Initialize Firebase Admin SDK as a singleton
if (!firebase_admin_1.default.apps.length) {
    try {
        if (env_1.ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
            // Load from local file in development
            const serviceAccount = require(env_1.ENV.FIREBASE_SERVICE_ACCOUNT_PATH);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
            console.log('[Firebase Admin] Initialized via Service Account JSON.');
        }
        else {
            // Fallback for cloud environments (Cloud Run, Functions, etc.)
            firebase_admin_1.default.initializeApp();
            console.log('[Firebase Admin] Initialized via Default Credentials.');
        }
    }
    catch (error) {
        console.error('[Firebase Admin] Initialization Error:', error);
    }
}
exports.adminDb = firebase_admin_1.default.firestore();
exports.adminAuth = firebase_admin_1.default.auth();
exports.adminMessaging = firebase_admin_1.default.messaging();
exports.default = firebase_admin_1.default;
