"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const firebaseAdmin_1 = require("@/config/firebaseAdmin");
class FirebaseService {
    /**
     * Adds a new hazard zone to Firestore.
     */
    static async createHazard(payload) {
        const docRef = firebaseAdmin_1.adminDb.collection('hazards').doc();
        const hazardData = {
            ...payload,
            id: docRef.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'Active',
            isActive: true,
            isVisible: true,
        };
        await docRef.set(hazardData);
        return docRef.id;
    }
    /**
     * Dispatches a new emergency alert to Firestore.
     */
    static async createAlert(payload) {
        const docRef = firebaseAdmin_1.adminDb.collection('alerts').doc();
        const alertData = {
            ...payload,
            id: docRef.id,
            createdAt: Date.now(),
            status: 'Active',
        };
        await docRef.set(alertData);
        return docRef.id;
    }
}
exports.FirebaseService = FirebaseService;
