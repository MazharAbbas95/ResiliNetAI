import { create } from 'zustand';
import { signalAggregatorService, AggregatedSignalPayload, HazardSeverity } from '@services/signalAggregatorService';

interface SignalState {
  payload: AggregatedSignalPayload | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  aggregate: (lat: number, lng: number) => Promise<void>;
  startPolling: (lat: number, lng: number) => void;
  stopPolling: () => void;
}

// ─── Severity UI Helpers (exported for UI components) ─────────────────────────

export const SEVERITY_COLOR: Record<HazardSeverity, string> = {
  low:      '#22C55E',
  medium:   '#EAB308',
  high:     '#F97316',
  critical: '#EF4444',
};

export const SEVERITY_LABEL: Record<HazardSeverity, string> = {
  low:      '🟢 LOW',
  medium:   '🟡 MEDIUM',
  high:     '🟠 HIGH',
  critical: '🔴 CRITICAL',
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSignalStore = create<SignalState>((set, get) => ({
  payload: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  pollingIntervalId: null,

  aggregate: async (lat: number, lng: number) => {
    const { payload } = get();
    const isFirst = !payload;

    set(isFirst ? { isLoading: true, error: null } : { isRefreshing: true, error: null });

    try {
      const result = await signalAggregatorService.aggregate(lat, lng);
      set({
        payload: result,
        isLoading: false,
        isRefreshing: false,
        lastUpdated: Date.now(),
        error: null,
      });
    } catch (err: any) {
      console.error('[SignalStore] Aggregation failed:', err.message ?? err);
      set({
        isLoading: false,
        isRefreshing: false,
        error: err.message ?? 'Signal aggregation failed',
      });
    }
  },

  startPolling: (lat: number, lng: number) => {
    const { pollingIntervalId, aggregate } = get();

    if (pollingIntervalId) clearInterval(pollingIntervalId);

    // Immediate first run
    aggregate(lat, lng);

    // Poll every 30 seconds
    const id = setInterval(() => aggregate(lat, lng), 30000);
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
