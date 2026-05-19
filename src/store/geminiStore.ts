import { create } from 'zustand';
import { geminiService, GeminiAnalysis } from '@services/geminiService';

interface GeminiState {
  analysis: GeminiAnalysis | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  fetchAnalysis: (lat: number, lng: number) => Promise<void>;
  startPolling: (lat: number, lng: number) => void;
  stopPolling: () => void;
}

export const useGeminiStore = create<GeminiState>((set, get) => ({
  analysis: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  pollingIntervalId: null,

  fetchAnalysis: async (lat: number, lng: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await geminiService.getAnalysis(lat, lng);
      set({
        analysis: result,
        isLoading: false,
        lastUpdated: Date.now(),
        error: null,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message ?? 'AI analysis failed',
      });
    }
  },

  startPolling: (lat: number, lng: number) => {
    const { pollingIntervalId, fetchAnalysis } = get();
    if (pollingIntervalId) clearInterval(pollingIntervalId);

    fetchAnalysis(lat, lng);

    // Poll every 60 seconds (AI analysis is more expensive)
    const id = setInterval(() => fetchAnalysis(lat, lng), 60000);
    set({ pollingIntervalId: id });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },
}));
