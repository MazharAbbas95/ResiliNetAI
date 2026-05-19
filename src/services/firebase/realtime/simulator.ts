import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';

/**
 * Realtime Simulation Utility
 * Used during development to trigger cloud updates and verify frontend reactivity.
 */
export const realtimeSimulator = {
  /**
   * Escalates a hazard's severity in Firestore.
   */
  async escalateHazard(id: string) {
    console.log(`[Simulator] Escalating hazard ${id}...`);
    const hazardRef = doc(db, COLLECTIONS.HAZARDS, id);
    await updateDoc(hazardRef, {
      severity: 'Critical',
      updatedAt: Date.now(),
      'metadata.confidence': 0.99
    });
  },

  /**
   * Toggles shelter operational status.
   */
  async toggleShelterStatus(id: string, status: 'Open' | 'Full' | 'Closed') {
    console.log(`[Simulator] Updating shelter ${id} to ${status}...`);
    const shelterRef = doc(db, COLLECTIONS.SHELTERS, id);
    await updateDoc(shelterRef, {
      operationalStatus: status
    });
  }
};
