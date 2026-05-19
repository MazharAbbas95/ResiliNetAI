import { create } from 'zustand';
import { socialSignalService, FloodReport } from '@services/socialSignalService';

interface SocialSignalState {
  reports: FloodReport[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  fetchReports: () => Promise<void>;
  addReport: (report: FloodReport) => void;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useSocialSignalStore = create<SocialSignalState>((set, get) => ({
  reports: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  pollingIntervalId: null,

  fetchReports: async () => {
    const { reports } = get();
    const isFirstLoad = reports.length === 0;

    set(isFirstLoad ? { isLoading: true, error: null } : { isRefreshing: true, error: null });

    try {
      const response = await socialSignalService.getReports();
      set({
        reports: response.reports,
        isLoading: false,
        isRefreshing: false,
        lastUpdated: Date.now(),
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        isRefreshing: false,
        error: error.message ?? 'Failed to load social signals',
      });
    }
  },

  addReport: (report) => {
    const { reports } = get();
    const now = Date.now();

    // 15-second spam suppression rate limiter
    const isSpamming = reports.some(r => {
      const timeDiff = now - r.timestamp;
      const isSameCoords = Math.abs(r.coordinates.lat - report.coordinates.lat) < 0.0001 &&
                           Math.abs(r.coordinates.lng - report.coordinates.lng) < 0.0001;
      const isSameText = r.text.trim().toLowerCase() === report.text.trim().toLowerCase();
      return (timeDiff < 15000) && (isSameCoords || isSameText);
    });

    if (isSpamming) {
      console.warn('[SocialSignalStore] Blocked report submission: spam rate-limit active.');
      return;
    }

    set((state) => ({
      reports: [report, ...state.reports],
      lastUpdated: Date.now()
    }));
  },

  startPolling: () => {
    const { pollingIntervalId, fetchReports } = get();

    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    // Initial fetch immediately
    fetchReports();

    // Poll every 45 seconds
    const intervalId = setInterval(() => {
      fetchReports();
    }, 45000);

    set({ pollingIntervalId: intervalId });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },
}));
