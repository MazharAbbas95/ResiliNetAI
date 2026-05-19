import axios from 'axios';

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

export const PlacesAPIService = {
  async findNearbyEmergencyPlaces(lat: number, lng: number, radius: number = 5000) {
    if (!GOOGLE_MAPS_APIKEY) {
      console.error('Google Maps API Key missing for Places API');
      return [];
    }

    // Common emergency keywords/types
    const types = ['hospital', 'police', 'fire_station'];
    let allResults: any[] = [];

    try {
      // For a hackathon, we combine results from multiple types or use a keyword
      const response = await axios.get(PLACES_BASE_URL, {
        params: {
          location: `${lat},${lng}`,
          radius: radius,
          type: 'hospital', // Primary focus for survival
          key: GOOGLE_MAPS_APIKEY,
        },
      });

      if (response.data.status === 'OK') {
        allResults = response.data.results;
      }

      return allResults;
    } catch (error) {
      console.error('Error fetching places:', error);
      return [];
    }
  },
};
