import { adminDb } from '../config/firebaseAdmin.ts';
import { HazardPayload, AlertPayload } from '../types/index.ts';

export class FirebaseService {
  /**
   * Adds a new hazard zone to Firestore.
   */
  static async createHazard(payload: HazardPayload): Promise<string> {
    const docRef = adminDb.collection('hazards').doc();
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
  static async createAlert(payload: AlertPayload): Promise<string> {
    const docRef = adminDb.collection('alerts').doc();
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
