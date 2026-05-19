import { weatherService, WeatherData } from './weatherService';

export interface EnvironmentContext {
  lat: number;
  lng: number;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  stormRisk: number; // 0 - 100
  airQuality: string;
  environmentalRisk: 'STABLE' | 'VOLATILE' | 'UNSTABLE';
  timestamp: number;
  isStale: boolean;
}

export class EnvironmentContextService {
  private static instance: EnvironmentContextService;
  private cache = new Map<string, { context: EnvironmentContext; timestamp: number }>();
  private pendingPromises = new Map<string, Promise<EnvironmentContext>>();
  private readonly CACHE_TTL_MS = 60000; // 60-second TTL cache window

  private constructor() {}

  public static getInstance(): EnvironmentContextService {
    if (!EnvironmentContextService.instance) {
      EnvironmentContextService.instance = new EnvironmentContextService();
    }
    return EnvironmentContextService.instance;
  }

  private getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }

  public async getEnvironmentContext(lat: number, lng: number): Promise<EnvironmentContext> {
    const key = this.getCacheKey(lat, lng);
    const now = Date.now();

    // 1. Cache HIT check
    const cached = this.cache.get(key);
    if (cached) {
      const age = now - cached.timestamp;
      if (age < this.CACHE_TTL_MS) {
        // SWR Revalidation: trigger background refresh if cache age > 30s
        if (age > 30000) {
          console.log(`[EnvironmentContextService] Cache SWR HIT: returning stale data for key=${key} while refreshing in background.`);
          (async () => {
            try {
              if (this.pendingPromises.has(key)) return;
              const refreshPromise = (async (): Promise<EnvironmentContext> => {
                const weatherData: WeatherData = await weatherService.getWeatherForLocation(lat, lng);
                const w = weatherData.weather;
                return {
                  lat,
                  lng,
                  weatherCondition: w.condition,
                  temperature: w.temperature,
                  humidity: w.humidity,
                  windSpeed: w.windSpeed,
                  pressure: w.pressure,
                  stormRisk: w.stormProbability,
                  airQuality: w.airQuality,
                  environmentalRisk: w.environmentalStability,
                  timestamp: Date.now(),
                  isStale: false,
                };
              })();
              this.pendingPromises.set(key, refreshPromise);
              const fresh = await refreshPromise;
              if (fresh.weatherCondition !== 'DATA_UNAVAILABLE') {
                this.cache.set(key, { context: fresh, timestamp: Date.now() });
              }
            } catch (err) {
              console.warn('[EnvironmentContextService] SWR Background refresh failed:', err);
            } finally {
              this.pendingPromises.delete(key);
            }
          })();
        } else {
          console.log(`[EnvironmentContextService] Cache HIT for key=${key}`);
        }
        return cached.context;
      }
    }

    // 2. Pending promise sharing (deduplication)
    if (this.pendingPromises.has(key)) {
      console.log(`[EnvironmentContextService] Sharing pending request for key=${key}`);
      return this.pendingPromises.get(key)!;
    }

    const fetchPromise = (async (): Promise<EnvironmentContext> => {
      try {
        const weatherData: WeatherData = await weatherService.getWeatherForLocation(lat, lng);
        const w = weatherData.weather;
        
        const context: EnvironmentContext = {
          lat,
          lng,
          weatherCondition: w.condition,
          temperature: w.temperature,
          humidity: w.humidity,
          windSpeed: w.windSpeed,
          pressure: w.pressure,
          stormRisk: w.stormProbability,
          airQuality: w.airQuality,
          environmentalRisk: w.environmentalStability,
          timestamp: Date.now(),
          isStale: false,
        };

        return context;
      } catch (error) {
        console.error(`[EnvironmentContextService] Error building environment context:`, error);
        return {
          lat,
          lng,
          weatherCondition: 'DATA_UNAVAILABLE',
          temperature: 0,
          humidity: 0,
          windSpeed: 0,
          pressure: 1013,
          stormRisk: 0,
          airQuality: 'GOOD',
          environmentalRisk: 'STABLE',
          timestamp: Date.now(),
          isStale: true,
        };
      }
    })();

    this.pendingPromises.set(key, fetchPromise);
    try {
      const context = await fetchPromise;
      if (context.weatherCondition !== 'DATA_UNAVAILABLE') {
        this.cache.set(key, { context, timestamp: Date.now() });
      }
      return context;
    } finally {
      this.pendingPromises.delete(key);
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.pendingPromises.clear();
  }
}

export const environmentContextService = EnvironmentContextService.getInstance();
