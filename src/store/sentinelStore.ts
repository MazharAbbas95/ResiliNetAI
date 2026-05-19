import { create } from 'zustand';
import { sentinelService, SentinelPayload } from '@services/sentinelService';

interface SentinelState {
  payload: SentinelPayload | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  validate: (lat: number, lng: number) => Promise<void>;
  startPolling: (lat: number, lng: number) => void;
  stopPolling: () => void;
}

export const useSentinelStore = create<SentinelState>((set, get) => ({
  payload: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  pollingIntervalId: null,

  validate: async (lat: number, lng: number) => {
    const { payload } = get();
    const isFirst = !payload;

    set(isFirst ? { isLoading: true, error: null } : { isRefreshing: true, error: null });

    try {
      const result = await sentinelService.getValidatedPayload(lat, lng);
      set({
        payload: result,
        isLoading: false,
        isRefreshing: false,
        lastUpdated: Date.now(),
        error: null,
      });
    } catch (err: any) {
      console.error('[SentinelStore] Validation failed:', err.message ?? err);
      set({
        isLoading: false,
        isRefreshing: false,
        error: err.message ?? 'Sentinel validation failed',
      });
    }
  },

  startPolling: (lat: number, lng: number) => {
    const { pollingIntervalId, validate } = get();

    if (pollingIntervalId) clearInterval(pollingIntervalId);

    // Immediate first run
    validate(lat, lng);

    // Poll every 45 seconds (slightly slower than aggregator to allow for processing)
    const id = setInterval(() => validate(lat, lng), 45000);
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
