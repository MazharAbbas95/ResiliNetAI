import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { Alert } from '@appTypes/intelligence';
import { useAlertStore } from '@store/alertStore';

export const alertRealtime = {
  subscribe(): () => void {
    console.log('[Realtime] Subscribing to Alerts...');
    const alertsRef = collection(db, COLLECTIONS.ALERTS);
    const q = query(alertsRef, orderBy('sentAt', 'desc'), limit(50));

    return onSnapshot(q, (snapshot) => {
      const alerts: Alert[] = [];
      snapshot.forEach((doc) => {
        alerts.push({ id: doc.id, ...doc.data() } as Alert);
      });
      useAlertStore.getState().setActiveAlerts(alerts);
      console.log(`[Realtime] Synced ${alerts.length} alerts.`);
    }, (error) => {
      console.error('[Realtime] Alert Sync Error:', error);
    });
  }
};
