import { create } from 'zustand';
import { confidenceService, ConfidenceData } from '../services/confidenceService';

interface ConfidenceState {
  analysis: ConfidenceData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchAnalysis: (lat: number, lng: number) => Promise<void>;
  reset: () => void;
}

export const useConfidenceStore = create<ConfidenceState>((set) => ({
  analysis: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchAnalysis: async (lat: number, lng: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await confidenceService.getConfidenceAnalysis(lat, lng);
      set({ 
        analysis: data, 
        isLoading: false, 
        lastUpdated: Date.now() 
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to sync intelligence', 
        isLoading: false 
      });
    }
  },

  reset: () => set({ analysis: null, error: null, isLoading: false, lastUpdated: null }),
}));
