import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { Shelter } from '@appTypes/intelligence';
import { useShelterStore } from '@store/shelterStore';

export const shelterRealtime = {
  subscribe(): () => void {
    console.log('[Realtime] Subscribing to Shelters...');
    const sheltersRef = collection(db, COLLECTIONS.SHELTERS);

    return onSnapshot(sheltersRef, (snapshot) => {
      const shelters: Shelter[] = [];
      snapshot.forEach((doc) => {
        shelters.push({ id: doc.id, ...doc.data() } as Shelter);
      });
      useShelterStore.getState().setShelters(shelters);
      console.log(`[Realtime] Synced ${shelters.length} shelters.`);
    }, (error) => {
      console.error('[Realtime] Shelter Sync Error:', error);
    });
  }
};
