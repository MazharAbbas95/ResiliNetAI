import { create } from 'zustand';
import { analystService, AnalystData } from '../services/analystService';

interface AnalystState {
  analysis: AnalystData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchAnalysis: (lat: number, lng: number) => Promise<void>;
  startPolling: (lat: number, lng: number, intervalMs?: number) => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useAnalystStore = create<AnalystState>((set, get) => ({
  analysis: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchAnalysis: async (lat: number, lng: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await analystService.getStrategicAnalysis(lat, lng);
      set({ 
        analysis: data, 
        isLoading: false, 
        lastUpdated: Date.now() 
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Analyst connection failed', 
        isLoading: false 
      });
    }
  },

  startPolling: (lat: number, lng: number, intervalMs = 15000) => {
    if (pollingInterval) clearInterval(pollingInterval);
    get().fetchAnalysis(lat, lng);
    pollingInterval = setInterval(() => {
      get().fetchAnalysis(lat, lng);
    }, intervalMs);
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
}));
