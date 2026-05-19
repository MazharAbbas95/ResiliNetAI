import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { AILog } from '@appTypes/intelligence';
import { useAIStore } from '@store/aiStore';

export const aiRealtime = {
  subscribe(): () => void {
    console.log('[Realtime] Subscribing to AI Intelligence...');
    const logsRef = collection(db, COLLECTIONS.AI_LOGS);
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(10));

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestLog = snapshot.docs[0].data() as AILog;
        useAIStore.getState().setOrchestrating(true);
        useAIStore.getState().setObjective(latestLog.outputSummary);
        useAIStore.getState().updateStats(snapshot.size);
      }
    }, (error) => {
      console.error('[Realtime] AI Sync Error:', error);
    });
  }
};
