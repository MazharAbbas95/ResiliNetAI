import * as Location from 'expo-location';
import { useLocationStore } from '@store/locationStore';

export const permissionService = {
  async requestForegroundPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus === 'granted') {
      // Attempt to get background permissions as well for better persistence
      await Location.requestBackgroundPermissionsAsync().catch(e => console.log('Background permissions skipped:', e));
      
      useLocationStore.getState().setPermissionState('granted');
      return true;
    }
    
    useLocationStore.getState().setPermissionState('denied');
    return false;
  },

  async checkPermissionStatus(): Promise<Location.PermissionStatus> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  },
};
