import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { Shelter } from '@appTypes/intelligence';
import { useShelterStore } from '@store/shelterStore';

export const shelterService = {
  subscribeToShelters() {
    const sheltersRef = collection(db, COLLECTIONS.SHELTERS);
    const q = query(sheltersRef, where('operationalStatus', '!=', 'Closed'));

    return onSnapshot(q, (snapshot) => {
      const shelters: Shelter[] = [];
      snapshot.forEach((doc) => {
        shelters.push({ id: doc.id, ...doc.data() } as Shelter);
      });
      useShelterStore.getState().setShelters(shelters);
    }, (error) => {
      console.error('Shelter Sync Error:', error);
    });
  }
};
