import { adminDb } from '../config/firebaseAdmin.ts';

export class ShelterService {
  /**
   * Retrieves all shelters from the Firestore database.
   */
  static async getAllShelters(): Promise<any[]> {
    const snapshot = await adminDb.collection('shelters').get();
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Creates or registers a new emergency shelter.
   */
  static async createShelter(payload: any): Promise<string> {
    const docRef = adminDb.collection('shelters').doc();
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
