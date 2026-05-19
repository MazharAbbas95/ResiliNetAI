import { collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { Alert } from '@appTypes/intelligence';
import { useAlertStore } from '@store/alertStore';
import { sanitizePayload } from '../../utils/firebaseSanitizer';

export const alertService = {
  subscribeToAlerts() {
    const alertsRef = collection(db, COLLECTIONS.ALERTS);
    const q = query(alertsRef, orderBy('sentAt', 'desc'), limit(50));

    return onSnapshot(q, (snapshot) => {
      const alerts: Alert[] = [];
      snapshot.forEach((doc) => {
        alerts.push({ id: doc.id, ...doc.data() } as Alert);
      });
      useAlertStore.getState().setActiveAlerts(alerts);
    }, (error) => {
      console.error('Alert Sync Error:', error);
    });
  },

  async createAlert(alert: Omit<Alert, 'id'>): Promise<string> {
    try {
      const sanitized = sanitizePayload(alert);
      const docRef = await addDoc(collection(db, COLLECTIONS.ALERTS), sanitized);
      console.log(`[AlertService] Saved new verified alert to Firestore: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('[AlertService] Error creating Firestore alert:', error);
      throw error;
    }
  }
};
