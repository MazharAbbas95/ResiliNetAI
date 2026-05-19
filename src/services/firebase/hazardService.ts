import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { HazardZone } from '@appTypes/geospatial';
import { useHazardStore } from '@store/hazardStore';
import { sanitizePayload } from '../../utils/firebaseSanitizer';

export const hazardService = {
  subscribeToHazards() {
    const hazardsRef = collection(db, COLLECTIONS.HAZARDS);
    const q = query(hazardsRef, where('isActive', '==', true));

    return onSnapshot(q, (snapshot) => {
      const hazards: HazardZone[] = [];
      snapshot.forEach((doc) => {
        hazards.push({ id: doc.id, ...doc.data() } as HazardZone);
      });
      useHazardStore.getState().setHazardZones(hazards);
    }, (error) => {
      console.error('Hazard Sync Error:', error);
    });
  },

  async createHazard(hazard: Omit<HazardZone, 'id'>, customDocId?: string): Promise<string> {
    try {
      const sanitized = sanitizePayload(hazard);
      if (customDocId) {
        const docRef = doc(db, COLLECTIONS.HAZARDS, customDocId);
        await setDoc(docRef, sanitized);
        return customDocId;
      } else {
        const docRef = await addDoc(collection(db, COLLECTIONS.HAZARDS), sanitized);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error creating hazard:', error);
      throw error;
    }
  },

  async updateHazard(id: string, updates: Partial<HazardZone>) {
    try {
      const hazardRef = doc(db, COLLECTIONS.HAZARDS, id);
      const sanitized = sanitizePayload(updates);
      await updateDoc(hazardRef, sanitized);
    } catch (error) {
      console.error('Error updating hazard:', error);
      throw error;
    }
  }
};
