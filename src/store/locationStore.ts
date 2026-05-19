import { create } from 'zustand';
import { UserLocation } from '@appTypes/geospatial';

interface LocationState {
  currentLocation: UserLocation | null;
  previousLocation: UserLocation | null;
  trackingState: 'idle' | 'tracking' | 'error';
  permissionState: 'undetermined' | 'granted' | 'denied';
  isAutoFollowEnabled: boolean;
  locationState: 'LOCATION_PENDING' | 'LOCATION_VERIFIED' | 'LOCATION_UNVERIFIED';
  locationConfidenceScore: number;
  
  // Actions
  setLocation: (location: UserLocation) => void;
  setTrackingState: (state: 'idle' | 'tracking' | 'error') => void;
  setPermissionState: (state: 'undetermined' | 'granted' | 'denied') => void;
  toggleAutoFollow: () => void;
  simulateMovement: (latDelta: number, lngDelta: number) => void;
  setLocationStateAndConfidence: (state: 'LOCATION_PENDING' | 'LOCATION_VERIFIED' | 'LOCATION_UNVERIFIED', confidence: number) => void;
  reset: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  previousLocation: null,
  trackingState: 'idle',
  permissionState: 'undetermined',
  isAutoFollowEnabled: true,
  locationState: 'LOCATION_PENDING',
  locationConfidenceScore: 0,

  setLocation: (location) => set((state) => ({
    previousLocation: state.currentLocation,
    currentLocation: location,
  })),

  setLocationStateAndConfidence: (locationState, locationConfidenceScore) => set({
    locationState,
    locationConfidenceScore
  }),

  simulateMovement: (latDelta, lngDelta) => {
    const current = get().currentLocation;
    if (!current) return;

    const nextLocation: UserLocation = {
      ...current,
      latitude: current.latitude + latDelta,
      longitude: current.longitude + lngDelta,
      heading: latDelta > 0 ? 0 : latDelta < 0 ? 180 : lngDelta > 0 ? 90 : 270,
      timestamp: Date.now(),
    };

    set({ 
      previousLocation: current,
      currentLocation: nextLocation,
      isAutoFollowEnabled: true // Force auto-follow on simulation
    });
  },

  setTrackingState: (trackingState) => set({ trackingState }),
  
  setPermissionState: (permissionState) => set({ permissionState }),

  toggleAutoFollow: () => set((state) => ({ 
    isAutoFollowEnabled: !state.isAutoFollowEnabled 
  })),

  reset: () => set({
    currentLocation: null,
    previousLocation: null,
    trackingState: 'idle',
    permissionState: 'undetermined',
    locationState: 'LOCATION_PENDING',
    locationConfidenceScore: 0,
  }),
}));
