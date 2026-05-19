"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShelterService = void 0;
const firebaseAdmin_1 = require("@/config/firebaseAdmin");
class ShelterService {
    /**
     * Retrieves all shelters from the Firestore database.
     */
    static async getAllShelters() {
        const snapshot = await firebaseAdmin_1.adminDb.collection('shelters').get();
        return snapshot.docs.map(doc => doc.data());
    }
    /**
     * Creates or registers a new emergency shelter.
     */
    static async createShelter(payload) {
        const docRef = firebaseAdmin_1.adminDb.collection('shelters').doc();
        const shelterData = {
            ...payload,
            id: docRef.id,
            createdAt: Date.now(),
            status: 'Active',
        };
        await docRef.set(shelterData);
        return docRef.id;
    }
}
exports.ShelterService = ShelterService;
