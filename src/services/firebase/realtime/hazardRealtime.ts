import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { HazardZone } from '@appTypes/geospatial';
import { useHazardStore } from '@store/hazardStore';

export const hazardRealtime = {
  subscribe(): () => void {
    console.log('[Realtime] Subscribing to Hazards...');
    const hazardsRef = collection(db, COLLECTIONS.HAZARDS);
    const q = query(hazardsRef, where('isActive', '==', true));

    return onSnapshot(q, (snapshot) => {
      const hazards: HazardZone[] = [];
      snapshot.forEach((doc) => {
        hazards.push({ id: doc.id, ...doc.data() } as HazardZone);
      });
      useHazardStore.getState().setHazardZones(hazards);
      console.log(`[Realtime] Synced ${hazards.length} hazards.`);
    }, (error) => {
      console.error('[Realtime] Hazard Sync Error:', error);
    });
  }
};
