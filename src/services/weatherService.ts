import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

export interface WeatherData {
  location: {
    lat: number;
    lng: number;
  };
  weather: {
    condition: string;
    description: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    cloudCoverage: number;
    pressure: number;
    visibility: number;
    stormProbability: number;
    airQuality: string;
    rainfallProbability: number;
    environmentalStability: 'STABLE' | 'VOLATILE' | 'UNSTABLE';
  };
  alerts: Array<{
    event: string;
    severity: string;
  }>;
  timestamp: number;
}

const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const pendingRequests = new Map<string, Promise<WeatherData>>();
const CACHE_TTL_MS = 60000; // 60-second cache window

const UNAVAILABLE_DATA = (lat: number, lng: number): WeatherData => ({
  location: { lat, lng },
  weather: {
    condition: 'DATA_UNAVAILABLE',
    description: 'Environmental data temporarily unavailable',
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    rainfall: 0,
    cloudCoverage: 0,
    pressure: 1013,
    visibility: 10,
    stormProbability: 0,
    airQuality: 'GOOD',
    rainfallProbability: 0,
    environmentalStability: 'STABLE',
  },
  alerts: [],
  timestamp: Math.floor(Date.now() / 1000),
});

export const weatherService = {
  /**
   * Fetch real-time environmental data directly from OpenWeather API.
   * Calling directly avoids localhost/network issues on mobile devices.
   */
  /**
   * Fetch real-time environmental data directly from OpenWeather API.
   * Calling directly avoids localhost/network issues on mobile devices.
   */
  getWeatherForLocation: async (lat: number, lng: number): Promise<WeatherData> => {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;

    // 1. Check cache window
    const cached = weatherCache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL_MS) {
        // Stale-While-Revalidate: If age is between 30 and 60 seconds, revalidate in background
        if (age > 30000) {
          console.log(`[WeatherService] Cache SWR HIT: returning cached data for key=${key} while refreshing in background.`);
          (async () => {
            try {
              if (pendingRequests.has(key)) return;
              const refreshPromise = weatherService.fetchDirectFromApi(lat, lng, key);
              pendingRequests.set(key, refreshPromise);
              const fresh = await refreshPromise;
              if (fresh.weather.condition !== 'DATA_UNAVAILABLE') {
                weatherCache.set(key, { data: fresh, timestamp: Date.now() });
              }
            } catch (err) {
              console.warn('[WeatherService] SWR Background refresh failed:', err);
            } finally {
              pendingRequests.delete(key);
            }
          })();
        } else {
          console.log(`[WeatherService] Cache HIT for key=${key}`);
        }
        return cached.data;
      }
    }

    // 2. Check pending requests for shared promise resolution
    if (pendingRequests.has(key)) {
      console.log(`[WeatherService] Sharing pending promise resolution for key=${key}`);
      return pendingRequests.get(key)!;
    }

    const fetchPromise = weatherService.fetchDirectFromApi(lat, lng, key);
    pendingRequests.set(key, fetchPromise);
    try {
      const result = await fetchPromise;
      if (result.weather.condition !== 'DATA_UNAVAILABLE') {
        weatherCache.set(key, { data: result, timestamp: Date.now() });
      }
      return result;
    } finally {
      pendingRequests.delete(key);
    }
  },

  fetchDirectFromApi: async (lat: number, lng: number, key: string): Promise<WeatherData> => {
    if (!OPENWEATHER_API_KEY) {
      console.warn('[WeatherService] EXPO_PUBLIC_OPENWEATHER_API_KEY not found. Returning DATA_UNAVAILABLE.');
      return UNAVAILABLE_DATA(lat, lng);
    }

    try {
      const startTime = Date.now();
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&APPID=${OPENWEATHER_API_KEY}`;
      
      console.log(`[WeatherService] Fetching real weather: lat=${lat}, lng=${lng}`);
      const response = await axios.get(url, { timeout: 10000 });
      const latency = Date.now() - startTime;
      console.log(`[WeatherService] Real weather response received in ${latency}ms`);

      // Record real latency in store
      try {
        const { useInfraHealthStore } = require('../store/infraHealthStore');
        useInfraHealthStore.getState().setWeatherApiLatency(latency);
        useInfraHealthStore.getState().setBackendConnected(true);
      } catch (err) {}

      const data = response.data;
      const rainfall = data.rain ? (data.rain['1h'] ?? 0) : 0;
      const windKmh = Math.round((data.wind?.speed ?? 0) * 3.6); // m/s → km/h

      const alerts: WeatherData['alerts'] = [];
      if (rainfall > 10 || windKmh > 50) {
        alerts.push({
          event: 'Storm Warning',
          severity: rainfall > 20 ? 'high' : 'moderate',
        });
      }

      // Compute additional real-world environmental properties
      const pressure = data.main?.pressure ?? 1013;
      const visibility = data.visibility ? (data.visibility / 1000) : 10; // meters to km
      
      // Storm Probability calculation: combines clouds and precipitation
      const clouds = data.clouds?.all ?? 0;
      let stormProbability = Math.round(clouds * 0.7 + (rainfall > 0 ? 30 : 0));
      stormProbability = Math.max(0, Math.min(100, stormProbability));

      // Rainfall Probability
      const rainfallProbability = rainfall > 0 ? 100 : Math.round(clouds * 0.8);

      // Estimated air quality based on stagnation/dispersion
      const humidity = data.main?.humidity ?? 50;
      const windSpeed = data.wind?.speed ?? 2; // m/s
      let aqi = 45;
      if (humidity > 80) aqi += 30; // High moisture traps particulate matter
      if (windSpeed < 2) aqi += 40;  // Stagnation
      else if (windSpeed > 8) aqi -= 20; // Dispersion
      aqi = Math.max(10, Math.min(300, aqi));
      
      let airQuality = 'GOOD';
      if (aqi > 150) airQuality = 'HAZARDOUS';
      else if (aqi > 100) airQuality = 'UNHEALTHY';
      else if (aqi > 50) airQuality = 'MODERATE';

      // Environmental stability
      let environmentalStability: 'STABLE' | 'VOLATILE' | 'UNSTABLE' = 'STABLE';
      if (rainfall > 15 || windKmh > 55) {
        environmentalStability = 'UNSTABLE';
      } else if (rainfall > 5 || windKmh > 30) {
        environmentalStability = 'VOLATILE';
      }

      const weatherResult: WeatherData = {
        location: {
          lat: data.coord.lat,
          lng: data.coord.lon,
        },
        weather: {
          condition: data.weather?.[0]?.main ?? 'Unknown',
          description: data.weather?.[0]?.description ?? 'data unavailable',
          temperature: Math.round(data.main?.temp ?? 0),
          humidity: data.main?.humidity ?? 0,
          windSpeed: windKmh,
          rainfall,
          cloudCoverage: clouds,
          pressure,
          visibility,
          stormProbability,
          airQuality,
          rainfallProbability,
          environmentalStability,
        },
        alerts,
        timestamp: data.dt ?? Math.floor(Date.now() / 1000),
      };

      return weatherResult;
    } catch (error: any) {
      console.error('[WeatherService] Error fetching weather:', error.message ?? error);
      try {
        const { useInfraHealthStore } = require('../store/infraHealthStore');
        useInfraHealthStore.getState().setBackendConnected(false);
      } catch (err) {}
      return UNAVAILABLE_DATA(lat, lng);
    }
  }
};
