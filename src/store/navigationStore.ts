import { create } from 'zustand';

export type NavigationState = 'IDLE' | 'CALCULATING' | 'ACTIVE' | 'REROUTING' | 'FAILED' | 'ARRIVED';

interface RouteInfo {
  distance: string;
  duration: string;
  coordinates: { latitude: number; longitude: number }[];
  destination: { latitude: number; longitude: number };
}

interface NavigationStore {
  state: NavigationState;
  routeInfo: RouteInfo | null;
  setNavigationState: (state: NavigationState) => void;
  setRoute: (info: RouteInfo) => void;
  clearRoute: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  state: 'IDLE',
  routeInfo: null,

  setNavigationState: (state) => set({ state }),

  setRoute: (info) => set({ 
    routeInfo: info,
    state: 'ACTIVE'
  }),

  clearRoute: () => set({ 
    routeInfo: null, 
    state: 'IDLE' 
  }),
}));
