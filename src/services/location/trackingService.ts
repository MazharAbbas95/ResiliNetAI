import * as Location from 'expo-location';
import { useLocationStore } from '@store/locationStore';
import { UserLocation } from '@appTypes/geospatial';
import { MAPS_CONFIG } from '@config/maps';

let subscription: Location.LocationSubscription | null = null;

function processLocationPayload(location: Location.LocationObject): boolean {
  const store = useLocationStore.getState();

  if (!location || !location.coords) {
    store.setLocationStateAndConfidence('LOCATION_UNVERIFIED', 0);
    return false;
  }

  const { latitude, longitude, accuracy, heading, speed } = location.coords;
  const timestamp = location.timestamp;

  // GPS Lock Rejection: (0,0) is completely invalid, or undefined/null/NaN
  if (
    latitude === undefined || 
    longitude === undefined || 
    latitude === null || 
    longitude === null || 
    isNaN(latitude) || 
    isNaN(longitude) || 
    (latitude === 0 && longitude === 0)
  ) {
    console.error('[trackingService] Catastrophic coordinate block: invalid GPS coordinates detected!');
    store.setLocationStateAndConfidence('LOCATION_UNVERIFIED', 0);
    return false;
  }

  // 1. GPS Accuracy Score
  // Excellent: <= 5m -> 1.0, Good: <= 15m -> 0.9, Fair: <= 30m -> 0.7, Poor: > 30m -> 0.4
  let accuracyScore = 1.0;
  if (accuracy) {
    if (accuracy <= 5) accuracyScore = 1.0;
    else if (accuracy <= 15) accuracyScore = 0.9;
    else if (accuracy <= 30) accuracyScore = 0.7;
    else accuracyScore = 0.4;
  }

  // 2. Signal Integrity
  // Stronger signal if accuracy resolves beautifully
  const signalIntegrity = accuracy && accuracy < 10 ? 1.0 : 0.8;

  // 3. Freshness Score
  // Degrades if reading is older than 10 seconds
  const ageMs = Date.now() - timestamp;
  const freshnessScore = Math.max(0, Math.min(1, 1 - ageMs / 10000));

  // Dynamic Location Confidence
  const locationConfidence = Math.round(accuracyScore * signalIntegrity * freshnessScore * 100);

  // Coordinate staleness expiration: 120 seconds (2 minutes)
  const isStale = ageMs > 120000;

  const locState = (locationConfidence < 40 || isStale) ? 'LOCATION_UNVERIFIED' : 'LOCATION_VERIFIED';
  store.setLocationStateAndConfidence(locState, isStale ? 0 : locationConfidence);

  const userLoc: UserLocation = {
    latitude,
    longitude,
    heading,
    accuracy,
    speed,
    timestamp,
  };
  store.setLocation(userLoc);
  return true;
}

export const trackingService = {
  async startTracking() {
    if (subscription) return;

    useLocationStore.getState().setTrackingState('tracking');

    // Get initial position immediately to seed the store
    try {
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      processLocationPayload(initialLocation);
    } catch (e) {
      console.warn('Could not get initial location. Applying tactical default Lahore coordinates.');
      const store = useLocationStore.getState();
      const fallbackLoc: Location.LocationObject = {
        coords: {
          latitude: 31.5204,
          longitude: 74.3587,
          altitude: 0,
          accuracy: 100,
          altitudeAccuracy: 100,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now()
      };
      processLocationPayload(fallbackLoc);
      store.setLocationStateAndConfidence('LOCATION_UNVERIFIED', 0);
    }

    try {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: MAPS_CONFIG.locationUpdateInterval,
          distanceInterval: MAPS_CONFIG.locationUpdateDistance,
        },
        (location) => {
          processLocationPayload(location);
        }
      );
    } catch (err) {
      console.error('[trackingService] watchPositionAsync failed. User remains on fallback coordinates.');
    }
  },

  stopTracking() {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
    useLocationStore.getState().setTrackingState('idle');
  },
};
