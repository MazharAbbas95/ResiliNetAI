import { create } from 'zustand';
import { weatherService, WeatherData } from '@/services/weatherService';

interface WeatherState {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  pollingIntervalId: NodeJS.Timeout | null;
  
  fetchWeather: (lat: number, lng: number) => Promise<void>;
  startPolling: (lat: number, lng: number) => void;
  stopPolling: () => void;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weatherData: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  pollingIntervalId: null,

  fetchWeather: async (lat: number, lng: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await weatherService.getWeatherForLocation(lat, lng);
      set({ 
        weatherData: data, 
        isLoading: false, 
        lastUpdated: Date.now() 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch weather data' 
      });
    }
  },

  startPolling: (lat: number, lng: number) => {
    const { pollingIntervalId, fetchWeather } = get();
    
    // Avoid multiple intervals
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }
    
    // Initial fetch
    fetchWeather(lat, lng);
    
    // Set up polling every 60 seconds (60000 ms)
    const intervalId = setInterval(() => {
      fetchWeather(lat, lng);
    }, 60000);
    
    set({ pollingIntervalId: intervalId });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  }
}));
