import { hazardService } from './hazardService';
import { alertService } from './alertService';
import { shelterService } from './shelterService';
import { systemService } from './systemService';

class SyncManager {
  private unsubscribers: (() => void)[] = [];

  start() {
    console.log('[SyncManager] Initializing Global Intelligence Pipeline...');
    
    try {
      // Core hazard polygons and tracking
      const unsubHazards = hazardService.subscribeToHazards();
      
      // Emergency notifications
      const unsubAlerts = alertService.subscribeToAlerts();
      
      // Infrastructure markers (Shelters, Hospitals)
      const unsubShelters = shelterService.subscribeToShelters();
      
      // Global platform health
      const unsubSystem = systemService.subscribeToSystemStatus();

      this.unsubscribers.push(unsubHazards, unsubAlerts, unsubShelters, unsubSystem);
    } catch (error) {
      console.error('[SyncManager] Initialization Failed:', error);
    }
  }

  stop() {
    console.log('[SyncManager] Tearing down Intelligence Pipeline...');
    this.unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch (e) {
        console.warn('Error during unsubscription cleanup:', e);
      }
    });
    this.unsubscribers = [];
  }
}

export const syncManager = new SyncManager();
