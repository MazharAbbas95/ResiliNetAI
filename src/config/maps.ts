/**
 * Geospatial System Configuration
 * Manages Google Maps keys and operational location parameters.
 */
export const MAPS_CONFIG = {
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  defaultRegion: {
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  locationUpdateInterval: 2000, // 2 seconds
  locationUpdateDistance: 2, // 2 meters
};
