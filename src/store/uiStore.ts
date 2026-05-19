import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  error: string | null;
  isEmergencyOverlayVisible: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleEmergencyOverlay: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  error: null,
  isEmergencyOverlayVisible: false,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleEmergencyOverlay: () => set((state) => ({ isEmergencyOverlayVisible: !state.isEmergencyOverlayVisible })),
}));
