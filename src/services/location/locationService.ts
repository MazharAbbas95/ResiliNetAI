import { permissionService } from './permissionService';
import { trackingService } from './trackingService';
import * as Location from 'expo-location';

export const locationService = {
  async initialize() {
    const isGranted = await permissionService.requestForegroundPermissions();
    if (isGranted) {
      await trackingService.startTracking();
    }
  },

  async getCurrentPosition(): Promise<Location.LocationObject | null> {
    try {
      const isGranted = await permissionService.checkPermissionStatus();
      if (isGranted === 'granted') {
        return await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  },

  shutdown() {
    trackingService.stopTracking();
  },
};
