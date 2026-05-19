import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { SystemStatus } from '@appTypes/intelligence';
import { useUIStore } from '@store/uiStore';

export const systemService = {
  subscribeToSystemStatus() {
    const statusRef = doc(db, COLLECTIONS.SYSTEM_STATUS, 'global');

    return onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const status = snapshot.data() as SystemStatus;
        // Future: Update global UI state based on system health
        console.log('[SystemStatus] AI Health:', status.aiStatus);
      }
    }, (error) => {
      console.error('System Status Sync Error:', error);
    });
  }
};
