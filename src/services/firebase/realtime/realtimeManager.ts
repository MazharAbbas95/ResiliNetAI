import { hazardRealtime } from './hazardRealtime';
import { alertRealtime } from './alertRealtime';
import { shelterRealtime } from './shelterRealtime';
import { aiRealtime } from './aiRealtime';

class RealtimeManager {
  private activeSubscriptions: Map<string, () => void> = new Map();

  /**
   * Initializes the entire realtime synchronization pipeline.
   * This is typically called at the root of the application or core screens.
   */
  start() {
    if (this.activeSubscriptions.size > 0) {
      console.warn('[RealtimeManager] Pipeline already running. Skipping initialization.');
      return;
    }

    console.log('[RealtimeManager] Launching Operational Intelligence Pipeline...');

    this.subscribe('hazards', hazardRealtime.subscribe());
    this.subscribe('alerts', alertRealtime.subscribe());
    this.subscribe('shelters', shelterRealtime.subscribe());
    this.subscribe('ai_intelligence', aiRealtime.subscribe());
    
    console.log(`[RealtimeManager] Successfully initialized ${this.activeSubscriptions.size} intelligence streams.`);
  }

  /**
   * Gracefully shuts down all active listeners to prevent memory leaks and redundant data usage.
   */
  stop() {
    console.log('[RealtimeManager] Deactivating Intelligence Pipeline...');
    this.activeSubscriptions.forEach((unsubscribe, key) => {
      console.log(`[RealtimeManager] Cleaning up stream: ${key}`);
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }

  private subscribe(key: string, unsubscribe: () => void) {
    this.activeSubscriptions.set(key, unsubscribe);
  }

  /**
   * Development debugging tool to view active streams.
   */
  getDiagnostics() {
    return Array.from(this.activeSubscriptions.keys());
  }
}

export const realtimeManager = new RealtimeManager();
